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
  getWeeklyAverageHeartRateFromEntries,
  getWeeklyMoodTrendFromEntries,
} from "@/data/dailyEntriesSupabase";

interface WeeklySummaryCardProps {
  selectedDate: Date;
  refreshKey?: number;
  className?: string;
}

const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
  selectedDate,
  refreshKey,
  className,
}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const selectedDateMs = selectedDate.getTime();

  const [weeklyTotalKm, setWeeklyTotalKm] = useState<number>(0);
  const [weeklyAvgHr, setWeeklyAvgHr] = useState<number | null>(null);
  const [weeklyMoodTrend, setWeeklyMoodTrend] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If there is no logged-in user, clear the card and bail out.
    if (!userId) {
      setWeeklyTotalKm(0);
      setWeeklyAvgHr(null);
      setWeeklyMoodTrend("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);

        // 1) Get *all* entries for this user
        const allEntries = await fetchAllEntriesForUser(userId);
        console.log("[WeeklySummaryCard] allEntries:", allEntries);

        // 2) Use helpers to derive weekly stats for the week of selectedDate
        const summaryDate = selectedDate ?? new Date();

        const { total } = getWeeklyTrainingVolumeFromEntries(
          allEntries,
          summaryDate,
        );
        const avgHr = getWeeklyAverageHeartRateFromEntries(
          summaryDate,
          allEntries,
        );
        const moodTrend = getWeeklyMoodTrendFromEntries(
          summaryDate,
          allEntries,
        );

        if (cancelled) return;

        console.log("[WeeklySummaryCard] weekly total km:", total);
        console.log("[WeeklySummaryCard] weekly avg HR:", avgHr);
        console.log("[WeeklySummaryCard] weekly mood trend:", moodTrend);

        setWeeklyTotalKm(total);
        setWeeklyAvgHr(avgHr);
        setWeeklyMoodTrend(moodTrend);
      } catch (err) {
        console.error("[WeeklySummaryCard] error:", err);
        if (!cancelled) {
          showError("Failed to load weekly summary.");
          setWeeklyTotalKm(0);
          setWeeklyAvgHr(null);
          setWeeklyMoodTrend("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    // Cleanup to avoid setting state on an unmounted component
    return () => {
      cancelled = true;
    };
    // NOTE: use stable primitives so React reliably re-runs
  }, [userId, selectedDate, selectedDateMs, refreshKey]);

  return (
    <Card
      className={cn(
        "bg-card text-foreground shadow-md border-card-border p-6 h-full",
        className,
      )}
    >
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-bold text-accent flex items-center">
          <CalendarDays className="mr-2" /> Weekly Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        {loading ? (
          <div className="text-center text-text-muted">
            Loading weekly summary...
          </div>
        ) : (
          <>
            {/* Total training distance */}
            <div className="flex items-center justify-between text-lg">
              <span className="flex items-center text-text-main">
                <Waves className="mr-2 text-accent" />
                Total Training:
              </span>
              <span className="font-semibold text-accent">
                {weeklyTotalKm.toFixed(1)} km
              </span>
            </div>

            {/* Average heart rate (if any data) */}
            <div className="flex items-center justify-between text-lg">
              <span className="flex items-center text-text-main">
                <HeartPulse className="mr-2 text-accent" />
                Avg. Heart Rate:
              </span>
              <span className="font-semibold text-accent">
                {weeklyAvgHr !== null ? `${weeklyAvgHr} bpm` : "—"}
              </span>
            </div>

            {/* Mood trend summary string */}
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
