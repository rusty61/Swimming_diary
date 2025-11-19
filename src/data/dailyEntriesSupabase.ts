import { format, parseISO, isValid } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type DailyEntry = {
  id?: string;                  // Supabase row id
  userId: string;               // auth.users.id
  date: string;                 // "YYYY-MM-DD"
  mood: number;                 // 0..5
  heartRate: number | null;
  trainingVolume: number | null;
  notes: string;
  periodSymptoms?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Normalize a raw row from Supabase into our DailyEntry shape.
 */
const mapRowToDailyEntry = (row: any): DailyEntry => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  mood: row.mood ?? 0,
  heartRate: row.heart_rate ?? null,
  trainingVolume:
    row.training_volume !== null && row.training_volume !== undefined
      ? Number(row.training_volume)
      : null,
  notes: row.notes ?? "",
  periodSymptoms: row.period_symptoms ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

/**
 * Fetch ALL entries for a user.
 * For a normal diary this is fine (small dataset); we can filter in TS.
 */
export const fetchAllEntriesForUser = async (
  userId: string
): Promise<DailyEntry[]> => {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) {
    console.error("[dailyEntries] fetchAllEntriesForUser error:", error);
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((row) => typeof row.date === "string" && isValid(parseISO(row.date)))
    .map(mapRowToDailyEntry);
};

/**
 * Get entry for a specific date (YYYY-MM-DD).
 */
export const fetchEntryForDate = async (
  userId: string,
  date: Date
): Promise<DailyEntry | null> => {
  const dateStr = format(date, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned for single/maybeSingle
    console.error("[dailyEntries] fetchEntryForDate error:", error);
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapRowToDailyEntry(data);
};

export type UpsertDailyEntryInput = {
  date: Date | string;
  mood?: number;
  heartRate?: number | null;
  trainingVolume?: number | null;
  notes?: string;
  periodSymptoms?: string;
};

/**
 * Insert or update an entry for (userId, date).
 */
export const upsertDailyEntry = async (
  userId: string,
  input: UpsertDailyEntryInput
): Promise<DailyEntry> => {
  const dateStr =
    input.date instanceof Date
      ? format(input.date, "yyyy-MM-dd")
      : input.date;

  // Load existing row so we can merge instead of nuking fields
  const existing = await fetchEntryForDate(userId, dateStr);

  const payload = {
    user_id: userId,
    date: dateStr,

    // mood: if caller provided a value, use it; otherwise keep existing; fall back to 0
    mood:
      input.mood !== undefined
        ? input.mood
        : existing?.mood ?? 0,

    // heart_rate: allow explicit null to clear
    heart_rate:
      input.heartRate !== undefined
        ? input.heartRate
        : existing?.heartRate ?? null,

    // training_volume: allow explicit null to clear
    training_volume:
      input.trainingVolume !== undefined
        ? input.trainingVolume
        : existing?.trainingVolume ?? null,

    // notes: allow explicit empty string to clear
    notes:
      input.notes !== undefined
        ? input.notes
        : existing?.notes ?? "",

    period_symptoms:
      input.periodSymptoms !== undefined
        ? input.periodSymptoms
        : existing?.periodSymptoms ?? null,
  };

  const { data, error } = await supabase
    .from("daily_entries")
    .upsert(payload, {
      onConflict: "user_id,date",
      ignoreDuplicates: false,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[dailyEntries] upsertDailyEntry error:", error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Upsert succeeded but no row returned.");
  }

  return mapRowToDailyEntry(data);
};


/**
 * Get entries (or placeholders) for last N days up to endDate.
 * Missing days are filled with mood=0/null metrics for charting.
 */
export const fetchEntriesForLastNDays = async (
  userId: string,
  n: number,
  endDate: Date = new Date()
): Promise<DailyEntry[]> => {
  const all = await fetchAllEntriesForUser(userId);
  const mapByDate = new Map<string, DailyEntry>();

  for (const entry of all) {
    mapByDate.set(entry.date, entry);
  }

  const out: DailyEntry[] = [];

  for (let i = 0; i < n; i++) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    const dateStr = format(d, "yyyy-MM-dd");

    const existing = mapByDate.get(dateStr);

    if (existing) {
      out.unshift(existing);
    } else {
      out.unshift({
        userId,
        date: dateStr,
        mood: 0,
        heartRate: null,
        trainingVolume: null,
        notes: "",
      });
    }
  }

  return out;
};

/**
 * Helper: compute start & end of the week (Sunday as start) for a given date.
 */
const getWeekRange = (currentDate: Date): { startOfWeek: Date; endOfWeek: Date } => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

/**
 * Total and average training volume for the week of `currentDate`.
 * Average is across days that actually have an entry (not strictly 7 days).
 */
export const getWeeklyTrainingVolumeFromEntries = (
  allEntries: DailyEntry[],
  currentDate: Date
): { total: number; average: number; entries: DailyEntry[] } => {
  const { startOfWeek, endOfWeek } = getWeekRange(currentDate);

  const weeklyEntries = allEntries.filter((entry) => {
    const d = parseISO(entry.date);
    return d >= startOfWeek && d <= endOfWeek;
  });

  const total = weeklyEntries.reduce(
    (sum, e) => sum + (e.trainingVolume ?? 0),
    0
  );
  const average = weeklyEntries.length > 0 ? total / weeklyEntries.length : 0;

  return { total, average, entries: weeklyEntries };
};

/**
 * Average heart rate for the week of `currentDate`.
 * Only days with a non-null heartRate are included.
 */
export const getWeeklyAverageHeartRateFromEntries = (currentDate: Date, allEntries: DailyEntry[]): number => {
  const { startOfWeek, endOfWeek } = getWeekRange(currentDate);

  const weeklyEntries = allEntries.filter((entry) => {
    if (entry.heartRate == null) return false;
    const entryDate = parseISO(entry.date);
    return entryDate >= startOfWeek && entryDate <= endOfWeek;
  });

  const totalHr = weeklyEntries.reduce(
    (sum, entry) => sum + (entry.heartRate || 0),
    0
  );

  if (weeklyEntries.length === 0) return 0;
  return parseFloat((totalHr / weeklyEntries.length).toFixed(1));
};

/**
 * Returns a human-readable summary of mood for the week of `currentDate`.
 * Ignores days where mood === 0 (no data).
 */
export const getWeeklyMoodTrendFromEntries = (currentDate: Date, allEntries: DailyEntry[]): string => {
  const { startOfWeek, endOfWeek } = getWeekRange(currentDate);

  const weeklyEntries = allEntries.filter((entry) => {
    if (entry.mood === 0) return false;
    const entryDate = parseISO(entry.date);
    return entryDate >= startOfWeek && entryDate <= endOfWeek;
  });

  if (weeklyEntries.length === 0) return "No mood data";

  const totalMood = weeklyEntries.reduce((sum, entry) => sum + entry.mood, 0);
  const averageMood = totalMood / weeklyEntries.length;

  if (averageMood >= 4.5) return "Great week! 😁";
  if (averageMood >= 3.5) return "Good week! 😊";
  if (averageMood >= 2.5) return "Okay week. 😐";
  return "Tough week. 🙁";
};

/**
 * Average training volume per week over the last `numWeeks` weeks,
 * relative to "today".
 */
export const getWeeklyTrainingAveragesFromEntries = (
  numWeeks: number,
  allEntries: DailyEntry[]
): { week: string; average: number }[] => {
  const weeklyAverages: { week: string; average: number }[] = [];
  const today = new Date();

  for (let i = 0; i < numWeeks; i++) {
    const refDate = new Date(today);
    refDate.setDate(today.getDate() - i * 7);

    const { startOfWeek, endOfWeek } = getWeekRange(refDate);

    const weeklyEntries = allEntries.filter((entry) => {
      const entryDate = parseISO(entry.date);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    const totalVolume = weeklyEntries.reduce(
      (sum, entry) => sum + (entry.trainingVolume || 0),
      0
    );
    const averageVolume =
      weeklyEntries.length > 0 ? totalVolume / weeklyEntries.length : 0;

    weeklyAverages.unshift({
      week: `Week ${format(startOfWeek, "w")}`,
      average: parseFloat(averageVolume.toFixed(2)),
    });
  }

  return weeklyAverages;
};