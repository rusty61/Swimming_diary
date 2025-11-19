import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DailyEntry, fetchEntryForDate, upsertDailyEntry } from "@/data/dailyEntriesSupabase";
import { format } from "date-fns";
import { Dumbbell } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/utils"; // Import cn utility

interface TrainingVolumeCardProps {
  selectedDate: Date;
  onSaved?: () => void;
  className?: string; // Ensure className prop is defined
}

const TrainingVolumeCard: React.FC<TrainingVolumeCardProps> = ({ selectedDate, onSaved, className }) => {
  const { user } = useAuth();
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const [trainingVolume, setTrainingVolume] = useState<string>("");

  useEffect(() => {
    const loadTrainingVolume = async () => {
      if (!user) return;
      const entry = await fetchEntryForDate(user.id, selectedDate);
      if (entry && entry.trainingVolume !== undefined && entry.trainingVolume !== null) {
        setTrainingVolume(entry.trainingVolume.toString());
      } else {
        setTrainingVolume(""); // Clear if no entry for selected date
      }
    };
    loadTrainingVolume();
  }, [selectedDate, user]);

  const handleTrainingVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const value = e.target.value;
    setTrainingVolume(value);
    const numValue = value === "" ? null : parseFloat(value);
    await upsertDailyEntry(user.id, { date: formattedDate, trainingVolume: numValue });
    onSaved?.(); // Call onSaved after successful upsert
  };

      // keep ALL your hooks and logic above this point

  return (
    <Card
      className={cn(
        "bg-card text-foreground shadow-md border-card-border h-full flex flex-col",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center text-accent">
          Training Distance (km)
        </CardTitle>
      </CardHeader>

      {/* Anchor input to the bottom of the card so it lines up with Heart Rate */}
      <CardContent className="p-6 flex-1 flex items-end">
        <div className="w-full">
          <Input
            type="number"
            step="0.1"
            placeholder="Enter km"
            value={trainingVolume}
            onChange={handleTrainingVolumeChange}
            className="w-full !bg-input text-center text-4xl font-bold py-8 border-border text-foreground"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingVolumeCard;
