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
  const [dataVersion, setDataVersion] = useState(0); // reserved if you later want per-day refresh

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
      <div className="max-w-7xl mx-auto py-8 z-10 relative">
        {/* Page title */}
        <div className="mb-4 flex justify-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-text-main">
            Session Log
          </h1>
        </div>

        <main className="max-w-5xl mx-auto px-4 pb-24">
          {/* Header row: title + date + update + logout */}
          <div className="mt-2 mb-4 grid grid-cols-1 gap-4 md:grid-cols-4 items-center">
            {/* 1. Heading + Review Notes */}
            <div className="flex items-center justify-start gap-3">
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-main">
                Training Entry
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/notes")}
                className="text-xs"
              >
                Review Notes
              </Button>
            </div>

            {/* 2. Date picker */}
            <div className="flex justify-center">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            {/* 3. Update (desktop/tablet only) */}
            <div className="hidden md:flex justify-center">
              <button
                onClick={applyDateSelection}
                className="px-8 py-3 text-sm font-semibold tracking-[0.14em] uppercase bg-primary text-primary-foreground border border-accent-strong shadow-[0_14px_35px_rgba(0,0,0,0.7)] hover:bg-accent-strong transition"
              >
                Update
              </button>
            </div>

            {/* 4. Logout */}
            <div className="flex justify-end">
              <Button
                onClick={handleLogout}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Training volume + notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
            <TrainingVolumeCard
              selectedDate={selectedDate}
              onSaved={handleDataSaved}
              className="h-full"
            />
            <DailyNotesCard
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

export default SessionLogPage;
