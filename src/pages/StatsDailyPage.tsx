// src/pages/StatsDailyPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import CombinedDailyMetricsChart from "@/components/CombinedDailyMetricsChart";
import ReadinessRiskCard from "@/components/ReadinessRiskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/auth/AuthContext";
import { fetchRiskForDate } from "@/data/dailyMetricsSupabase";
import { format } from "date-fns";

// teen-friendly one-liner mapper (same style as we added in ReadinessRiskCard)
const friendlyDriver = (d: string) => {
  const s = d ?? "";

  let m = s.match(/Load spike:\s*ACWR\s*([0-9.]+)/i);
  if (m) {
    const v = Number(m[1]);
    const times = isFinite(v) ? v.toFixed(1) : m[1];
    return `You trained about ${times}× your usual this week — take 1–2 lighter days.`;
  }

  m = s.match(/Rising load:\s*ACWR\s*([0-9.]+)/i);
  if (m) return `Training is climbing fast lately — keep recovery in mind.`;

  m = s.match(/Resting HR \+(\d+)\s*bpm/i);
  if (m) return `Morning heart rate is up ~${m[1]} bpm — your body may be tired.`;
  if (/Resting HR elevated/i.test(s))
    return `Morning heart rate is a bit higher lately — watch fatigue.`;

  if (/Mood ↓/i.test(s) || /Mood down/i.test(s))
    return `Mood has been lower than normal lately.`;

  if (/Fatigue noted/i.test(s))
    return `You’ve felt tired a few times this week.`;

  if (/Stress noted|Stress flagged/i.test(s))
    return `Stress has shown up a few times this week.`;

  if (/Pain\/soreness noted|Pain noted/i.test(s))
    return `More soreness has been noted this week.`;

  return s;
};

const StatsDailyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [refreshKey, setRefreshKey] = useState(0);

  const [risk, setRisk] = useState<{
    overtrainRisk: number;
    motivationRisk: number;
    performanceRisk: number;
    drivers: string[];
  } | null>(null);

  const applyDate = () => {
    setRefreshKey((k) => k + 1);
  };

  // fetch risk so we can show BOTH raw + friendly in different places
  useEffect(() => {
    const loadRisk = async () => {
      if (!user) {
        setRisk(null);
        return;
      }
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const r = await fetchRiskForDate(user.id, dateStr);
      if (!r) {
        setRisk(null);
        return;
      }
      setRisk({
        overtrainRisk: r.overtrainRisk,
        motivationRisk: r.motivationRisk,
        performanceRisk: r.performanceRisk,
        drivers: r.drivers ?? [],
      });
    };

    loadRisk();
  }, [user?.id, selectedDate.getTime(), refreshKey]);

  const rawDrivers = risk?.drivers ?? [];
  const friendlyDrivers = rawDrivers.map(friendlyDriver);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header row */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-main">
            Daily Metrics Trend
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/stats")}>
            Back to Stats
          </Button>
        </div>

        {/* Date + update controls */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-center md:justify-start">
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <Button
            onClick={applyDate}
            className="px-6 py-2 text-sm font-semibold tracking-[0.14em] uppercase"
          >
            Update
          </Button>
        </div>

        {/* ===== Two-column layout (≈65% / 35%) ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* LEFT COLUMN (~65%) */}
          <div className="md:col-span-2 space-y-6">
            {/* Readiness / Risk card */}
            <ReadinessRiskCard
              selectedDate={selectedDate}
              refreshKey={refreshKey}
              className="w-full"
            />

            {/* RAW WHY line back near the graph box */}
            {rawDrivers.length > 0 && (
              <div className="px-1">
                <p className="text-sm font-semibold mb-1">Why (raw):</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {rawDrivers.slice(0, 3).map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* BIG trend chart */}
            <div className="flex justify-center">
              <div className="w-full max-w-5xl h-[520px]">
                <CombinedDailyMetricsChart
                  selectedDate={selectedDate}
                  rangeDays={rangeDays}
                  setRangeDays={setRangeDays}
                  refreshKey={refreshKey}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (~35%) — friendly takeaway box */}
          <div className="md:col-span-1">
            <Card className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-accent">
                  Today’s takeaway
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {friendlyDrivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No takeaway yet — log a few days of training + RPE.
                  </p>
                ) : (
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                    {friendlyDrivers.slice(0, 3).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        {/* ===== end layout ===== */}
      </div>
    </div>
  );
};

export default StatsDailyPage;
