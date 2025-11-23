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
    const loadTrainingVolume = async () => {
      if (!user) return;
      const entry = await fetchEntryForDate(user.id, formattedDate);
      if (
        entry &&
        entry.trainingVolume !== undefined &&
        entry.trainingVolume !== null
      ) {
        setTrainingVolume(entry.trainingVolume.toString());
      } else {
        setTrainingVolume("");
      }
    };
    loadTrainingVolume();
  }, [formattedDate, user]);

  const handleTrainingVolumeChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
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
        "bg-card text-foreground shadow-md border-card-border h-full flex flex-col",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center text-accent">
          Training Distance (km)
        </CardTitle>
      </CardHeader>

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
