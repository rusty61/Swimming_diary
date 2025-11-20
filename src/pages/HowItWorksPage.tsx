// src/pages/HowItWorksPage.tsx
"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-text-main">
              How Mood Swimmer Works
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Quick guide to using the diary, session log, and stats without getting lost in screens.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </header>

        {/* Sections */}
        <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-text-main">
              1. Today – Morning Check-in
            </h2>
            <p className="mt-1">
              Each day, start on <span className="font-medium">Today</span> and log:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Your overall mood for the day.</li>
              <li>Resting or pre-session heart rate.</li>
              <li>Use this as a quick “how am I feeling?” snapshot, not a full training log.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-main">
              2. Log – Session Details & Notes
            </h2>
            <p className="mt-1">
              After training, go to <span className="font-medium">Log</span>:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Record your training distance or volume for the day.</li>
              <li>Add notes on technique, nutrition, and something positive about the session.</li>
              <li>Use <span className="font-medium">Review Notes</span> to look back at the full written history.</li>
              <li>Use <span className="font-medium">History</span> for a quick snapshot of recent days.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-main">
              3. Stats – Trends & Load
            </h2>
            <p className="mt-1">
              The <span className="font-medium">Stats</span> tab gives you a clean entry point:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>
                <span className="font-medium">Daily Trends</span> shows mood, distance, and heart rate on the same chart.
              </li>
              <li>
                <span className="font-medium">Full Stats Summary</span> opens the full dashboard with all charts and numbers.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-main">
              4. Profile & Setup
            </h2>
            <p className="mt-1">
              In <span className="font-medium">Profile</span>, you can adjust your details, preferences, and targets so the
              app reflects how you actually train.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-main">
              5. A simple routine
            </h2>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Morning: log mood and heart rate on <span className="font-medium">Today</span>.</li>
              <li>After training: log distance and notes on <span className="font-medium">Log</span>.</li>
              <li>Once or twice a week: check <span className="font-medium">Stats</span> to watch trends.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HowItWorksPage;
