"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import InteractiveMoodCard from "@/components/InteractiveMoodCard";
import TrainingVolumeCard from "@/components/TrainingVolumeCard";
import DailyNotesCard from "@/components/DailyNotesCard";
import MotivationBoostCard from "@/components/MotivationBoostCard";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";
import ReadinessRiskCard from "@/components/ReadinessRiskCard";
import RPECard from "@/components/RPECard";
import RestingHRCard from "@/components/RestingHRCard";
import { DatePicker } from "@/components/DatePicker";
import { useAuth } from "@/auth/AuthContext";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

type MoodValue = number;

const DiaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dataVersion, setDataVersion] = useState(0);
  const [selectedSection, setSelectedSection] = useState<"diary" | "stats">(
    "diary",
  );

  const diaryRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

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
    setDataVersion((v) => v + 1);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <Button variant="secondary" onClick={applyDateSelection}>
            Apply Date
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={selectedSection === "diary" ? "default" : "outline"}
            onClick={handleOpenDiary}
          >
            Daily Diary
          </Button>
          <Button
            variant={selectedSection === "stats" ? "default" : "outline"}
            onClick={handleOpenStats}
          >
            Performance Stats
          </Button>

          <Button className="ml-2" onClick={handleDataSaved}>
            Update
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>

      {/* Diary section */}
      <div ref={diaryRef} className={cn(selectedSection !== "diary" && "hidden")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InteractiveMoodCard
            key={`mood-${dataVersion}`}
            selectedDate={selectedDate}
            onMoodChange={handleMoodChange}
            onSaved={handleDataSaved}
            className="h-full"
          />

          <TrainingVolumeCard
            key={`vol-${dataVersion}`}
            selectedDate={selectedDate}
            onSaved={handleDataSaved}
            className="h-full"
          />

          <RPECard
            key={`rpe-${dataVersion}`}
            selectedDate={selectedDate}
            onSaved={handleDataSaved}
            className="h-full"
          />

          <RestingHRCard
            key={`resting-${dataVersion}`}
            selectedDate={selectedDate}
            onSaved={handleDataSaved}
            className="h-full"
          />

          <DailyNotesCard
            key={`notes-${dataVersion}`}
            selectedDate={selectedDate}
            onSaved={handleDataSaved}
            className="md:col-span-2"
          />

          <MotivationBoostCard className="md:col-span-2" />
        </div>
      </div>

      {/* Stats section */}
      <div ref={statsRef} className={cn(selectedSection !== "stats" && "hidden")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WeeklySummaryCard selectedDate={selectedDate} refreshKey={dataVersion} />
          <ReadinessRiskCard selectedDate={selectedDate} refreshKey={dataVersion} />

          <div className="lg:col-span-2">
            <Button variant="outline" asChild className="w-full">
              <Link to="/stats">View Full Stats Page</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;
