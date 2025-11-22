"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import InteractiveMoodCard from "@/components/InteractiveMoodCard";
import HeartRateCard from "@/components/HeartRateCard";
import { useAuth } from "@/auth/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import {
  fetchEntryForDate,
  upsertDailyEntry,
  fetchAllEntriesForUser,
  DailyEntry,
} from "@/data/dailyEntriesSupabase";
import { parseISO, isValid } from "date-fns";

type WeeklyStats = {
  sessions: number;
  distanceKm: number;
  avgMood: number | null;
};

const startOfWeekLocal = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday-start week
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfWeekLocalExclusive = (d: Date) => {
  const s = startOfWeekLocal(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  e.setHours(0, 0, 0, 0);
  return e;
};

const inInterval = (dt: Date, start: Date, endExclusive: Date) =>
  dt >= start && dt < endExclusive;

const MorningCheckinPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mood, setMood] = useState<number | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [weekly, setWeekly] = useState<WeeklyStats>({
    sessions: 0,
    distanceKm: 0,
    avgMood: null,
  });
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const dateStr = useMemo(
    () => selectedDate.toISOString().slice(0, 10),
    [selectedDate]
  );

  // ---- Load daily entry for chosen date ----
  useEffect(() => {
    if (!user?.id) return;

    const loadForDate = async () => {
      setLoading(true);
      try {
        const entry = await fetchEntryForDate(user.id, dateStr);
        if (entry) {
          setMood(entry.mood ?? null);
          setHeartRate(entry.heartRate ?? null);
        } else {
          setMood(null);
          setHeartRate(null);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(message);
        showError("Could not load check-in for that date.");
      } finally {
        setLoading(false);
      }
    };

    loadForDate();
  }, [user?.id, dateStr]);

  // ---- Weekly stats (live + historical) ----
  useEffect(() => {
    if (!user?.id) return;

    const fetchWeeklyStats = async () => {
      setLoadingWeekly(true);
      try {
        const allEntries: DailyEntry[] = await fetchAllEntriesForUser(user.id);

        const now = new Date();
        const weekStart = startOfWeekLocal(now);
        const weekEnd = endOfWeekLocalExclusive(now);

        let sessions = 0;
        let distanceKm = 0;
        let moodSum = 0;
        let moodCount = 0;

        for (const e of allEntries) {
          if (!e.date) continue;
          const dt = parseISO(e.date);
          if (!isValid(dt)) continue;
          if (!inInterval(dt, weekStart, weekEnd)) continue;

          if (typeof e.trainingVolume === "number" && e.trainingVolume > 0) {
            sessions++;
            distanceKm += e.trainingVolume; // km
          }

          if (typeof e.mood === "number") {
            moodSum += e.mood;
            moodCount++;
          }
        }

        const avgMood = moodCount > 0 ? moodSum / moodCount : null;

        setWeekly({ sessions, distanceKm, avgMood });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("Weekly stats fetch failed:", message);
        setWeekly({ sessions: 0, distanceKm: 0, avgMood: null });
      } finally {
        setLoadingWeekly(false);
      }
    };

    fetchWeeklyStats();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await upsertDailyEntry(user.id, {
        date: dateStr,
        mood: mood ?? undefined,
        heartRate: heartRate ?? undefined,
      });

      showSuccess("Morning check-in saved.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(message);
      showError("Save failed. Check connection / RLS.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* HEADER */}
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Morning Check-in
          </h1>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/help")}
              className="rounded-full"
            >
              How it works
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Logout
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground md:text-base">
          Log how you feel and your heart rate once per day. Use Log for distance
          and notes after training.
        </p>

        {/* MOTIVATION CARD (fixed style) */}
        <section className="mt-6">
          <div className="rounded-3xl border border-white/5 bg-card/60 p-6 shadow-xl">
            <div className="text-center text-sm italic text-muted-foreground md:text-base">
              “Consistency beats intensity when intensity only shows up sometimes.”
            </div>
          </div>
        </section>

        {/* DATE + SAVE */}
        <section className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
          <Button
            onClick={handleSave}
            disabled={loading}
            className="rounded-full px-8"
          >
            {loading ? "Saving…" : "Update"}
          </Button>
        </section>

        {/* MAIN CARDS */}
        <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <InteractiveMoodCard
            mood={mood}
            onMoodChange={setMood}
            disabled={loading}
          />
          <HeartRateCard
            heartRate={heartRate}
            onHeartRateChange={setHeartRate}
            disabled={loading}
          />
        </section>

        {/* WEEKLY SUMMARY CARD (added) */}
        <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/5 bg-card/60 p-6 shadow-xl md:col-span-1">
            <div className="text-base font-semibold">This week so far</div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-semibold">
                  {loadingWeekly ? "…" : weekly.sessions}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-semibold">
                  {loadingWeekly ? "…" : weekly.distanceKm.toFixed(2)} km
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg mood</span>
                <span className="font-semibold">
                  {loadingWeekly
                    ? "…"
                    : weekly.avgMood == null
                    ? "—"
                    : weekly.avgMood.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              Live totals pulled from your Supabase diary_entries store.
            </div>
          </div>

          <div className="hidden md:block md:col-span-2" />
        </section>
      </div>
    </main>
  );
};

export default MorningCheckinPage;
