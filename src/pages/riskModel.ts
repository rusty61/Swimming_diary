import { DailyEntry } from "@/data/dailyEntriesSupabase";
import { DailyMetrics, upsertRiskScores } from "@/data/dailyMetricsSupabase";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

function rollingAvg(values: number[], window: number) {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    out.push(avg(values.slice(start, i + 1)));
  }
  return out;
}

export async function computeAndSaveOptionARisk(
  userId: string,
  date: string,
  entries: DailyEntry[],
  metricsRows: any[]
) {
  // Build aligned timeline
  const byDateEntry = new Map(entries.map(e => [e.date, e]));
  const byDateMet = new Map(metricsRows.map((m: any) => [m.date, m]));

  const dates = Array.from(new Set([...byDateEntry.keys(), ...byDateMet.keys()]))
    .sort();

  const loads: number[] = [];
  const moods: number[] = [];
  const restHRs: number[] = [];

  for (const d of dates) {
    const e = byDateEntry.get(d);
    const m = byDateMet.get(d);

    const vol = e?.trainingVolume ?? 0;
    const rpe = m?.rpe ?? null;

    const sessionLoad = rpe != null ? vol * rpe : vol;
    loads.push(sessionLoad);

    moods.push(e?.mood ?? 0);

    if (m?.resting_hr != null) restHRs.push(m.resting_hr);
  }

  // Rolling loads
  const atl = rollingAvg(loads, 7);
  const ctl = rollingAvg(loads, 28);
  const acwr = atl.map((a, i) => (ctl[i] > 0 ? a / ctl[i] : 1));

  const latestIdx = dates.indexOf(date);
  if (latestIdx < 0) return; // no data yet

  const latestACWR = acwr[latestIdx] ?? 1;

  // Mood baseline & drop
  const moodBase = median(moods.slice(Math.max(0, latestIdx - 21), latestIdx + 1));
  const moodNow = moods[latestIdx] ?? moodBase;
  const moodDropPct = moodBase > 0 ? ((moodBase - moodNow) / moodBase) * 100 : 0;

  // Resting HR baseline if present
  const hrBase = median(restHRs.slice(-21));
  const hrNow = byDateMet.get(date)?.resting_hr ?? hrBase;
  const hrDelta = hrNow - hrBase;

  // Recent tags
  const recentMet = dates
    .slice(Math.max(0, latestIdx - 6), latestIdx + 1)
    .map(d => byDateMet.get(d))
    .filter(Boolean);

  const fatigue7 = recentMet.reduce((s, m) => s + (m?.fatigue_tag ?? 0), 0);
  const stress7 = recentMet.reduce((s, m) => s + (m?.stress_tag ?? 0), 0);
  const pain7 = recentMet.reduce((s, m) => s + (m?.pain_tag ?? 0), 0);

  // Risk rules (Option A)
  let overtrainRisk = 0;
  let motivationRisk = 0;
  let performanceRisk = 0;
  const drivers: string[] = [];

  // Overtraining via ACWR
  if (latestACWR > 1.5) {
    overtrainRisk += 0.7;
    drivers.push(`Load spike: ACWR ${latestACWR.toFixed(2)}`);
  } else if (latestACWR > 1.3) {
    overtrainRisk += 0.4;
    drivers.push(`Rising load: ACWR ${latestACWR.toFixed(2)}`);
  }

  // Resting HR strain
  if (hrDelta >= 8) {
    overtrainRisk += 0.4;
    drivers.push(`Resting HR +${hrDelta.toFixed(0)} bpm vs baseline`);
  } else if (hrDelta >= 5) {
    overtrainRisk += 0.2;
    drivers.push(`Resting HR elevated (+${hrDelta.toFixed(0)} bpm)`);
  }

  // Fatigue tags
  if (fatigue7 >= 3) {
    overtrainRisk += 0.2;
    drivers.push(`Fatigue noted ${fatigue7}× in 7d`);
  }

  // Motivation risk from mood + stress after load
  if (moodDropPct >= 20) {
    motivationRisk += 0.5;
    drivers.push(`Mood down ${moodDropPct.toFixed(0)}% vs baseline`);
  } else if (moodDropPct >= 15) {
    motivationRisk += 0.3;
    drivers.push(`Mood slipping (${moodDropPct.toFixed(0)}%)`);
  }

  if (stress7 >= 3) {
    motivationRisk += 0.2;
    drivers.push(`Stress flagged ${stress7}× in 7d`);
  }

  if (latestACWR > 1.3 && moodDropPct > 10) {
    motivationRisk += 0.2;
    drivers.push(`Load up while mood trending down`);
  }

  // Performance risk blend + pain
  performanceRisk = 0.5 * overtrainRisk + 0.5 * motivationRisk;
  if (pain7 >= 2) {
    performanceRisk += 0.2;
    drivers.push(`Pain/soreness noted ${pain7}× in 7d`);
  }

  overtrainRisk = clamp01(overtrainRisk);
  motivationRisk = clamp01(motivationRisk);
  performanceRisk = clamp01(performanceRisk);

  await upsertRiskScores({
    userId,
    date,
    overtrainRisk,
    motivationRisk,
    performanceRisk,
    drivers: drivers.slice(0, 4),
    modelVersion: "A-1",
  });
}
