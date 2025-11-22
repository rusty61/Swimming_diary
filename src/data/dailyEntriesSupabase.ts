// src/data/dailyEntriesSupabase.ts
import { format, parseISO, isValid } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type DailyEntry = {
  id?: string; // Supabase row id
  userId: string; // auth.users.id
  date: string; // "YYYY-MM-DD"
  mood: number; // 0..5
  heartRate: number | null;
  trainingVolume: number | null;
  notes: string;
  periodSymptoms?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DailyEntryRow = {
  id?: string;
  user_id: string;
  date: string;
  mood?: number | null;
  heart_rate?: number | null;
  training_volume?: number | null;
  notes?: string | null;
  period_symptoms?: string | null;
  created_at?: string;
  updated_at?: string;
};

/* ----------------- SAFE DATE HELPERS ----------------- */

/** Normalize any Date|string into "yyyy-MM-dd". Returns null if invalid. */
const normalizeToDateStr = (d: Date | string): string | null => {
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return null;
    return format(d, "yyyy-MM-dd");
  }
  if (typeof d !== "string" || !d.trim()) return null;

  // already date-only
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

  // try ISO parse
  try {
    const dt = parseISO(d);
    if (isValid(dt)) return format(dt, "yyyy-MM-dd");
  } catch {
    // ignore
  }

  // last resort Date()
  const dt2 = new Date(d);
  if (!isNaN(dt2.getTime())) return format(dt2, "yyyy-MM-dd");

  return null;
};

/** Safe parse ISO. Returns null instead of throwing. */
const safeParseISO = (s: string): Date | null => {
  try {
    const d = parseISO(s);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
};

/**
 * Normalize a raw row from Supabase into our DailyEntry shape.
 * Returns null if date invalid.
 */
const mapRowToDailyEntry = (row: DailyEntryRow): DailyEntry | null => {
  const normDate = normalizeToDateStr(row.date);
  if (!normDate) {
    console.warn("[dailyEntries] skipping invalid date row:", row.date, row);
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    date: normDate,
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
  };
};

/* ----------------- API ----------------- */

/**
 * Fetch ALL entries for a user.
 * Bad-date rows are skipped instead of crashing.
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

  const out: DailyEntry[] = [];
  for (const row of (data ?? []) as DailyEntryRow[]) {
    const mapped = mapRowToDailyEntry(row);
    if (mapped) out.push(mapped);
  }
  return out;
};

/**
 * Get entry for a specific date (YYYY-MM-DD).
 * Accepts Date OR string safely.
 */
export const fetchEntryForDate = async (
  userId: string,
  date: Date | string
): Promise<DailyEntry | null> => {
  const dateStr = normalizeToDateStr(date);
  if (!dateStr) return null;

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[dailyEntries] fetchEntryForDate error:", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return mapRowToDailyEntry(data as DailyEntryRow);
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
  const dateStr = normalizeToDateStr(input.date);
  if (!dateStr) throw new Error("Invalid date for upsert");

  // Load existing row so we can merge instead of nuking fields
  const existing = await fetchEntryForDate(userId, dateStr);

  const payload = {
    user_id: userId,
    date: dateStr,

    mood:
      input.mood !== undefined
        ? input.mood
        : existing?.mood ?? 0,

    heart_rate:
      input.heartRate !== undefined
        ? input.heartRate
        : existing?.heartRate ?? null,

    training_volume:
      input.trainingVolume !== undefined
        ? input.trainingVolume
        : existing?.trainingVolume ?? null,

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

  const mapped = mapRowToDailyEntry(data as DailyEntryRow);
  if (!mapped) throw new Error("Upsert returned invalid date row.");

  return mapped;
};

/**
 * Get entries (or placeholders) for last N days up to endDate.
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

/* ----------------- WEEKLY HELPERS (SAFE) ----------------- */

const getWeekRange = (
  currentDate: Date
): { startOfWeek: Date; endOfWeek: Date } => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

export const getWeeklyTrainingVolumeFromEntries = (
  allEntries: DailyEntry[],
  currentDate: Date
): { total: number; average: number; entries: DailyEntry[] } => {
  const { startOfWeek, endOfWeek } = getWeekRange(currentDate);

  const weeklyEntries = allEntries.filter((entry) => {
    const d = safeParseISO(entry.date);
    return !!d && d >= startOfWeek && d <= endOfWeek;
  });

  const total = weeklyEntries.reduce(
    (sum, e) => sum + (e.trainingVolume ?? 0),
    0
  );
  const average = weeklyEntries.length > 0 ? total / weeklyEntries.length : 0;

  return { total, average, entries: weeklyEntries };
};

export const getWeeklyAverageHeartRateFromEntries = (
  currentDate: Date,
  allEntries: DailyEntry[]
): number => {
  const { startOfWeek, endOfWeek } = getWeekRange(currentDate);

  const weeklyEntries = allEntries.filter((entry) => {
    if (entry.heartRate == null) return false;
    const d = safeParseISO(entry.date);
    return !!d && d >= startOfWeek && d <= endOfWeek;
  });

  const totalHr = weeklyEntries.reduce(
    (sum, entry) => sum + (entry.heartRate || 0),
    0
  );

  if (weeklyEntries.length === 0) return 0;
  return parseFloat((totalHr / weeklyEntries.length).toFixed(1));
};

export const getWeeklyMoodTrendFromEntries = (
  currentDate: Date,
  allEntries: DailyEntry[]
): string => {
  const { startOfWeek, endOfWeek } = getWeekRange(currentDate);

  const weeklyEntries = allEntries.filter((entry) => {
    if (entry.mood === 0) return false;
    const d = safeParseISO(entry.date);
    return !!d && d >= startOfWeek && d <= endOfWeek;
  });

  if (weeklyEntries.length === 0) return "No mood data";

  const totalMood = weeklyEntries.reduce((sum, entry) => sum + entry.mood, 0);
  const averageMood = totalMood / weeklyEntries.length;

  if (averageMood >= 4.5) return "Great week! 😁";
  if (averageMood >= 3.5) return "Good week! 😊";
  if (averageMood >= 2.5) return "Okay week. 😐";
  return "Tough week. 🙁";
};

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
      const d = safeParseISO(entry.date);
      return !!d && d >= startOfWeek && d <= endOfWeek;
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
