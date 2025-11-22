// src/pages/MorningCheckinPage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseISO, isValid } from "date-fns";

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

type WeeklyStats = {
  sessions: number;
  distanceKm: number;
  avgMood: number | null;
};

const toDateOnlyString = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const startOfWeekLocal = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
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
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const [weekly, setWeekly] = useState<WeeklyStats>({
    sessions: 0,
    distanceKm: 0,
    avgMood: null,
  });

  const dateStr = useMemo(() => toDateOnlyString(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!user?.id) return;

    const loadForDate = async () => {
      setLoading(true);
      try {
        const entry = await fetchEntryForDate(user.id, selectedDate);
        if (entry) {
          setMood(typeof entry.mood === "number" ? entry.mood : null);
          setHeartRate(
            typeof entry.heartRate === "number" ? entry.heartRate : null
          );
        } else {
          setMood(null);
          setHeartRate(null);
        }
      } catch (e) {
        console.error(e);
        showError("Could not load check-in for that date.");
      } finally {
        setLoading(false);
      }
    };

    loadForDate();
  }, [user?.id, selectedDate]);

  useEffect(() => {
    if (!user?.id) return;

    const loadWeekly = async () => {
      setLoadingWeekly(true);
      try {
        const allEntries = await fetchAllEntriesForUser(user.id);

        const weekStart = startOfWeekLocal(selectedDate);
        const weekEnd = endOfWeekLocalExclusive(selectedDate);

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
            distanceKm += e.trainingVolume;
          }

          if (typeof e.mood === "number") {
            moodSum += e.mood;
            moodCount++;
          }
        }

        setWeekly({
          sessions,
          distanceKm,
          avgMood: moodCount ? moodSum / moodCount : null,
        });
      } catch (e) {
        console.error(e);
        showError("Could not load weekly totals.");
      } finally {
        setLoadingWeekly(false);
      }
    };

    loadWeekly();
  }, [user?.id, selectedDate]);

  const handleSave = async () => {
    if (!user?.id) {
      showError("Not signed in.");
      return;
    }

    setLoading(true);
    try {
      await upsertDailyEntry(user.id, {
        date: selectedDate,
        mood: mood ?? undefined,
        heartRate: heartRate ?? null,
      });
      showSuccess("Check-in updated.");
    } catch (e) {
      console.error(e);
      showError("Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (e) {
      console.error(e);
      showError("Logout failed.");
    }
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8">
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
            <Button
              variant="outline"
              onClick={() => navigate("/landing")}
              className="rounded-full"
            >
              Home
            </Button>
            <Button onClick={handleLogout} className="rounded-full">
              Logout
            </Button>
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Log how you feel and your heart rate once per day.
        </p>

        <section className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />

          <Button
            onClick={handleSave}
            disabled={loading}
            className="rounded-full px-8"
          >
            {loading ? "Saving…" : "Update"}
          </Button>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <InteractiveMoodCard
            mood={mood}
            onMoodChange={setMood}
            date={dateStr}
          />
          <HeartRateCard
            heartRate={heartRate}
            onHeartRateChange={setHeartRate}
            date={dateStr}
          />
        </section>

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
                  {loadingWeekly ? "…" : weekly.avgMood?.toFixed(1) ?? "—"}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              Live totals pulled from your Supabase diary_entries store.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default MorningCheckinPage;
