// src/pages/Stats.tsx
"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Stats: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-text-main">
              Stats
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick one chart to review at a time. Each button opens a dedicated
              view so you're not scrolling through stacked graphs.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/today")}
            className="self-start"
          >
            Back to Today
          </Button>
        </header>

        {/* Tiles */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Trends */}
          <Card
            className="cursor-pointer rounded-3xl border border-[var(--card-border)] px-4 py-3 transition hover:border-[var(--accent)]/70 hover:shadow-lg"
            onClick={() => navigate("/stats/daily")}
          >
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Daily Trends
              </h2>
              <p className="text-xs text-muted-foreground">
                Single daily chart. Use the legend to toggle Training Volume,
                Heart Rate, or Mood.
              </p>
            </div>
          </Card>

          {/* Weekly Averages */}
          <Card
            className="cursor-pointer rounded-3xl border border-[var(--card-border)] px-4 py-3 transition hover:border-[var(--accent)]/70 hover:shadow-lg"
            onClick={() => navigate("/stats/weekly")}
          >
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Weekly Averages
              </h2>
              <p className="text-xs text-muted-foreground">
                Weekly bar chart so you can spot overload quickly.
              </p>
            </div>
          </Card>

          {/* Heart Rate Focus */}
          <Card
            className="cursor-pointer rounded-3xl border border-[var(--card-border)] px-4 py-3 transition hover:border-[var(--accent)]/70 hover:shadow-lg"
            onClick={() => navigate("/stats/heart")}
          >
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Heart Rate Focus
              </h2>
              <p className="text-xs text-muted-foreground">
                Heart-rate-only view for spotting red-flag and recovery days.
              </p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Stats;
