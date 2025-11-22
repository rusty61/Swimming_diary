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
  getWeeklyAverageHeartRateFromEntries,
  getWeeklyMoodTrendFromEntries,
} from "@/data/dailyEntriesSupabase";

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
  const [weeklyAvgHr, setWeeklyAvgHr] = useState<number | null>(null);
  const [weeklyMoodTrend, setWeeklyMoodTrend] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setWeeklyTotalKm(0);
      setWeeklyAvgHr(null);
      setWeeklyMoodTrend("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const summaryDate = selectedDate ?? new Date();

    const run = async () => {
      try {
        setLoading(true);

        const allEntries = await fetchAllEntriesForUser(user.id);

        const { total } = getWeeklyTrainingVolumeFromEntries(
          allEntries,
          summaryDate
        );
        const avgHr = getWeeklyAverageHeartRateFromEntries(
          summaryDate,
          allEntries
        );
        const moodTrend = getWeeklyMoodTrendFromEntries(
          summaryDate,
          allEntries
        );

        if (cancelled) return;

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

    return () => {
      cancelled = true;
    };
  }, [user, selectedDate, refreshKey]);

  return (
    <Card
      className={cn(
        "bg-card text-foreground shadow-md border-card-border p-6 h-full",
        className
      )}
    >
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-bold text-accent flex items-center">
          <CalendarDays className="mr-2" /> This week so far
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        {loading ? (
          <div className="text-center text-text-muted">
            Loading weekly summary...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-lg">
              <span className="flex items-center text-text-main">
                <Waves className="mr-2 text-accent" />
                Distance:
              </span>
              <span className="font-semibold text-accent">
                {weeklyTotalKm.toFixed(1)} km
              </span>
            </div>

            <div className="flex items-center justify-between text-lg">
              <span className="flex items-center text-text-main">
                <HeartPulse className="mr-2 text-accent" />
                Avg HR:
              </span>
              <span className="font-semibold text-accent">
                {weeklyAvgHr !== null ? `${weeklyAvgHr} bpm` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between text-lg">
              <span className="flex items-center text-text-main">
                Avg mood:
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
