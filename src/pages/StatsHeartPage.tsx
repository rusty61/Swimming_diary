// src/pages/StatsHeartPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/auth/AuthContext";
import {
  fetchEntriesForLastNDays,
  DailyEntry,
} from "@/data/dailyEntriesSupabase";

type HeartDatum = {
  name: string;
  heartRate: number;
};

const StatsHeartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [data, setData] = useState<HeartDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<number>(28);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const entries: DailyEntry[] = await fetchEntriesForLastNDays(
          userId,
          rangeDays,
          new Date(),
        );

        if (!Array.isArray(entries)) {
          console.error(
            "[StatsHeartPage] fetchEntriesForLastNDays did not return an array:",
            entries,
          );
          if (!cancelled) setData([]);
          return;
        }

        const rows: HeartDatum[] = entries
          .filter(
            (entry) =>
              entry.heartRate !== null && entry.heartRate !== undefined,
          )
          .map((entry) => {
            const d = parseISO(entry.date);
            return {
              name: format(d, "MMM dd"),
              heartRate: entry.heartRate!,
            };
          });

        if (!cancelled) setData(rows);
      } catch (err) {
        console.error("[StatsHeartPage] error:", err);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, rangeDays]);

  const rangeOptions = [7, 14, 28, 56];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-3 pb-6 pt-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Heart Rate Focus
          </h1>
          <p className="text-sm text-muted-foreground">
            Strip away the clutter and just track heart rate over time for
            recovery, overload, and red-flag days.
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

      {/* Chart card */}
      <Card className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 px-3 py-4 sm:px-5 sm:py-5 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4 pt-1">
          <CardTitle className="text-lg font-semibold text-accent">
            Daily Heart Rate (bpm)
          </CardTitle>
          <div className="flex gap-2">
            {rangeOptions.map((days) => (
              <Button
                key={days}
                variant={rangeDays === days ? "default" : "outline"}
                size="sm"
                onClick={() => setRangeDays(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col pt-2">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Loading heart rate…
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No heart rate data available yet for this period.
            </div>
          ) : (
            <div className="h-[320px] sm:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--line-subtle)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#ffffff"
                    label={{
                      value: "bpm",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#ffffff",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--card-border)",
                      color: "var(--text-main)",
                    }}
                    formatter={(value) => [`${value} bpm`, "Heart Rate"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart Rate"
                    stroke="#ffffff"
                    strokeWidth={1}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsHeartPage;
