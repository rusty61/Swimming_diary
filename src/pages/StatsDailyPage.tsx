// src/pages/StatsDailyPage.tsx
"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import CombinedDailyMetricsChart from "@/components/CombinedDailyMetricsChart";
import ReadinessRiskCard from "@/components/ReadinessRiskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StatsDailyPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rangeDays, setRangeDays] = useState<number>(14);
  const [refreshKey, setRefreshKey] = useState(0);

  const applyDate = () => setRefreshKey((k) => k + 1);

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
          {/* LEFT: Risk card now includes raw Why */}
          <ReadinessRiskCard
            selectedDate={selectedDate}
            refreshKey={refreshKey}
            className="w-full h-full"
          />

          {/* RIGHT: Takeaway card stays */}
          <Card className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-accent">
                Today’s takeaway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This box is for the simple athlete-friendly summary.
                (We’ll wire its text next if you want it to stay.)
              </p>
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
