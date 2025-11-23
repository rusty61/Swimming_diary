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
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import {
  fetchEntriesForLastNDays,
  DailyEntry,
} from "@/data/dailyEntriesSupabase";
import {
  fetchMetricsLastNDays,
  DailyMetrics,
} from "@/data/dailyMetricsSupabase";

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
  restingHr: number | null;
  trainingVolume: number | null;
};

const CombinedDailyMetricsChart: React.FC<CombinedDailyMetricsChartProps> = ({
  selectedDate,
  rangeDays = 14,
  setRangeDays,
  refreshKey,
  className,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);

  const [visibleLines, setVisibleLines] = useState({
    trainingVolume: true,
    restingHr: true,
    mood: true,
  });

  // On mobile, default to ONLY Training Volume for readability
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setVisibleLines({
        trainingVolume: true,
        restingHr: false,
        mood: false,
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

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

        // Metrics fetch (resting HR lives here)
        const metrics: DailyMetrics[] = await fetchMetricsLastNDays(
          user.id,
          Math.max(rangeDays + 7, 30),
        );

        const restingMap: Record<string, number | null> = {};
        for (const m of metrics ?? []) {
          if (m?.date) restingMap[m.date] = m.restingHr ?? null;
        }

        const transformed: ChartDatum[] = entries.map((entry) => {
          const d = parseISO(entry.date);
          return {
            name: format(d, "MMM dd"),
            mood: entry.mood,
            restingHr: restingMap[entry.date] ?? null,
            trainingVolume: entry.trainingVolume,
          };
        });

        if (!cancelled) setChartData(transformed);
      } catch (err) {
        console.error("[CombinedDailyMetricsChart] error:", err);
        if (!cancelled) setChartData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user?.id, rangeDays, selectedDate, refreshKey]);

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasTrainingVolume = chartData.some((d) => d.trainingVolume != null);
  const hasRestingHr = chartData.some((d) => d.restingHr != null);
  const hasMood = chartData.some((d) => d.mood != null);

  return (
    <Card
      className={cn(
        "h-full flex flex-col bg-card/60 border-border shadow-md",
        className,
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg text-text-main">Daily Trends</CardTitle>
          <div className="text-xs text-text-muted mt-1">
            Tap legend items to show/hide lines.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {setRangeDays && (
            <select
              className="bg-background/60 border border-border rounded px-2 py-1 text-xs"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
            >
              <option value={7}>7d</option>
              <option value={14}>14d</option>
              <option value={30}>30d</option>
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/stats/trend")}
          >
            View Full Stats Page
          </Button>
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
            {/* Chart area — scrolls horizontally on small screens */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[520px] h-56 sm:h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,10,10,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "white" }}
                    />

                    {hasTrainingVolume && visibleLines.trainingVolume && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="trainingVolume"
                        name="Training Volume"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}

                    {hasRestingHr && visibleLines.restingHr && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="restingHr"
                        name="Resting HR"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}

                    {hasMood && visibleLines.mood && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="mood"
                        name="Mood"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
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

              {hasRestingHr && (
                <button
                  type="button"
                  onClick={() => toggleLine("restingHr")}
                  className={cn(
                    "px-3 py-1 rounded-full border text-xs sm:text-sm flex items-center gap-2",
                    visibleLines.restingHr
                      ? "bg-white/10 border-white text-white"
                      : "bg-transparent border-white/40 text-white/70",
                  )}
                >
                  <span className="inline-block h-2 w-6 rounded-full bg-white" />
                  Resting HR
                </button>
              )}

              {hasMood && (
                <button
                  type="button"
                  onClick={() => toggleLine("mood")}
                  className={cn(
                    "px-3 py-1 rounded-full border text-xs sm:text-sm flex items-center gap-2",
                    visibleLines.mood
                      ? "bg-accent/20 border-accent text-accent"
                      : "bg-transparent border-accent/40 text-accent/70",
                  )}
                >
                  <span className="inline-block h-2 w-6 rounded-full bg-accent" />
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
