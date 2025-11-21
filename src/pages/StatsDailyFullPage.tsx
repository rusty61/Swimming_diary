// src/pages/StatsDailyFullPage.tsx
"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import CombinedDailyMetricsChart from "@/components/CombinedDailyMetricsChart";

const StatsDailyFullPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [refreshKey, setRefreshKey] = useState(0);

  const applyDate = () => setRefreshKey((k) => k + 1);

  return (
    // Full-screen overlay that sits on top of the normal app shell & bottom nav
    <div className="fixed inset-0 z-40 bg-background text-foreground">
      <div className="flex h-full flex-col px-4 py-4">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-full px-4"
          >
            Close
          </Button>
          <h1 className="text-base sm:text-lg font-semibold text-text-main">
            Daily Metrics – Full Screen
          </h1>
          <div className="w-[72px]" /> {/* spacer to balance the Close button */}
        </div>

        {/* Date + Update controls */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <Button
            onClick={applyDate}
            className="px-5 py-2 text-xs font-semibold tracking-[0.14em] uppercase"
          >
            Update
          </Button>
        </div>

        {/* Chart fills the rest of the screen */}
        <div className="flex-1">
          <CombinedDailyMetricsChart
            selectedDate={selectedDate}
            rangeDays={rangeDays}
            setRangeDays={setRangeDays}
            refreshKey={refreshKey}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default StatsDailyFullPage;
