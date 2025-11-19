import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DailyEntry, fetchEntryForDate, upsertDailyEntry } from "@/data/dailyEntriesSupabase";
import { format } from "date-fns";
import { HeartPulse } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/utils"; // Import cn utility

interface HeartRateCardProps {
  selectedDate: Date;
  onSaved?: () => void;
  className?: string; // Ensure className prop is defined
}

const HeartRateCard: React.FC<HeartRateCardProps> = ({ selectedDate, onSaved, className }) => {
  const { user } = useAuth();
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const [heartRate, setHeartRate] = useState<string>("");

  useEffect(() => {
    const loadHeartRate = async () => {
      if (!user) return;
      const entry = await fetchEntryForDate(user.id, selectedDate);
      if (entry && entry.heartRate !== undefined && entry.heartRate !== null) {
        setHeartRate(entry.heartRate.toString());
      } else {
        setHeartRate(""); // Clear if no entry for selected date
      }
    };
    loadHeartRate();
  }, [selectedDate, user]);

  const handleHeartRateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const value = e.target.value;
    setHeartRate(value);
    const numValue = value === "" ? null : parseInt(value, 10);
    await upsertDailyEntry(user.id, { date: formattedDate, heartRate: numValue });
    onSaved?.(); // Call onSaved after successful upsert
  };

  return (
  <Card
    className={cn(
      "bg-card text-foreground shadow-md border-card-border h-full flex flex-col",
      className,
    )}
  >
    <CardHeader>
      <CardTitle className="text-2xl font-bold flex items-center text-accent">
        Heart Rate (BPM)
      </CardTitle>
    </CardHeader>

    {/* Anchor input to the bottom of the card */}
    <CardContent className="p-6 flex-1 flex items-end">
      <div className="w-full">
        <Input
          type="number"
          placeholder="Enter BPM"
          value={heartRate}
          onChange={handleHeartRateChange}
          className="w-full !bg-input text-center text-4xl font-bold py-8 border-border text-foreground"
        />
      </div>
    </CardContent>
  </Card>
 );
};



export default HeartRateCard;