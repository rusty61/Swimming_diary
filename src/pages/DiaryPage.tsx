"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import InteractiveMoodCard from "@/components/InteractiveMoodCard";
import HeartRateCard from "@/components/HeartRateCard";
import TrainingVolumeCard from "@/components/TrainingVolumeCard";
import DailyNotesCard from "@/components/DailyNotesCard";
import MotivationBoostCard from "@/components/MotivationBoostCard";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";
import ReadinessRiskCard from "@/components/ReadinessRiskCard";
import { DatePicker } from "@/components/DatePicker";
import { useAuth } from "@/auth/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { MoodValue } from "@/components/MoodSelector";

const DiaryPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // SINGLE source of truth for the selected date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [selectedSection, setSelectedSection] = useState<"diary" | "stats">(
    "diary",
  );
  // used to force refresh of stats cards when user hits Update
  const [dataVersion, setDataVersion] = useState(0);

  const diaryRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedSection === "diary") {
      diaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedSection]);

  const handleMoodChange = (mood: MoodValue | null) => {
    console.log("Mood changed to:", mood);
  };

  // Update button now just bumps the dataVersion to refresh stats/cards,
  // the date itself is already controlled live by the DatePicker.
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

  const handleOpenDiary = () => {
    setSelectedSection("diary");
    diaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleViewStats = () => {
    setSelectedSection("stats");
    statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="max-w-7xl mx-auto py-8 z-10 relative">
        {/* Page title at the very top */}
        <div className="mb-4 flex justify-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-text-main">
            Your Daily Diary
          </h1>
        </div>

        {/* Navigation for Diary/Stats */}
        <nav className="flex justify-center gap-4 mb-8">
          <Button
            onClick={handleOpenDiary}
            className={`px-6 py-3 text-lg font-semibold rounded-lg transition-colors ${
              selectedSection === "diary"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Daily Diary
          </Button>
          <Button
            onClick={handleViewStats}
            className={`px-6 py-3 text-lg font-semibold rounded-lg transition-colors ${
              selectedSection === "stats"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Performance Stats
          </Button>
        </nav>

        {/* Motivation Boost Card (always visible, random quote from list) */}
        <div className="mb-8 max-w-5xl mx-auto px-4">
          <MotivationBoostCard />
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <main className="max-w-5xl mx-auto px-4 pb-16">
          {/* ---------- DIARY SECTION ---------- */}
          <section
            ref={diaryRef}
            id="diary-section"
            className="pt-4 scroll-mt-20"
            style={{ display: selectedSection === "diary" ? "block" : "none" }}
          >
            {/* Daily Entry + Date + Update + Logout */}
            <div className="mt-2 mb-4 grid grid-cols-1 gap-4 md:grid-cols-4 items-center">
              {/* 1. Daily Entry label + Review Notes button */}
              <div className="flex items-center justify-start gap-3">
                <h2 className="text-2xl sm:text-3xl font-semibold text-text-main">
                  Daily Entry
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

              {/* 3. Update button */}
              <div className="flex justify-center">
                <button
                  onClick={applyDateSelection}
                  className="px-8 py-3 text-sm font-semibold tracking-[0.14em] uppercase bg-primary text-primary-foreground border border-accent-strong shadow-[0_14px_35px_rgba(0,0,0,0.7)] hover:bg-accent-strong transition"
                >
                  Update
                </button>
              </div>

              {/* 4. Logout button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleLogout}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md"
                >
                  Logout
                </Button>
              </div>
            </div>

            {/* Metric Cards Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-stretch">
              <InteractiveMoodCard
                selectedDate={selectedDate}
                onMoodChange={handleMoodChange}
                onSaved={handleDataSaved}
                className="h-full"
              />
              <TrainingVolumeCard
                selectedDate={selectedDate}
                onSaved={handleDataSaved}
                className="h-full"
              />
              <HeartRateCard
                selectedDate={selectedDate}
                onSaved={handleDataSaved}
                className="h-full"
              />
            </div>

            {/* NEW: Readiness / Risk card */}
            <div className="mb-8">
              <ReadinessRiskCard selectedDate={selectedDate} />
            </div>

            {/* Daily Notes Card Container */}
            <div className="mb-8">
              <DailyNotesCard
                selectedDate={selectedDate}
                onSaved={handleDataSaved}
                className="h-80"
              />
            </div>
          </section>

          {/* ---------- STATS SECTION ---------- */}
          <section
            ref={statsRef}
            id="stats-section"
            className="pt-16 scroll-mt-20"
            style={{ display: selectedSection === "stats" ? "block" : "none" }}
          >
            <div className="flex flex-col items-center gap-8">
              {/* Heading + buttons row */}
              <div className="w-full max-w-4xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-3xl md:text-4xl font-semibold text-text-main text-center md:text-left">
                  Your Weekly Stats
                </h2>

                <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                  {/* NEW button: graph-only page */}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/stats/trend">View Metrics Trend</Link>
                  </Button>

                  {/* Existing full stats page */}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/stats">View Full Stats Page</Link>
                  </Button>
                </div>
              </div>

              {/* Weekly summary only (graph moved to its own page) */}
              <div className="w-full max-w-4xl flex flex-col gap-8">
                <WeeklySummaryCard
                  selectedDate={selectedDate}
                  refreshKey={dataVersion}
                  className="w-full"
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DiaryPage;
