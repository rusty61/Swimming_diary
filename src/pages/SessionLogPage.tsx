"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TrainingVolumeCard from "@/components/TrainingVolumeCard";
import DailyNotesCard from "@/components/DailyNotesCard";
import RPECard from "@/components/RPECard";
import RestingHRCard from "@/components/RestingHRCard";
import { DatePicker } from "@/components/DatePicker";
import { useAuth } from "@/auth/AuthContext";

const SessionLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dataVersion, setDataVersion] = useState(0);

  // IMPORTANT: do not rerender/remount on every save
  const handleDataSaved = () => {
    // no-op on log page (saves are live anyway)
  };

  const applyDateSelection = () => {
    setDataVersion((v) => v + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Home
            </Button>
            <button
              onClick={() => navigate("/notes")}
              className="px-6 py-2 text-xs sm:text-sm font-semibold text-accent bg-black/20 hover:bg-black/30 transition rounded-full"
            >
              Review Notes
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
            <DatePicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
            <button
              onClick={applyDateSelection}
              className="px-6 py-2 text-xs sm:text-sm font-semibold text-accent bg-black/20 hover:bg-black/30 transition rounded-full"
            >
              Update
            </button>
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </header>

        {/* Main content: distance + notes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="h-full">
            <TrainingVolumeCard
              key={`vol-${dataVersion}`}
              selectedDate={selectedDate}
              onSaved={handleDataSaved}
              className="h-full min-h-[260px]"
            />
          </div>

          <div className="h-full">
            <DailyNotesCard
              key={`notes-${dataVersion}`}
              selectedDate={selectedDate}
              onSaved={handleDataSaved}
              className="h-full min-h-[260px]"
            />
          </div>
        </section>

        {/* Intensity + Recovery section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
          <div className="h-full">
            <RPECard
              key={`rpe-${dataVersion}`}
              selectedDate={selectedDate}
              onSaved={handleDataSaved}
              className="h-full min-h-[220px]"
            />
          </div>

          <div className="h-full">
            <RestingHRCard
              key={`resthr-${dataVersion}`}
              selectedDate={selectedDate}
              onSaved={handleDataSaved}
              className="h-full min-h-[220px]"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default SessionLogPage;
