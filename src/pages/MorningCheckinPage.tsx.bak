// src/pages/MorningCheckinPage.tsx
"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import InteractiveMoodCard from "@/components/InteractiveMoodCard";
import HeartRateCard from "@/components/HeartRateCard";
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
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="max-w-5xl mx-auto py-8 z-10 relative px-4">
        {/* ===== Top header ===== */}
        <header className="mb-6 space-y-3">
          {/* Row 1: title + actions */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-semibold text-text-main">
              Morning Check-in
            </h1>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/help")}
                className="text-xs"
              >
                How it works
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Row 2: short subtitle */}
          <p className="text-sm text-muted-foreground">
            Log how you feel and your heart rate once per day. Use Log for distance and notes after training.
          </p>
        </header>

        {/* Motivation Boost Card */}
        <div className="mb-8">
          <MotivationBoostCard />
        </div>

        {/* ===== Main content ===== */}
        <main className="pb-24">
          {/* Header row: Daily Entry, date, Update (desktop only) */}
          <div className="mt-2 mb-4 grid grid-cols-1 gap-4 md:grid-cols-4 items-center">
            {/* 1. Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-main">
             </h2>
              {/*
              <p className="text-xs text-muted-foreground">
               Mood &amp; heart rate
               </p>
               */}
             </div>

            {/* 2. Date picker */}
            <div className="flex justify-center">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            {/* 3. Update (desktop/tablet) */}
            <div className="hidden md:flex justify-center">
              <button
                onClick={applyDateSelection}
                className="px-8 py-3 text-sm font-semibold tracking-[0.14em] uppercase bg-primary text-primary-foreground border border-accent-strong shadow-[0_14px_35px_rgba(0,0,0,0.7)] hover:bg-accent-strong transition rounded-md"
              >
                Update
              </button>
            </div>

            {/* 4. Spacer (for grid balance) */}
            <div className="hidden md:block" />
          </div>

          {/* Mood + HR cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
            <InteractiveMoodCard
              selectedDate={selectedDate}
              onMoodChange={handleMoodChange}
              onSaved={handleDataSaved}
              className="h-full"
            />
            <HeartRateCard
              selectedDate={selectedDate}
              onSaved={handleDataSaved}
              className="h-full"
            />
          </div>
        </main>

        {/* Mobile sticky Update button */}
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 md:hidden">
          <button
            onClick={applyDateSelection}
            className="w-full px-8 py-3 text-sm font-semibold tracking-[0.14em] uppercase bg-primary text-primary-foreground border border-accent-strong shadow-[0_14px_35px_rgba(0,0,0,0.7)] hover:bg-accent-strong transition rounded-md"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default MorningCheckinPage;
