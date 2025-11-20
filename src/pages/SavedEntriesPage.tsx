// src/pages/SavedEntriesPage.tsx
"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// TEMP: mock data for layout only – replace with real data later
type SavedEntry = {
  date: string;       // e.g. "20 Nov 2025"
  weekday: string;    // e.g. "Thu"
  mood: string;       // e.g. "⚡ Strong", "😐 Flat"
  distanceKm: number; // e.g. 3.2
  avgHr?: number;     // optional average HR
};

const MOCK_ENTRIES: SavedEntry[] = [
  {
    date: "20 Nov 2025",
    weekday: "Thu",
    mood: "⚡ Strong",
    distanceKm: 3.2,
    avgHr: 158,
  },
  {
    date: "19 Nov 2025",
    weekday: "Wed",
    mood: "🙂 Solid",
    distanceKm: 2.8,
    avgHr: 152,
  },
  {
    date: "18 Nov 2025",
    weekday: "Tue",
    mood: "😐 Flat",
    distanceKm: 1.9,
    avgHr: 146,
  },
];

const SavedEntriesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToLog = () => {
    navigate("/log");
  };

  const handleViewDay = (entry: SavedEntry) => {
    // Later: navigate to a detailed daily view with the date as a query param
    console.log("View entry for", entry.date);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-text-main">
              Saved Entries
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quick view of recent days – mood, distance, and heart rate at a glance.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleBackToLog}>
            Back to Session Log
          </Button>
        </header>

        {/* List of entries */}
        <section className="space-y-3">
          {MOCK_ENTRIES.map((entry) => (
            <Card
              key={entry.date}
              className="cursor-pointer hover:border-accent-strong/70 hover:shadow-lg transition"
              onClick={() => handleViewDay(entry)}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    {entry.weekday} – {entry.date}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs sm:text-sm">
                    {entry.mood}
                  </CardDescription>
                </div>

                <div className="flex flex-col items-end text-right gap-1">
                  <span className="text-sm font-semibold">
                    {entry.distanceKm.toFixed(1)} km
                  </span>
                  {entry.avgHr && (
                    <span className="text-xs text-muted-foreground">
                      Avg HR: {entry.avgHr} bpm
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-wrap justify-between items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>Tap to open full notes and stats for this day (future feature).</span>
              </CardContent>
            </Card>
          ))}

          {MOCK_ENTRIES.length === 0 && (
            <p className="mt-8 text-sm text-muted-foreground">
              No entries yet. Once you’ve logged a few sessions, they’ll show up here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default SavedEntriesPage;
