// src/utils/riskModel.ts
import { DailyEntry } from "@/data/dailyEntriesSupabase";
import { upsertRiskScores } from "@/data/dailyMetricsSupabase";

/**
 * Option A — Rules + Trends early-warning model (no ML).
 * IMPORTANT:
 * - Keep exports/signature stable for existing callers.
 * - Do NOT touch UI style/date/data-access patterns.
 */

type DailyMetricsRow = {
  date: string; // YYYY-MM-DD
  rpe?: number | null;
  restingHr?: number | null;
  resting_hr?: number | null;
  noteSentiment?: number | null;
  note_sentiment?: number | null;

  fatigueTag?: number | null;   fatigue_tag?: number | null;
  stressTag?: number | null;    stress_tag?: number | null;
  painTag?: number | null;      pain_tag?: number | null;
  confidenceTag?: number | null;confidence_tag?: number | null;
  sleepTag?: number | null;     sleep_tag?: number | null;
  nutritionTag?: number | null; nutrition_tag?: number | null;
};

type RiskScores = {
  userId: string;
  date: string;
  overtrainRisk: number;     // 0..1
  motivationRisk: number;    // 0..1
  performanceRisk: number;   // 0..1
  drivers: string[];
  modelVersion?: string;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const stddev = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  const v = avg(arr.map(x => (x - m) ** 2));
  return Math.sqrt(v);
};

const toKey = (d: string) => d.slice(0, 10);

function rollingAvg(values: number[], window: number) {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    out.push(avg(slice));
  }
  return out;
}

/** ---- light notes NLP fallback ---- */
const NEG_WORDS = [
  "tired","flat","sore","ache","pain","can't sleep","cant sleep",
  "stressed","anxious","overwhelmed","heavy","ill","sick","injury",
  "tight","cramp","exhausted","fatigue","burnout"
];
const POS_WORDS = [
  "good","great","strong","happy","fresh","energized","excited","confident",
  "sharp","better","proud","motivated","ready"
];

const TAG_DICT: Record<string, string[]> = {
  fatigue:    ["tired","fatigue","exhausted","flat","heavy","burnout"],
  stress:     ["stress","stressed","anxious","overwhelmed","pressure"],
  pain:       ["sore","pain","ache","injury","tight","cramp"],
  confidence: ["confident","confidence","ready","strong","sharp"],
  sleep:      ["sleep","can't sleep","cant sleep","insomnia","restless"],
  nutrition:  ["hungry","ate","food","nutrition","fuel","hydrated","dehydrated"],
};

function analyzeNotes(notes: string) {
  const text = (notes || "").toLowerCase();
  let neg = 0, pos = 0;
  for (const w of NEG_WORDS) if (text.includes(w)) neg++;
  for (const w of POS_WORDS) if (text.includes(w)) pos++;

  // crude sentiment in [-1..+1]
  const sentRaw = pos - neg;
  const sentiment = clamp01((sentRaw + 5) / 10) * 2 - 1;

  const tags: Record<string, number> = {};
  for (const [tag, words] of Object.entries(TAG_DICT)) {
    tags[tag] = words.reduce((c, w) => c + (text.includes(w) ? 1 : 0), 0);
  }

  return { sentiment, tags };
}

/** ---- core compute ---- */
function computeOptionAForDate(
  userId: string,
  dateStr: string,
  entries: DailyEntry[],
  metricsRows: DailyMetricsRow[]
): RiskScores | null {
  const drivers: string[] = [];

  const eByDate = new Map<string, DailyEntry>();
  for (const e of entries) eByDate.set(toKey(e.date), e);

  const mByDate = new Map<string, DailyMetricsRow>();
  for (const m of metricsRows) mByDate.set(toKey(m.date), m);

  const allDates = Array.from(
    new Set([
      ...entries.map(e => toKey(e.date)),
      ...metricsRows.map(m => toKey(m.date)),
      dateStr,
    ])
  ).sort();

  if (!allDates.length) return null;
  const tIndex = allDates.indexOf(dateStr);

  // 1) Training load math (volume * RPE if available)
  const sessionLoads = allDates.map(dk => {
    const e = eByDate.get(dk);
    const m = mByDate.get(dk);
    const vol = e?.trainingVolume ?? null;
    const rpe = m?.rpe ?? null;
    if (vol == null) return 0;
    return rpe == null ? vol : vol * rpe;
  });

  const atlSeries = rollingAvg(sessionLoads, 7);
  const ctlSeries = rollingAvg(sessionLoads, 28);
  const acwrSeries = atlSeries.map((atl, i) => {
    const ctl = ctlSeries[i];
    return ctl > 1e-6 ? atl / ctl : 0;
  });

  const acwr = acwrSeries[tIndex] ?? 0;

  const avg28 = avg(sessionLoads.slice(Math.max(0, tIndex - 27), tIndex + 1));
  const todayLoad = sessionLoads[tIndex] ?? 0;
  const spikePct = avg28 > 0 ? (todayLoad - avg28) / avg28 : 0;

  let overtrainRisk = 0;

  let consecHigh = 0;
  for (let i = tIndex; i >= 0; i--) {
    if ((acwrSeries[i] ?? 0) > 1.3) consecHigh++;
    else break;
  }
  if (consecHigh >= 3) {
    overtrainRisk = Math.max(overtrainRisk, 0.5);
    drivers.push(`ACWR > 1.3 for ${consecHigh} days`);
  }
  if (acwr > 1.5 || spikePct > 0.30) {
    overtrainRisk = Math.max(overtrainRisk, 0.8);
    if (acwr > 1.5) drivers.push(`ACWR high (${acwr.toFixed(2)})`);
    if (spikePct > 0.30) drivers.push(`Load spike +${Math.round(spikePct*100)}% vs 4w avg`);
  } else if (acwr > 1.0) {
    const ramp = (acwr - 1.0) / 0.5;
    overtrainRisk = Math.max(overtrainRisk, clamp01(ramp) * 0.6);
    if (acwr > 1.1) drivers.push(`ACWR elevated (${acwr.toFixed(2)})`);
  }

  // 2) Resting HR strain trend (+5–8 bpm for 3 days)
  const hrSeries = allDates.map(dk => {
    const m = mByDate.get(dk);
    const hr = m?.restingHr ?? m?.resting_hr ?? null;
    return hr == null ? NaN : hr;
  });

  const hrPast21: number[] = [];
  for (let i = Math.max(0, tIndex - 21); i < tIndex; i++) {
    const v = hrSeries[i];
    if (!Number.isNaN(v)) hrPast21.push(v);
  }
  const hrBaseline = median(hrPast21);
  const hrToday = hrSeries[tIndex];

  if (hrBaseline > 0 && !Number.isNaN(hrToday)) {
    let high3 = 0;
    let maxDelta3 = 0;
    for (let i = Math.max(0, tIndex - 2); i <= tIndex; i++) {
      const v = hrSeries[i];
      if (!Number.isNaN(v)) {
        const d = v - hrBaseline;
        if (d >= 5) high3++;
        if (d > maxDelta3) maxDelta3 = d;
      }
    }
    if (high3 >= 3 && maxDelta3 >= 8) {
      overtrainRisk = Math.max(overtrainRisk, 0.9);
      drivers.push(`Resting HR +${maxDelta3.toFixed(0)} bpm for 3 days`);
    } else if (high3 >= 3) {
      overtrainRisk = Math.max(overtrainRisk, overtrainRisk + 0.2);
      drivers.push(`Resting HR elevated 3d`);
    }
  }

  // 3) Mood / motivation trend
  const moodSeries = allDates.map(dk => eByDate.get(dk)?.mood ?? 0);

  const moodPast21: number[] = [];
  for (let i = Math.max(0, tIndex - 21); i < tIndex; i++) {
    const v = moodSeries[i];
    if (v > 0) moodPast21.push(v);
  }
  const moodBaseline = median(moodPast21);
  const moodToday = moodSeries[tIndex] ?? 0;

  let motivationRisk = 0;

  if (moodBaseline > 0) {
    let downCount = 0;
    for (let i = Math.max(0, tIndex - 5); i <= tIndex; i++) {
      const md = moodSeries[i] ?? moodBaseline;
      const dropPct = (moodBaseline - md) / moodBaseline;
      if (dropPct >= 0.20) downCount++;
    }
    const dropTodayPct = (moodBaseline - moodToday) / moodBaseline;

    if (downCount >= 4) {
      motivationRisk = Math.max(motivationRisk, 0.6);
      drivers.push(`Mood ↓≥20% on ${downCount}/6 days`);
    } else if (dropTodayPct >= 0.20) {
      motivationRisk = Math.max(motivationRisk, 0.35);
      drivers.push(`Mood below baseline`);
    }

    const last6Moods = moodSeries.slice(Math.max(0, tIndex - 5), tIndex + 1);
    const sd6 = stddev(last6Moods);
    if (sd6 >= 1.2 && spikePct > 0.20) {
      motivationRisk = Math.max(motivationRisk, motivationRisk + 0.2);
      drivers.push(`Mood volatility up after load jump`);
    }
  }

  // 4) Notes → tags & sentiment
  const last7Dates = allDates.slice(Math.max(0, tIndex - 6), tIndex + 1);
  let sentVals: number[] = [];
  const tagTotals: Record<string, number> = {
    fatigue: 0, stress: 0, pain: 0, confidence: 0, sleep: 0, nutrition: 0
  };

  for (const dk of last7Dates) {
    const m = mByDate.get(dk);
    const e = eByDate.get(dk);

    const storedSent = m?.noteSentiment ?? m?.note_sentiment ?? null;
    if (storedSent != null) sentVals.push(storedSent);
    else if (e?.notes) sentVals.push(analyzeNotes(e.notes).sentiment);

    const getTag = (camel: keyof DailyMetricsRow, snake: keyof DailyMetricsRow, word: string) => {
      const v = (m as any)?.[camel] ?? (m as any)?.[snake];
      if (typeof v === "number") return v;
      if (e?.notes?.toLowerCase().includes(word)) return 1;
      return 0;
    };

    tagTotals.fatigue += getTag("fatigueTag","fatigue_tag","tired");
    tagTotals.stress += getTag("stressTag","stress_tag","stress");
    tagTotals.pain += getTag("painTag","pain_tag","sore");
    tagTotals.confidence += getTag("confidenceTag","confidence_tag","confident");
    tagTotals.sleep += getTag("sleepTag","sleep_tag","sleep");
    tagTotals.nutrition += getTag("nutritionTag","nutrition_tag","food");
  }

  const avgSent7 = sentVals.length ? avg(sentVals) : 0;

  if (tagTotals.fatigue >= 3) {
    overtrainRisk = Math.max(overtrainRisk, overtrainRisk + 0.15);
    drivers.push(`Fatigue noted ${tagTotals.fatigue}× in 7d`);
  }
  if (tagTotals.pain >= 2) {
    overtrainRisk = Math.max(overtrainRisk, overtrainRisk + 0.15);
    drivers.push(`Pain/soreness noted ${tagTotals.pain}× in 7d`);
  }
  if (tagTotals.stress >= 3) {
    motivationRisk = Math.max(motivationRisk, motivationRisk + 0.15);
    drivers.push(`Stress noted ${tagTotals.stress}× in 7d`);
  }

  if (avgSent7 <= -0.3) {
    motivationRisk = Math.max(motivationRisk, motivationRisk + 0.2);
    drivers.push(`Notes sentiment negative`);
  } else if (avgSent7 >= 0.3) {
    motivationRisk = Math.max(0, motivationRisk - 0.1);
  }

  if (tagTotals.confidence >= 3) {
    motivationRisk = Math.max(0, motivationRisk - 0.15);
    drivers.push(`Confidence strong recently`);
  }

  overtrainRisk = clamp01(overtrainRisk);
  motivationRisk = clamp01(motivationRisk);

  const performanceRisk = clamp01(
    0.6 * overtrainRisk +
    0.3 * motivationRisk +
    (tagTotals.pain >= 3 ? 0.1 : 0)
  );

  if (performanceRisk >= 0.7) drivers.push("Performance risk high (combined signals)");

  return {
    userId,
    date: dateStr,
    overtrainRisk,
    motivationRisk,
    performanceRisk,
    drivers,
    modelVersion: "A-2",
  };
}

/**
 * Public API used by existing code.
 * Keep signature stable.
 */
export async function computeAndSaveOptionARisk(
  userId: string,
  dateStr: string,
  recentEntries: DailyEntry[],
  metricsRows: DailyMetricsRow[]
) {
  const entries = (recentEntries ?? []).slice().sort((a, b) => toKey(a.date).localeCompare(toKey(b.date)));
  const metrics = (metricsRows ?? []).slice().sort((a, b) => toKey(a.date).localeCompare(toKey(b.date)));

  const risk = computeOptionAForDate(userId, dateStr, entries, metrics);
  if (!risk) return null;

  try {
    await upsertRiskScores({
      userId: risk.userId,
      date: risk.date,
      overtrainRisk: risk.overtrainRisk,
      motivationRisk: risk.motivationRisk,
      performanceRisk: risk.performanceRisk,
      drivers: risk.drivers,
      modelVersion: risk.modelVersion,
    } as any);
  } catch {
    // fail-soft: app must remain usable even if risk table/RLS blocks
  }

  return risk;
}
