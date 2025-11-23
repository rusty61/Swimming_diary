import { format, parseISO, isValid, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { fetchMetricsLastNDays } from "@/data/dailyMetricsSupabase";
import { computeAndSaveOptionARisk } from "@/utils/riskModel";

export type DailyEntry = {
  id?: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  mood: number; // 0..5
  heartRate: number | null;
  trainingVolume: number | null;
  notes: string;
  periodSymptoms?: string;
  createdAt?: string;
  updatedAt?: string;
};

const rowToEntry = (row: any): DailyEntry => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  mood: row.mood ?? 0,
  heartRate: row.heart_rate ?? null,
  trainingVolume: row.training_volume ?? null,
  notes: row.notes ?? "",
  periodSymptoms: row.period_symptoms ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * HARDEN date handling:
 * Accepts "yyyy-MM-dd", ISO, or JS Date string; returns "yyyy-MM-dd".
 * This prevents PostgREST trying to parse "GMT+1100".
 */
const toDateStr = (input: string): string => {
  // If it is already yyyy-MM-dd, keep it
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  // Try ISO parse first
  const iso = parseISO(input);
  if (isValid(iso)) return format(iso, "yyyy-MM-dd");

  // Fall back to native Date parse (handles "Tue Nov 18 2025 ... GMT+1100")
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date input: ${input}`);
  }
  return format(d, "yyyy-MM-dd");
};

export const fetchAllEntriesForUser = async (
  userId: string
): Promise<DailyEntry[]> => {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToEntry);
};

export const fetchEntryForDate = async (
  userId: string,
  date: string
): Promise<DailyEntry | null> => {
  const dateStr = toDateStr(date);

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToEntry(data) : null;
};

export const upsertDailyEntry = async (
  userId: string,
  patch: Partial<DailyEntry> & { date: string }
): Promise<DailyEntry> => {
  const dateStr = toDateStr(patch.date);

  const row = {
    user_id: userId,
    date: dateStr,
    mood: patch.mood ?? undefined,
    heart_rate: patch.heartRate ?? undefined,
    training_volume: patch.trainingVolume ?? undefined,
    notes: patch.notes ?? undefined,
    period_symptoms: patch.periodSymptoms ?? undefined,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("daily_entries")
    .upsert(row, { onConflict: "user_id,date" })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  const saved = rowToEntry(data);

  // -------- Option A risk compute (safe/no-crash) ----------
  try {
    // Pull last 42 days of entries
    const fromDate = format(subDays(new Date(dateStr), 42), "yyyy-MM-dd");

    const { data: recentEntries } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("date", fromDate)
      .order("date", { ascending: true });

    const metricsRows = await fetchMetricsLastNDays(userId, 42);

    await computeAndSaveOptionARisk(
      userId,
      dateStr,
      (recentEntries ?? []).map(rowToEntry),
      metricsRows
    );
  } catch {
    // swallow errors (tables may not exist yet / no data yet)
  }

  return saved;
};

export const fetchEntriesForLastNDays = async (
  userId: string,
  days: number
): Promise<DailyEntry[]> => {
  const fromDate = format(subDays(new Date(), days), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToEntry);
};

// ------- Stats helpers (unchanged) -------

export const getWeeklyTrainingVolumeFromEntries = (entries: DailyEntry[]) => {
  const map: Record<string, number> = {};
  for (const e of entries) {
    const dt = parseISO(e.date);
    if (!isValid(dt)) continue;
    const wk = format(dt, "yyyy-'W'ww");
    map[wk] = (map[wk] ?? 0) + (e.trainingVolume ?? 0);
  }
  return map;
};

export const getWeeklyAverageHeartRateFromEntries = (entries: DailyEntry[]) => {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const e of entries) {
    const dt = parseISO(e.date);
    if (!isValid(dt) || e.heartRate == null) continue;
    const wk = format(dt, "yyyy-'W'ww");
    if (!map[wk]) map[wk] = { sum: 0, count: 0 };
    map[wk].sum += e.heartRate;
    map[wk].count += 1;
  }
  const out: Record<string, number> = {};
  for (const wk of Object.keys(map)) {
    out[wk] = map[wk].count ? map[wk].sum / map[wk].count : 0;
  }
  return out;
};

export const getWeeklyMoodTrendFromEntries = (entries: DailyEntry[]) => {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const e of entries) {
    const dt = parseISO(e.date);
    if (!isValid(dt)) continue;
    const wk = format(dt, "yyyy-'W'ww");
    if (!map[wk]) map[wk] = { sum: 0, count: 0 };
    map[wk].sum += e.mood ?? 0;
    map[wk].count += 1;
  }
  const out: Record<string, number> = {};
  for (const wk of Object.keys(map)) {
    out[wk] = map[wk].count ? map[wk].sum / map[wk].count : 0;
  }
  return out;
};

export const getWeeklyTrainingAveragesFromEntries = (entries: DailyEntry[]) => {
  // keep your existing function behavior
  const weeklyAverages: { week: string; average: number }[] = [];
  const mapByWeek: Record<string, DailyEntry[]> = {};

  for (const e of entries) {
    const dt = parseISO(e.date);
    if (!isValid(dt)) continue;
    const wk = format(dt, "yyyy-'W'ww");
    if (!mapByWeek[wk]) mapByWeek[wk] = [];
    mapByWeek[wk].push(e);
  }

  const weeks = Object.keys(mapByWeek).sort();
  for (const wk of weeks) {
    const arr = mapByWeek[wk];
    const total = arr.reduce((s, x) => s + (x.trainingVolume || 0), 0);
    const avgVol = arr.length ? total / arr.length : 0;
    weeklyAverages.push({ week: wk, average: parseFloat(avgVol.toFixed(2)) });
  }

  return weeklyAverages;
};
