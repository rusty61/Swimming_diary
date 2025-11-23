import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchEntryForDate, upsertDailyEntry } from "@/data/dailyEntriesSupabase";
import { format } from "date-fns";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/utils";

interface TrainingVolumeCardProps {
  selectedDate: Date;
  onSaved?: () => void;
  className?: string;
}

const TrainingVolumeCard: React.FC<TrainingVolumeCardProps> = ({
  selectedDate,
  onSaved,
  className,
}) => {
  const { user } = useAuth();
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const [trainingVolume, setTrainingVolume] = useState<string>("");

  useEffect(() => {
    setTrainingVolume("");
  }, [formattedDate]);

  useEffect(() => {
    const loadTrainingVolume = async () => {
      if (!user) return;
      const entry = await fetchEntryForDate(user.id, formattedDate);
      const value =
        entry?.trainingVolume === null || entry?.trainingVolume === undefined
          ? ""
          : entry.trainingVolume.toString();
      setTrainingVolume(value);
    };
    loadTrainingVolume();
  }, [formattedDate, user]);

  const handleTrainingVolumeChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) return;

    const value = e.target.value;
    setTrainingVolume(value);

    const numValue = value === "" ? null : parseFloat(value);

    await upsertDailyEntry(user.id, {
      date: formattedDate,
      trainingVolume: numValue,
    });

    onSaved?.();
  };

  return (
    <Card
      className={cn(
        "bg-card text-foreground shadow-md border border-white/80",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold text-accent">
          Training Distance (km)
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0">
        <Input
          type="number"
          step="0.1"
          placeholder="Enter km"
          value={trainingVolume}
          onChange={handleTrainingVolumeChange}
          className="w-full !bg-input text-center text-3xl font-bold py-5 border-border text-foreground rounded-full"
        />
      </CardContent>
    </Card>
  );
};

export default TrainingVolumeCard;
