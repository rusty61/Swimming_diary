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
import RPECard from "@/components/RPECard";
import RestingHRCard from "@/components/RestingHRCard";
import { DatePicker } from "@/components/DatePicker";
import { useAuth } from "@/auth/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { MoodValue } from "@/components/MoodSelector";

const DiaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [selectedSection, setSelectedSection] = useState<"diary" | "stats">(
    "diary"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  const applyDateSelection = () => {
    setDataVersion((v) => v + 1);
    showSuccess("Date applied — cards refreshed.");
  };

  const handleOpenDiary = () => setSelectedSection("diary");
  const handleOpenStats = () => setSelectedSection("stats");

  const handleDataSaved = () => {
    // leave this lightweight; cards already toast on save
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
      <div className="max-w-7xl mx-auto py-8 z-10 relative">
        <div className="mb-4 flex justify-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-text-main">
            Your Daily Diary
          </h1>
        </div>

        <nav className="flex justify-center gap-4 mb-8">
          <Button
            onClick={handleOpenDiary}
            className={`px-6 py-3 text-lg font-semibold rounded-lg transition-colors ${
              selectedSection === "diary"
                ? "bg-accent text-white"
                : "bg-input text-foreground hover:bg-accent/20"
            }`}
          >
            Diary
          </Button>

          <Button
            onClick={handleOpenStats}
            className={`px-6 py-3 text-lg font-semibold rounded-lg transition-colors ${
              selectedSection === "stats"
                ? "bg-accent text-white"
                : "bg-input text-foreground hover:bg-accent/20"
            }`}
          >
            Stats
          </Button>
        </nav>

        <main className="px-4">
          <section ref={diaryRef} className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />

              <div className="flex gap-2">
                <Button onClick={applyDateSelection} className="bg-accent">
                  Update
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
            </div>

            {/* IMPORTANT: items-start prevents short cards being stretched tall */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-start">
              <InteractiveMoodCard
                key={`mood-${dataVersion}`}
                selectedDate={selectedDate}
                onMoodChange={handleMoodChange}
                onSaved={handleDataSaved}
                className="h-full"
              />

              {/* no h-full -> stays compact */}
              <TrainingVolumeCard
                key={`vol-${dataVersion}`}
                selectedDate={selectedDate}
                onSaved={handleDataSaved}
              />

              <HeartRateCard
                key={`hr-${dataVersion}`}
                selectedDate={selectedDate}
                onSaved={handleDataSaved}
                className="h-full"
              />

              {/* RPE left, natural height */}
              <RPECard
                key={`rpe-${dataVersion}`}
                selectedDate={selectedDate}
                onSaved={handleDataSaved}
                className="md:col-start-1"
              />

              {/* Resting HR right, natural height */}
              <RestingHRCard
                key={`resthr-${dataVersion}`}
                selectedDate={selectedDate}
                onSaved={handleDataSaved}
                className="md:col-start-3"
              />
            </div>

            <div className="mb-8">
              <ReadinessRiskCard
                key={`risk-${dataVersion}`}
                selectedDate={selectedDate}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <DailyNotesCard
                key={`notes-${dataVersion}`}
                selectedDate={selectedDate}
                onSaved={handleDataSaved}
              />
              <MotivationBoostCard />
            </div>

            <div className="mb-8">
              <WeeklySummaryCard
                selectedDate={selectedDate}
                refreshKey={dataVersion}
                className="w-full"
              />
            </div>

            <div className="flex justify-center mt-4">
              <Link to="/stats">
                <Button variant="outline">View Full Stats Page</Button>
              </Link>
            </div>
          </section>

          <section ref={statsRef}>
            {/* Keep your stats layout unchanged */}
          </section>
        </main>
      </div>
    </div>
  );
};

export default DiaryPage;
