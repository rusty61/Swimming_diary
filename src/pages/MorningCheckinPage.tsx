"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import InteractiveMoodCard from "@/components/InteractiveMoodCard";
import RPECard from "@/components/RPECard";
import RestingHRCard from "@/components/RestingHRCard";
import MotivationBoostCard from "@/components/MotivationBoostCard";
import { DatePicker } from "@/components/DatePicker";
import { cn } from "@/lib/utils";

const MorningCheckinPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dataVersion, setDataVersion] = useState(0);

  const applyDateSelection = () => {
    setDataVersion((v) => v + 1);
  };

  const handleDataSaved = () => {
    setDataVersion((v) => v + 1);
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
      </div>

      {/* Morning check-in cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InteractiveMoodCard
          key={`mood-${dataVersion}`}
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

        <MotivationBoostCard className={cn("md:col-span-2")} />
      </div>
    </div>
  );
};

export default MorningCheckinPage;
