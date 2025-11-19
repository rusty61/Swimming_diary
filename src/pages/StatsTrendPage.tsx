"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import CombinedDailyMetricsChart from "@/components/CombinedDailyMetricsChart";

const StatsTrendPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [chartRangeDays, setChartRangeDays] = useState<number>(7);
  const [refreshKey, setRefreshKey] = useState(0);

  const applyDate = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header row */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-main">
            Daily Metrics Trend
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        {/* Date + update controls */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-center md:justify-start">
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <Button
            onClick={applyDate}
            className="px-6 py-2 text-sm font-semibold tracking-[0.14em] uppercase"
          >
            Update
          </Button>
        </div>

        {/* BIG trend chart */}
        <div className="flex justify-center">
          <div className="w-full max-w-5xl origin-top scale-125 md:scale-125 sm:scale-110">
            <CombinedDailyMetricsChart
              selectedDate={selectedDate}
              rangeDays={chartRangeDays}
              setRangeDays={setChartRangeDays}
              refreshKey={refreshKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTrendPage;
