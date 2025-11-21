// src/pages/StatsDailyPage.tsx
"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CombinedDailyMetricsChart from "@/components/CombinedDailyMetricsChart";

const StatsDailyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-3 pb-6 pt-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Daily Metrics Trend
          </h1>
          <p className="text-sm text-muted-foreground">
            Single chart showing training volume, mood, and heart rate. Use the
            legend pills underneath to turn each line on or off so it stays
            readable on your phone.
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

      <section className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 px-3 py-4 sm:px-5 sm:py-5">
        <CombinedDailyMetricsChart />
      </section>
    </div>
  );
};

export default StatsDailyPage;
