// src/pages/MorningCheckinPage.tsx
"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import InteractiveMoodCard from "@/components/InteractiveMoodCard";
import HeartRateCard from "@/components/HeartRateCard";
import RPECard from "@/components/RPECard";
import RestingHRCard from "@/components/RestingHRCard";
import MotivationBoostCard from "@/components/MotivationBoostCard";
import { DatePicker } from "@/components/DatePicker";
import { useAuth } from "@/auth/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { MoodValue } from "@/components/MoodSelector";

const MorningCheckinPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dataVersion, setDataVersion] = useState(0);

  const handleMoodChange = (mood: MoodValue | null) => {
    console.log("Mood changed to:", mood);
  };

  const applyDateSelection = () => {
    setDataVersion((v) => v + 1);
    showSuccess("Date applied — cards refreshed.");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during logout.";
      showError(`An unexpected error occurred during logout: ${message}`);
      console.error("Unexpected logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="max-w-5xl mx-auto py-8 z-10 relative px-4">
        {/* ===== Top header ===== */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

          <div className="flex gap-2">
            <Button onClick={applyDateSelection} className="bg-accent">
              Update
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
          <InteractiveMoodCard
            key={`mood-${dataVersion}`}
            selectedDate={selectedDate}
            onMoodChange={handleMoodChange}
            className="h-full"
          />

          <HeartRateCard
            key={`hr-${dataVersion}`}
            selectedDate={selectedDate}
            className="h-full"
          />

          {/* NEW: daily_metrics cards */}
          <RPECard
            key={`rpe-${dataVersion}`}
            selectedDate={selectedDate}
            className="h-full"
          />

          <RestingHRCard
            key={`resthr-${dataVersion}`}
            selectedDate={selectedDate}
            className="h-full"
          />
        </div>

        <MotivationBoostCard />
      </div>
    </div>
  );
};

export default MorningCheckinPage;
