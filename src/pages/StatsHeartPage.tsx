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
import { fetchMetricsLastNDays, DailyMetrics } from "@/data/dailyMetricsSupabase";

type RestingHrDatum = {
  name: string;
  restingHr: number;
};

const StatsHeartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<RestingHrDatum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const metrics: DailyMetrics[] = await fetchMetricsLastNDays(user.id, 60);

        const rows: RestingHrDatum[] = (metrics ?? [])
          .filter((m) => m.restingHr !== null && m.restingHr !== undefined)
          .map((m) => {
            const d = parseISO(m.date);
            return {
              name: format(d, "MMM dd"),
              restingHr: m.restingHr as number,
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

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-text-main">Resting HR Trend</h2>
        <Button variant="outline" onClick={() => navigate("/stats")}>
          Back to Stats
        </Button>
      </div>

      <Card className="bg-card/60 border-border shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-text-main">
            Resting HR (bpm)
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-2">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-text-muted">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-text-muted">
              No resting HR data yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,10,10,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "white" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="restingHr"
                    name="Resting HR"
                    strokeWidth={2}
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
