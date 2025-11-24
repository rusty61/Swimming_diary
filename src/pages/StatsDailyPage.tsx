// src/pages/StatsDailyPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import CombinedDailyMetricsChart from "@/components/CombinedDailyMetricsChart";
import ReadinessRiskCard from "@/components/ReadinessRiskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/auth/AuthContext";
import { fetchRiskForDate } from "@/data/dailyMetricsSupabase";

// athlete-friendly takeaway mapper
const friendlyDriver = (d: string) => {
  const s = d ?? "";
  const lower = s.toLowerCase();

  // ---------- ACWR / LOAD SPIKE PATTERNS ----------
  // New style: "ACWR > 1.3 for 13 days"
  let m = s.match(/ACWR\s*>\s*([0-9.]+)\s*for\s*(\d+)\s*days/i);
  if (m) {
    const thresh = m[1];
    const days = m[2];
    return `Your training has been above your normal level for about ${days} days (ACWR > ${thresh}). That’s a sign to add a lighter day or two so the work turns into speed.`;
  }

  // New style: "ACWR high (1.73)"
  m = s.match(/ACWR\s*high\s*\(?\s*([0-9.]+)\s*\)?/i);
  if (m) {
    const v = Number(m[1]);
    const acwr = isFinite(v) ? v.toFixed(2) : m[1];
    return `Your recent training load is quite a bit higher than your usual (ACWR ${acwr}). Keep recovery tight — sleep, food, and maybe a lighter session — so you don’t slide into fatigue.`;
  }

  // Existing style: "Load spike: ACWR x.x"
  m = s.match(/Load spike:\s*ACWR\s*([0-9.]+)/i);
  if (m) {
    const v = Number(m[1]);
    const times = isFinite(v) ? v.toFixed(1) : m[1];
    return `You trained about ${times}× your usual amount this week — take 1–2 lighter days so your body catches up.`;
  }

  // New style: "Load spike +100% vs 4w avg" / "+80% vs 4w avg"
  m = s.match(/Load spike\s*\+?\s*([0-9.]+)\s*%\s*vs\s*4w\s*avg/i);
  if (m) {
    const pct = Number(m[1]);
    const p = isFinite(pct) ? pct.toFixed(0) : m[1];
    return `Your training jumped about +${p}% compared to your 4-week average. Big jumps are OK sometimes, but you’ll get more out of it with an easy day soon.`;
  }

  // Existing style: "Rising load: ACWR x.x"
  m = s.match(/Rising load:\s*ACWR\s*([0-9.]+)/i);
  if (m) {
    return `Training has climbed quickly lately — keep recovery strong so this work turns into speed.`;
  }

  // ---------- HEART RATE PATTERNS ----------
  m = s.match(/Resting HR \+(\d+)\s*bpm/i);
  if (m) {
    return `Morning heart rate is up ~${m[1]} bpm — common tired-body sign, so go easier and sleep well.`;
  }
  if (/Resting HR elevated/i.test(s)) {
    return `Morning heart rate has been higher lately — watch fatigue and take an easier day if needed.`;
  }

  // ---------- MOOD / WELLBEING PATTERNS ----------
  if (/Mood ↓|Mood down/i.test(s)) {
    return `Mood has been lower than normal lately — that often means fatigue is building.`;
  }

  // New style: "Mood below baseline"
  if (lower.includes("mood below baseline")) {
    return `Your mood has been sitting below your normal level lately. That usually means you’re carrying fatigue — back off a bit and recharge.`;
  }

  if (/Fatigue noted/i.test(s)) {
    return `You’ve felt tired a few times this week — your body’s asking for a reset day.`;
  }

  if (/Stress noted|Stress flagged/i.test(s)) {
    return `Stress has popped up a few times — keep sessions simple and recover well.`;
  }

  if (/Pain\/soreness noted|Pain noted/i.test(s)) {
    return `More soreness has shown up — back off a little instead of forcing it.`;
  }

  // ---------- PERFORMANCE / RISK FLAGS ----------
  if (/Performance risk high/i.test(s)) {
    return `Your body is showing several small signs of fatigue at the same time — recovery will bring you back up.`;
  }

  return s;
};

const StatsDailyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rangeDays, setRangeDays] = useState<number>(14);
  const [refreshKey, setRefreshKey] = useState(0);

  const [drivers, setDrivers] = useState<string[]>([]);

  const applyDate = () => setRefreshKey((k) => k + 1);

  // pull raw drivers for selected date so we can show friendly takeaway here
  useEffect(() => {
    const load = async () => {
      if (!user) {
        setDrivers([]);
        return;
      }
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const r = await fetchRiskForDate(user.id, dateStr);
      setDrivers(r?.drivers ?? []);
    };
    load();
  }, [user?.id, selectedDate.getTime(), refreshKey]);

  const friendlyTakeaways = drivers.map(friendlyDriver).filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-main">
            Daily Metrics Trend
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/stats")}>
            Back to Stats
          </Button>
        </div>

        {/* Date controls */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-center md:justify-start">
          <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <Button
            onClick={applyDate}
            className="px-6 py-2 text-sm font-semibold tracking-[0.14em] uppercase"
          >
            Update
          </Button>
        </div>

        {/* Top row: Risk + Takeaway */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-6">
          {/* LEFT: Risk card includes RAW Why */}
          <ReadinessRiskCard
            selectedDate={selectedDate}
            refreshKey={refreshKey}
            className="w-full h-full"
          />

          {/* RIGHT: Athlete-friendly takeaway (wired in) */}
          <Card className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-accent">
                Today’s takeaway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {friendlyTakeaways.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No takeaway yet — log a few days of training to build trends.
                </p>
              ) : (
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-3">
                  {friendlyTakeaways.slice(0, 3).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Graph full width */}
        <Card className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-accent">
              Daily Metrics Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-[620px]">
              <CombinedDailyMetricsChart
                selectedDate={selectedDate}
                rangeDays={rangeDays}
                setRangeDays={setRangeDays}
                refreshKey={refreshKey}
                className="h-full w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsDailyPage;
