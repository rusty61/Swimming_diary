import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export type DailyMetrics = {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  rpe?: number | null;
  restingHr?: number | null;
  sleepHours?: number | null;
  noteSentiment?: number | null;
  fatigueTag?: number;
  stressTag?: number;
  painTag?: number;
  confidenceTag?: number;
};

export type RiskScores = {
  id?: string;
  userId: string;
  date: string;
  overtrainRisk: number;     
  motivationRisk: number;    
  performanceRisk: number;   
  drivers: string[];
  modelVersion?: string;
};

export async function fetchMetricsForDate(userId: string, date: string) {
  try {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      rpe: data.rpe,
      restingHr: data.resting_hr,
      sleepHours: data.sleep_hours,
      noteSentiment: data.note_sentiment,
      fatigueTag: data.fatigue_tag ?? 0,
      stressTag: data.stress_tag ?? 0,
      painTag: data.pain_tag ?? 0,
      confidenceTag: data.confidence_tag ?? 0,
    } as DailyMetrics;
  } catch {
    return null;
  }
}

export async function upsertDailyMetrics(
  userId: string,
  patch: Partial<DailyMetrics> & { date: string }
) {
  try {
    // Base row: always include identity + updated_at
    const row: any = {
      user_id: userId,
      date: patch.date,
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are actually present in patch.
    // This prevents wiping other columns to null.
    if ("rpe" in patch) row.rpe = patch.rpe ?? null;
    if ("restingHr" in patch) row.resting_hr = patch.restingHr ?? null;
    if ("sleepHours" in patch) row.sleep_hours = patch.sleepHours ?? null;
    if ("noteSentiment" in patch) row.note_sentiment = patch.noteSentiment ?? null;

    if ("fatigueTag" in patch) row.fatigue_tag = patch.fatigueTag ?? 0;
    if ("stressTag" in patch) row.stress_tag = patch.stressTag ?? 0;
    if ("painTag" in patch) row.pain_tag = patch.painTag ?? 0;
    if ("confidenceTag" in patch) row.confidence_tag = patch.confidenceTag ?? 0;

    const { error } = await supabase
      .from("daily_metrics")
      .upsert(row, { onConflict: "user_id,date" });

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("upsertDailyMetrics failed:", e);
    return false;
  }
}

export async function fetchMetricsLastNDays(userId: string, nDays: number) {
  try {
    const fromDate = format(subDays(new Date(), nDays), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .eq("user_id", userId)
      .gte("date", fromDate)
      .order("date", { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function upsertRiskScores(risk: RiskScores) {
  try {
    const row = {
      user_id: risk.userId,
      date: risk.date,
      overtrain_risk: risk.overtrainRisk,
      motivation_risk: risk.motivationRisk,
      performance_risk: risk.performanceRisk,
      drivers: risk.drivers,
      model_version: risk.modelVersion ?? "A-1",
    };

    const { error } = await supabase
      .from("risk_scores")
      .upsert(row, { onConflict: "user_id,date" });

    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

export async function fetchRiskForDate(userId: string, date: string) {
  try {
    const { data, error } = await supabase
      .from("risk_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      overtrainRisk: data.overtrain_risk,
      motivationRisk: data.motivation_risk,
      performanceRisk: data.performance_risk,
      drivers: (data.drivers ?? []) as string[],
      modelVersion: data.model_version,
    } as RiskScores;
  } catch {
    return null;
  }
}
