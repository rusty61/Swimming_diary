// src/pages/StatsWeeklyPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import {
  fetchEntriesForLastNDays,
  DailyEntry,
} from "@/data/dailyEntriesSupabase";

type WeeklyDatum = {
  weekLabel: string;
  totalDistance: number;
};

const StatsWeeklyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [weeklyData, setWeeklyData] = useState<WeeklyDatum[]>([]);
  const [loading, setLoading] = useState(true);

  // How many days back to look when forming weekly buckets
  const [rangeDays, setRangeDays] = useState<number>(84); // 12 weeks

  useEffect(() => {
    if (!user) {
      setWeeklyData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const entries: DailyEntry[] = await fetchEntriesForLastNDays(
          user.id,
          rangeDays,
          new Date(),
        );

        if (!Array.isArray(entries)) {
          console.error(
            "[StatsWeeklyPage] fetchEntriesForLastNDays did not return an array:",
            entries,
          );
          if (!cancelled) setWeeklyData([]);
          return;
        }

        // Bucket by week starting Monday
        const buckets = new Map<string, number>();

        for (const entry of entries) {
          if (
            entry.trainingVolume === null ||
            entry.trainingVolume === undefined
          ) {
            continue;
          }

          const day = parseISO(entry.date);
          const weekStart = startOfWeek(day, { weekStartsOn: 1 }); // Monday
          const key = format(weekStart, "yyyy-MM-dd");

          const prev = buckets.get(key) ?? 0;
          buckets.set(key, prev + entry.trainingVolume);
        }

        const rows: WeeklyDatum[] = Array.from(buckets.entries())
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, totalDistance]) => {
            const d = parseISO(key);
            return {
              weekLabel: format(d, "dd MMM"),
              totalDistance: Number(totalDistance.toFixed(2)),
            };
          });

        if (!cancelled) setWeeklyData(rows);
      } catch (err) {
        console.error("[StatsWeeklyPage] error:", err);
        if (!cancelled) setWeeklyData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id, rangeDays]);

  const rangeOptions = [
    { days: 28, label: "4w" },
    { days: 56, label: "8w" },
    { days: 84, label: "12w" },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-3 pb-6 pt-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Weekly Distance Load
          </h1>
          <p className="text-sm text-muted-foreground">
            Swim distance summed by week so you can spot spikes and overload
            before fatigue smashes you.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/stats")}
          className="self-start"
        >
          Back to Stats
        </Button>
      </header>

      {/* Controls + Chart */}
      <Card className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 px-3 py-4 sm:px-5 sm:py-5 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4 pt-1">
          <CardTitle className="text-lg font-semibold text-accent">
            Weekly Distance (km)
          </CardTitle>
          <div className="flex gap-2">
            {rangeOptions.map((opt) => (
              <Button
                key={opt.days}
                variant={rangeDays === opt.days ? "default" : "outline"}
                size="sm"
                onClick={() => setRangeDays(opt.days)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col pt-2">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Loading weekly data...
            </div>
          ) : weeklyData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No distance data available yet for this period.
            </div>
          ) : (
            <div className="h-[320px] sm:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--line-subtle)"
                  />
                  <XAxis
                    dataKey="weekLabel"
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#22c55e"
                    label={{
                      value: "km / week",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#22c55e",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--card-border)",
                      color: "var(--text-main)",
                    }}
                    formatter={(value) => [`${value} km`, "Distance"]}
                  />
                  <Bar
                    dataKey="totalDistance"
                    name="Weekly Distance"
                    fill="#22c55e"
                    radius={[8, 8, 2, 2]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsWeeklyPage;
