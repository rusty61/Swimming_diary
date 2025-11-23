import { format, parseISO, isValid, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { fetchMetricsLastNDays } from "@/data/dailyMetricsSupabase";
import { computeAndSaveOptionARisk } from "@/utils/riskModel";

export type DailyEntry = {
  id?: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  mood: number; // 0..5
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
  trainingVolume: row.training_volume ?? null,
  notes: row.notes ?? "",
  periodSymptoms: row.period_symptoms ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

/**
 * normalizeDate
 * Accepts:
 *  - Date object
 *  - "yyyy-MM-dd"
 *  - ISO datetime "yyyy-MM-ddTHH:mm:ssZ"
 * Returns "yyyy-MM-dd" or throws.
 */
export function normalizeDate(input: Date | string): string {
  if (input instanceof Date) {
    return format(input, "yyyy-MM-dd");
  }
  const dt = parseISO(input);
  if (!isValid(dt)) {
    throw new Error(`Invalid date: ${input}`);
  }
  return format(dt, "yyyy-MM-dd");
}

export const fetchAllEntriesForUser = async (
  userId: string,
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
  date: Date | string,
): Promise<DailyEntry | null> => {
  const d = normalizeDate(date);

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", d)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToEntry(data) : null;
};

export const fetchEntriesForDateRange = async (
  userId: string,
  fromDate: Date | string,
  toDate: Date | string,
): Promise<DailyEntry[]> => {
  const from = normalizeDate(fromDate);
  const to = normalizeDate(toDate);

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToEntry(data));
};

export const fetchEntriesForLastNDays = async (
  userId: string,
  nDays: number,
  selectedDate?: Date,
): Promise<DailyEntry[]> => {
  const base = selectedDate ?? new Date();
  const fromDate = format(subDays(base, nDays), "yyyy-MM-dd");
  const toDate = format(base, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToEntry);
};

export const upsertDailyEntry = async (
  patch: Partial<DailyEntry> & { userId: string; date: Date | string },
): Promise<DailyEntry> => {
  const d = normalizeDate(patch.date);

  const row = {
    user_id: patch.userId,
    date: d,
    mood: patch.mood ?? undefined,
    training_volume: patch.trainingVolume ?? undefined,
    notes: patch.notes ?? undefined,
    period_symptoms: patch.periodSymptoms ?? undefined,
  };

  const { data, error } = await supabase
    .from("daily_entries")
    .upsert(row, { onConflict: "user_id,date" })
    .select("*")
    .single();

  if (error) throw error;

  // Optional: recompute risk after save
  try {
    const entries = await fetchEntriesForLastNDays(patch.userId, 30);
    const metrics = await fetchMetricsLastNDays(patch.userId, 30);
    await computeAndSaveOptionARisk(patch.userId, d, entries, metrics);
  } catch (e) {
    console.warn("[dailyEntriesSupabase] risk compute skipped:", e);
  }

  return rowToEntry(data);
};

export const deleteEntryForDate = async (
  userId: string,
  date: Date | string,
) => {
  const d = normalizeDate(date);
  const { error } = await supabase
    .from("daily_entries")
    .delete()
    .eq("user_id", userId)
    .eq("date", d);

  if (error) throw error;
};

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
