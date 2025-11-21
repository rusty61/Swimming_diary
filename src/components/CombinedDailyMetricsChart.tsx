// src/components/CombinedDailyMetricsChart.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  fetchEntriesForLastNDays,
  DailyEntry,
} from "@/data/dailyEntriesSupabase";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/utils";

interface CombinedDailyMetricsChartProps {
  selectedDate?: Date;
  rangeDays?: number;
  setRangeDays?: (days: number) => void;
  refreshKey?: number;
  className?: string;
}

type ChartDatum = {
  name: string;
  mood: number;
  heartRate: number | null;
  trainingVolume: number | null;
};

const CombinedDailyMetricsChart: React.FC<CombinedDailyMetricsChartProps> = ({
  selectedDate = new Date(),
  rangeDays = 7,
  setRangeDays,
  refreshKey,
  className,
}) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);

  // Legend visibility state
  const [visibleLines, setVisibleLines] = useState({
    trainingVolume: true,
    heartRate: true,
    mood: true,
  });

  useEffect(() => {
    if (!user) {
      setChartData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadChartData = async () => {
      try {
        setLoading(true);

        const entries: DailyEntry[] = await fetchEntriesForLastNDays(
          user.id,
          rangeDays,
          selectedDate,
        );

        if (!Array.isArray(entries)) {
          console.error(
            "[CombinedDailyMetricsChart] fetchEntriesForLastNDays did not return an array:",
            entries,
          );
          if (!cancelled) setChartData([]);
          return;
        }

        const transformed = entries.map((entry) => {
          const d = parseISO(entry.date);
          return {
            name: format(d, "MMM dd"),
            mood: entry.mood,
            heartRate: entry.heartRate,
            trainingVolume: entry.trainingVolume,
          };
        });

        console.log("[CombinedDailyMetricsChart] data:", transformed);
        if (!cancelled) setChartData(transformed);
      } catch (err) {
        console.error("[CombinedDailyMetricsChart] error:", err);
        if (!cancelled) setChartData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadChartData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, selectedDate.getTime(), rangeDays, refreshKey]);

  const rangeOptions = [7, 14, 28, 90];

  const toggleLine = (key: "trainingVolume" | "heartRate" | "mood") => {
    setVisibleLines((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hasTrainingVolume = chartData.some(
    (entry) =>
      entry.trainingVolume !== undefined && entry.trainingVolume !== null,
  );
  const hasHeartRate = chartData.some(
    (entry) => entry.heartRate !== undefined && entry.heartRate !== null,
  );
  const hasMood = chartData.some(
    (entry) => entry.mood !== undefined && entry.mood !== null,
  );

  return (
    <Card
      className={cn(
        "w-full h-[420px] shadow-lg rounded-lg bg-card text-foreground border-card-border flex flex-col px-4",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-4">
        <CardTitle className="text-xl font-semibold text-accent">
          Daily Metrics Trend
        </CardTitle>
        <div className="flex space-x-2">
          {rangeOptions.map((days) => (
            <Button
              key={days}
              variant={rangeDays === days ? "default" : "outline"}
              size="sm"
              onClick={() => setRangeDays && setRangeDays(days)}
              disabled={!setRangeDays}
            >
              {days}d
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-2 pb-4 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            Loading trend...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            No data for this range yet.
          </div>
        ) : (
          <>
            {/* Chart area */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--line-subtle)"
                  />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />

                  {/* LEFT AXIS = TRAINING VOLUME */}
                  <YAxis
                    yAxisId="trainingVolume"
                    stroke="#22c55e"
                    label={{
                      value: "Training Volume (km)",
                      angle: -90,
                      fill: "#22c55e",
                    }}
                  />

                  {/* RIGHT AXIS = HEART RATE */}
                  <YAxis
                    yAxisId="heartRate"
                    orientation="right"
                    stroke="#ffffff"
                    label={{
                      value: "Heart Rate (bpm)",
                      angle: 90,
                      position: "insideRight",
                      fill: "#ffffff",
                    }}
                  />

                  {/* HIDDEN AXIS = MOOD (0–5 scale) */}
                  <YAxis
                    yAxisId="mood"
                    stroke="#4ea8ff"
                    domain={[0, 5]}
                    hide
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--card-border)",
                      color: "var(--text-main)",
                    }}
                  />

                  {/* Training Volume = GREEN on left axis */}
                  {hasTrainingVolume && visibleLines.trainingVolume && (
                    <Line
                      yAxisId="trainingVolume"
                      type="monotone"
                      dataKey="trainingVolume"
                      name="Training Volume"
                      stroke="#22c55e"
                      strokeWidth={1}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}

                  {/* Heart rate = WHITE on right axis */}
                  {hasHeartRate && visibleLines.heartRate && (
                    <Line
                      yAxisId="heartRate"
                      type="monotone"
                      dataKey="heartRate"
                      name="Heart Rate"
                      stroke="#ffffff"
                      strokeWidth={1}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}

                  {/* Mood = BLUE, uses hidden axis (0–5) */}
                  {hasMood && visibleLines.mood && (
                    <Line
                      yAxisId="mood"
                      type="monotone"
                      dataKey="mood"
                      name="Mood"
                      stroke="#4ea8ff"
                      strokeWidth={1}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend toggles */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
              {hasTrainingVolume && (
                <button
                  type="button"
                  onClick={() => toggleLine("trainingVolume")}
                  className={cn(
                    "px-3 py-1 rounded-full border text-xs sm:text-sm flex items-center gap-2",
                    visibleLines.trainingVolume
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                      : "bg-transparent border-emerald-700 text-emerald-400/70",
                  )}
                >
                  <span className="inline-block h-2 w-6 rounded-full bg-emerald-400" />
                  Training Volume
                </button>
              )}

              {hasHeartRate && (
                <button
                  type="button"
                  onClick={() => toggleLine("heartRate")}
                  className={cn(
                    "px-3 py-1 rounded-full border text-xs sm:text-sm flex items-center gap-2",
                    visibleLines.heartRate
                      ? "bg-white/10 border-white text-white"
                      : "bg-transparent border-white/40 text-white/70",
                  )}
                >
                  <span className="inline-block h-2 w-6 rounded-full bg-white" />
                  Heart Rate
                </button>
              )}

              {hasMood && (
                <button
                  type="button"
                  onClick={() => toggleLine("mood")}
                  className={cn(
                    "px-3 py-1 rounded-full border text-xs sm:text-sm flex items-center gap-2",
                    visibleLines.mood
                      ? "bg-sky-500/20 border-sky-400 text-sky-200"
                      : "bg-transparent border-sky-700 text-sky-400/70",
                  )}
                >
                  <span className="inline-block h-2 w-6 rounded-full bg-sky-400" />
                  Mood
                </button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CombinedDailyMetricsChart;
