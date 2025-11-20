// src/pages/StatsGalleryPage.tsx
"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const StatsGalleryPage: React.FC = () => {
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
              Choose what you want to review instead of scrolling through everything at once.
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
          {/* Daily / Trend view */}
          <Card
            className="cursor-pointer hover:border-accent-strong/70 hover:shadow-lg transition"
            onClick={() => navigate("/stats/trend")}
          >
            <CardHeader>
              <CardTitle>Daily Trends</CardTitle>
              <CardDescription>
                See how mood, distance, and heart rate track day by day in a clean chart view.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Full stats (old heavy page) */}
          <Card
            className="cursor-pointer hover:border-accent-strong/70 hover:shadow-lg transition"
            onClick={() => navigate("/stats/full")}
          >
            <CardHeader>
              <CardTitle>Full Stats Summary</CardTitle>
              <CardDescription>
                Open the full stats dashboard with all charts, summary blocks, and weekly breakdowns.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Placeholder for future charts */}
          <Card className="opacity-70">
            <CardHeader>
              <CardTitle>Weekly Averages (coming soon)</CardTitle>
              <CardDescription>
                Planned: simple weekly averages for distance, intensity, and mood so you can spot overload fast.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="opacity-70">
            <CardHeader>
              <CardTitle>Heart Rate Focus (coming soon)</CardTitle>
              <CardDescription>
                Planned: dedicated heart-rate trends for recovery and red-flag sessions.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default StatsGalleryPage;
