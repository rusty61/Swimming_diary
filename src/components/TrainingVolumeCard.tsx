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

  // reset old data immediately on date change
  useEffect(() => {
    setTrainingVolume("");
  }, [formattedDate]);

  useEffect(() => {
    const loadTrainingVolume = async () => {
      if (!user) return;
      const entry = await fetchEntryForDate(user.id, formattedDate);

      const value =
        entry?.trainingVolume === null ||
        entry?.trainingVolume === undefined
          ? ""
          : entry.trainingVolume.toString();

      setTrainingVolume(value);
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
        // IMPORTANT: no h-full / flex-grow here -> card stays compact
        "bg-card text-foreground shadow-md border-card-border",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold flex items-center text-accent">
          Training Distance (km)
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="w-full">
          <Input
            type="number"
            step="0.1"
            placeholder="Enter km"
            value={trainingVolume}
            onChange={handleTrainingVolumeChange}
            className="w-full !bg-input text-center text-3xl font-bold py-4 border-border text-foreground"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingVolumeCard;
