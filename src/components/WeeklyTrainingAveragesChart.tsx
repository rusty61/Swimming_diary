"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAllEntriesForUser, getWeeklyTrainingAveragesFromEntries } from '@/data/dailyEntriesSupabase';
import { useAuth } from "@/auth/AuthContext";

interface WeeklyTrainingAveragesChartProps {
  numWeeks: number;
}

const WeeklyTrainingAveragesChart: React.FC<WeeklyTrainingAveragesChartProps> = ({ numWeeks }) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<{ week: string; average: number }[]>([]);

  useEffect(() => {
    const loadChartData = async () => {
      if (!user) return;
      const allEntries = await fetchAllEntriesForUser(user.id);
      const averages = getWeeklyTrainingAveragesFromEntries(numWeeks, allEntries);
      setChartData(averages);
    };
    loadChartData();
  }, [user, numWeeks]);

  return (
    <Card className="w-full h-[350px] shadow-lg rounded-lg bg-card text-foreground border-card-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-accent">Weekly Training Averages (km)</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line-subtle)" />
            <XAxis dataKey="week" stroke="var(--text-muted)" />
            <YAxis stroke="var(--accent)" label={{ value: 'Avg. km', angle: -90, position: 'insideLeft', fill: 'var(--accent)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-main)' }} />
            <Legend />
            <Bar dataKey="average" fill="var(--accent-strong)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WeeklyTrainingAveragesChart;