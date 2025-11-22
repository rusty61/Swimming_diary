import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { showError } from "@/utils/toast";
import { fetchAllEntriesForUser, DailyEntry } from "@/data/dailyEntriesSupabase";
import { parseISO, isValid } from "date-fns";

// ✅ THESE MATCH YOUR App.tsx EXACTLY
const ROUTES = {
  morning: "/today",
  session: "/log",
  saved: "/log/history",
  stats: "/stats",
   diary: "/today",          // "Go to Diary" should land on Today
};

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

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [weekly, setWeekly] = useState<WeeklyStats>({
    sessions: 0,
    distanceKm: 0,
    avgMood: null,
  });
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const userEmail = user?.email ?? "";
  const displayName =
    (user?.user_metadata?.display_name as string) ||
    (user?.user_metadata?.full_name as string) ||
    userEmail.split("@")[0] ||
    "swimmer";

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [displayName]);

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
          let dt: Date | null = null;
          try {
          dt = parseISO(e.date);
          } catch {
           dt = null;
          }
          if (!dt || !isValid(dt)) continue;


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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Landing weekly stats error:", message);
        showError("Weekly stats not loading — Supabase fetch failed.");
        setWeekly({ sessions: 0, distanceKm: 0, avgMood: null });
      } finally {
        setLoadingWeekly(false);
      }
    };

    fetchWeeklyStats();
  }, [user?.id]);

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HERO */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-card/60 p-7 shadow-xl">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              <span className="text-[color:var(--accent-soft)]">Black Line</span>{" "}
              Journal
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              A fast lane to track mood, heart rate, and training load without endless
              scrolling. Start your check-in, log today&apos;s swim, and jump into the
              stats gallery in just a tap.
            </p>

            {/* Welcome block */}
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/5 bg-background/40 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[color:var(--accent)] bg-background/70 text-lg font-bold">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">
                  Welcome back, {displayName}
                </div>
                {userEmail && (
                  <div className="text-xs text-muted-foreground">{userEmail}</div>
                )}
              </div>
            </div>
          </div>

          {/* FAST ACTIONS */}
          <div className="rounded-3xl border border-white/5 bg-card/60 p-7 shadow-xl">
            <h2 className="text-xl font-semibold">Fast actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump straight to the flow you need—no multi-select, no extra scroll.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(ROUTES.morning)}
                className="rounded-2xl border border-white/5 bg-background/50 p-4 text-left transition hover:bg-background/70"
              >
                <div className="font-semibold">Morning check-in</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Log mood + resting HR
                </div>
              </button>

              <button
                onClick={() => navigate(ROUTES.session)}
                className="rounded-2xl border border-white/5 bg-background/50 p-4 text-left transition hover:bg-background/70"
              >
                <div className="font-semibold">Log a session</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Distance, pace, notes
                </div>
              </button>

              <button
                onClick={() => navigate(ROUTES.stats)}
                className="rounded-2xl border border-white/5 bg-background/50 p-4 text-left transition hover:bg-background/70"
              >
                <div className="font-semibold">View stats</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Trends & weekly totals
                </div>
              </button>

              <button
                onClick={() => navigate(ROUTES.saved)}
                className="rounded-2xl border border-white/5 bg-background/50 p-4 text-left transition hover:bg-background/70"
              >
                <div className="font-semibold">Saved entries</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Browse past highlights
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* WEEKLY SUMMARY */}
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

        {/* MOTIVATION CARD — matching style */}
        <section className="mt-8">
          <div className="rounded-3xl border border-white/5 bg-card/60 p-6 shadow-xl">
            <div className="text-center text-sm italic text-muted-foreground">
              “Tough sets build fast swims.”
            </div>

            <div className="mt-4 flex justify-center">
              <Button onClick={() => navigate(ROUTES.diary)}>
                Go to Diary
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Landing;
