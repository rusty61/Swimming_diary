// src/pages/Landing.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { fetchAllEntriesForUser } from "@/data/dailyEntriesSupabase";
import { showError } from "@/utils/toast";

// ---- ROUTES MUST MATCH App.tsx ----
const ROUTES = {
  morning: "/today",
  session: "/log",
  saved: "/log/history",
  stats: "/stats",
  profile: "/profile",
  diary: "/today",
};

type WeeklyStats = {
  sessions: number;
  distanceKm: number;
  avgMood: number | null;
};

const startOfWeekLocal = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
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

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [weekly, setWeekly] = useState<WeeklyStats>({
    sessions: 0,
    distanceKm: 0,
    avgMood: null,
  });

  const [loadingWeekly, setLoadingWeekly] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadWeekly = async () => {
      setLoadingWeekly(true);
      try {
        const allEntries = await fetchAllEntriesForUser(user.id);
        const today = new Date();

        const weekStart = startOfWeekLocal(today);
        const weekEnd = endOfWeekLocalExclusive(today);

        let sessions = 0;
        let distanceKm = 0;
        let moodSum = 0;
        let moodCount = 0;

        for (const e of allEntries) {
          if (!e?.date) continue;

          const dt = new Date(e.date);
          if (isNaN(dt.getTime())) continue;
          if (!inInterval(dt, weekStart, weekEnd)) continue;

          if (typeof e.trainingVolume === "number" && e.trainingVolume > 0) {
            sessions++;
            distanceKm += e.trainingVolume;
          }

          if (typeof e.mood === "number" && e.mood > 0) {
            moodSum += e.mood;
            moodCount++;
          }
        }

        setWeekly({
          sessions,
          distanceKm,
          avgMood: moodCount ? moodSum / moodCount : null,
        });
      } catch (err) {
        console.error(err);
        showError("Could not load weekly totals.");
      } finally {
        setLoadingWeekly(false);
      }
    };

    loadWeekly();
  }, [user?.id]);

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
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Black Line Journal
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base max-w-xl">
              A fast lane to track mood, heart rate, and training load without endless scrolling.
              Start your check-in, log today’s swim, and jump into the stats gallery in a tap.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.profile)} className="rounded-full">
              Profile
            </Button>
            <Button onClick={handleLogout} className="rounded-full">
              Logout
            </Button>
          </div>
        </div>

        {/* Fast actions */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-card/60 p-6 shadow-xl">
            <div className="text-lg font-semibold mb-2">Fast actions</div>
            <p className="text-sm text-muted-foreground mb-4">
              Jump straight to the flow you need — no multi-select, no extra scroll.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Link to={ROUTES.morning} className="rounded-2xl border border-white/10 bg-background/40 p-4 hover:bg-background/60 transition">
                <div className="font-semibold">Morning check-in</div>
                <div className="text-xs text-muted-foreground mt-1">Log mood + resting HR</div>
              </Link>

              <Link to={ROUTES.session} className="rounded-2xl border border-white/10 bg-background/40 p-4 hover:bg-background/60 transition">
                <div className="font-semibold">Log a session</div>
                <div className="text-xs text-muted-foreground mt-1">Distance, pace, notes</div>
              </Link>

              <Link to={ROUTES.stats} className="rounded-2xl border border-white/10 bg-background/40 p-4 hover:bg-background/60 transition">
                <div className="font-semibold">View stats</div>
                <div className="text-xs text-muted-foreground mt-1">Trends & weekly totals</div>
              </Link>

              <Link to={ROUTES.saved} className="rounded-2xl border border-white/10 bg-background/40 p-4 hover:bg-background/60 transition">
                <div className="font-semibold">Saved entries</div>
                <div className="text-xs text-muted-foreground mt-1">Browse past highlights</div>
              </Link>
            </div>
          </div>

          {/* Weekly summary card */}
          <div className="rounded-3xl border border-white/5 bg-card/60 p-6 shadow-xl">
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
              Live totals pulled from your Supabase daily_entries store.
            </div>

            <div className="mt-6 flex justify-center">
              <Link to={ROUTES.diary}>
                <Button variant="outline" className="rounded-full px-8">
                  Go to Diary
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Landing;
