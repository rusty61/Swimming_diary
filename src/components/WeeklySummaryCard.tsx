// src/components/WeeklySummaryCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, HeartPulse, CalendarDays } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import {
  fetchAllEntriesForUser,
  getWeeklyTrainingVolumeFromEntries,
  getWeeklyMoodTrendFromEntries,
  DailyEntry,
} from "@/data/dailyEntriesSupabase";
import {
  fetchMetricsLastNDays,
  DailyMetrics,
} from "@/data/dailyMetricsSupabase";
import { format, parseISO, isValid } from "date-fns";

interface WeeklySummaryCardProps {
  selectedDate?: Date;
  refreshKey?: number;
  className?: string;
}

const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
  selectedDate,
  refreshKey,
  className,
}) => {
  const { user } = useAuth();

  const [weeklyTotalKm, setWeeklyTotalKm] = useState<number>(0);
  const [weeklyAvgRestingHr, setWeeklyAvgRestingHr] = useState<number | null>(
    null,
  );
  const [weeklyMoodTrend, setWeeklyMoodTrend] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const allEntries: DailyEntry[] = await fetchAllEntriesForUser(user.id);
        const summaryDate = selectedDate ?? new Date();
        const thisWeekKey = format(summaryDate, "yyyy-'W'ww");

        // Weekly training volume (km) from entries table
        const trainingByWeek = getWeeklyTrainingVolumeFromEntries(allEntries);
        const totalKm = trainingByWeek[thisWeekKey] ?? 0;

        // Weekly mood average from entries table
        const moodByWeek = getWeeklyMoodTrendFromEntries(allEntries);
        const avgMood = moodByWeek[thisWeekKey];
        const moodTrendStr = avgMood != null ? avgMood.toFixed(1) : "";

        // Weekly resting HR average from metrics table
        const metrics: DailyMetrics[] = await fetchMetricsLastNDays(user.id, 60);
        const weekResting = (metrics ?? [])
          .filter((m) => {
            const dt = parseISO(m.date);
            if (!isValid(dt) || m.restingHr == null) return false;
            const wk = format(dt, "yyyy-'W'ww");
            return wk === thisWeekKey;
          })
          .map((m) => m.restingHr as number);

        const avgResting =
          weekResting.length > 0
            ? Math.round(
                weekResting.reduce((a, b) => a + b, 0) / weekResting.length,
              )
            : null;

        if (cancelled) return;

        setWeeklyTotalKm(totalKm);
        setWeeklyAvgRestingHr(avgResting);
        setWeeklyMoodTrend(moodTrendStr);
      } catch (err) {
        console.error("[WeeklySummaryCard] error:", err);
        if (!cancelled) {
          showError("Failed to load weekly summary.");
          setWeeklyTotalKm(0);
          setWeeklyAvgRestingHr(null);
          setWeeklyMoodTrend("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user?.id, selectedDate, refreshKey]);

  return (
    <Card
      className={cn(
        "h-full flex flex-col bg-card/60 border-border shadow-md",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-text-main flex items-center">
          <CalendarDays className="mr-2 text-accent" />
          Weekly Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2 space-y-3 text-sm sm:text-base">
        {loading ? (
          <div className="text-text-muted">Loading weekly stats...</div>
        ) : (
          <>
            {/* Weekly total distance */}
            <div className="flex items-center justify-between text-lg">
              <span className="flex items-center text-text-main">
                <Waves className="mr-2 text-accent" />
                Total Distance:
              </span>
              <span className="font-semibold text-accent">
                {weeklyTotalKm.toFixed(1)} km
              </span>
            </div>

            {/* Weekly avg resting HR */}
            <div className="flex items-center justify-between text-lg">
              <span className="flex items-center text-text-main">
                <HeartPulse className="mr-2 text-accent" />
                Avg. Resting HR:
              </span>
              <span className="font-semibold text-accent">
                {weeklyAvgRestingHr !== null ? `${weeklyAvgRestingHr} bpm` : "—"}
              </span>
            </div>

            {/* Mood trend summary */}
            <div className="flex items-center justify-between text-lg">
              <span className="flex items-center text-text-main">
                Mood Trend:
              </span>
              <span className="font-semibold text-accent">
                {weeklyMoodTrend || "No mood data"}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklySummaryCard;
