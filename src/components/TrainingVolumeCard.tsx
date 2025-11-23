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
        // match ticked cards: full-height column card
        "h-full flex flex-col justify-between bg-card text-foreground shadow-md border border-white/80",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-2xl font-bold flex items-center text-accent">
          Training Distance (km)
        </CardTitle>
      </CardHeader>

      {/* match ticked cards: content fills remaining height and pushes input down */}
      <CardContent className="p-6 flex-1 flex items-end">
        <div className="w-full">
          <Input
            type="number"
            step="0.1"
            placeholder="Enter km"
            value={trainingVolume}
            onChange={handleTrainingVolumeChange}
            // slim like RPE input, not tall pill
            className="w-full !bg-background/70 text-center text-2xl font-bold py-2 rounded-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingVolumeCard;
