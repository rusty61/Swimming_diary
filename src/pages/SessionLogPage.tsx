// src/pages/SessionLogPage.tsx
"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TrainingVolumeCard from "@/components/TrainingVolumeCard";
import DailyNotesCard from "@/components/DailyNotesCard";
import { DatePicker } from "@/components/DatePicker";
import { useAuth } from "@/auth/AuthContext";
import { showError, showSuccess } from "@/utils/toast";

const SessionLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dataVersion, setDataVersion] = useState(0);

  const applyDateSelection = () => {
    setDataVersion((v) => v + 1);
  };

  const handleDataSaved = () => {
    setDataVersion((v) => v + 1);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showSuccess("You have been logged out.");
      navigate("/login");
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ===== Top header ===== */}
        <header className="mb-8 space-y-4">
          {/* Row 1: page title + logout */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-semibold text-text-main">
              Session Log
            </h1>
            <Button
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md"
            >
              Logout
            </Button>
          </div>

          {/* Row 2: Training Entry heading */}
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-text-main">
              Training Entry
            </h2>
          </div>

          {/* Row 3: buttons + date + update all aligned */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left: History + Review Notes – aligned with UPDATE */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/log/history")}
                className="px-5 py-2 text-xs sm:text-sm font-semibold tracking-[0.14em] uppercase border border-accent-strong rounded-full bg-transparent text-primary-foreground hover:bg-accent-strong/10 transition"
              >
                History
              </button>
              <button
                onClick={() => navigate("/notes")}
                className="px-5 py-2 text-xs sm:text-sm font-semibold tracking-[0.14em] uppercase border border-accent-strong rounded-full bg-transparent text-primary-foreground hover:bg-accent-strong/10 transition"
              >
                Review Notes
              </button>
            </div>

            {/* Right: Date + UPDATE */}
            <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
              <button
                onClick={applyDateSelection}
                className="px-6 py-2 text-xs sm:text-sm font-semibold tracking-[0.14em] uppercase bg-transparent text-primary-foreground border border-accent-strong shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:bg-accent-strong/20 transition rounded-full"
              >
                Update
              </button>
            </div>
          </div>
        </header>

        {/* ===== Main content: distance + notes ===== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Training Distance card */}
          <div className="h-full">
            <TrainingVolumeCard
              selectedDate={selectedDate}
              onSaved={handleDataSaved}
              className="h-full min-h-[260px]"
            />
          </div>

          {/* Notes card */}
          <div className="h-full">
            <DailyNotesCard
              selectedDate={selectedDate}
              onSaved={handleDataSaved}
              className="h-full min-h-[260px]"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default SessionLogPage;
