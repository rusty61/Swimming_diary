"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import CombinedDailyMetricsChart from "@/components/CombinedDailyMetricsChart"; // Re-using existing chart
import WeeklyTrainingAveragesChart from "@/components/WeeklyTrainingAveragesChart"; // New chart
import MotivationBoostCard from "@/components/MotivationBoostCard"; // Import MotivationBoostCard

const Stats = () => {
  const [chartRangeDays, setChartRangeDays] = useState<number>(28); // Default to 4 weeks for daily metrics
  const selectedDate = new Date(); // Stats page typically shows data up to today

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <Card className="w-full shadow-lg rounded-lg bg-card text-foreground border-card-border text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-accent">Performance Statistics</CardTitle>
            <CardDescription className="text-text-muted mt-2">
              Dive deep into your training trends and historical data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <p className="text-lg text-text-main">
              Analyze your progress over time with detailed charts and summaries.
            </p>
            <Button asChild className="bg-primary hover:bg-accent-strong text-primary-foreground text-lg py-2 rounded-md">
              <Link to="/diary">Go to Daily Diary</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Combined Daily Metrics Chart */}
          <div className="col-span-full">
            <CombinedDailyMetricsChart
              selectedDate={selectedDate}
              rangeDays={chartRangeDays}
              setRangeDays={setChartRangeDays}
            />
          </div>

          {/* Weekly Training Averages Chart */}
          <div className="col-span-full">
            <WeeklyTrainingAveragesChart numWeeks={12} /> {/* Show last 12 weeks */}
          </div>

          {/* Add more historical data components here as needed */}
        </div>
      </div>
      <div className="w-full max-w-2xl mt-8">
        <MotivationBoostCard />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Stats;