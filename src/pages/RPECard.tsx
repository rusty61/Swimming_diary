import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchMetricsForDate, upsertDailyMetrics } from "@/data/dailyMetricsSupabase";

interface RPECardProps {
  selectedDate: Date;
  onSaved?: () => void;
  className?: string;
}

const RPECard: React.FC<RPECardProps> = ({ selectedDate, onSaved, className }) => {
  const { user } = useAuth();
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const [rpe, setRpe] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const met = await fetchMetricsForDate(user.id, formattedDate);
      setRpe(met?.rpe != null ? String(met.rpe) : "");
    };
    load();
  }, [user, formattedDate]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const value = e.target.value;
    setRpe(value);
    const num = value === "" ? null : parseFloat(value);

    await upsertDailyMetrics(user.id, { date: formattedDate, rpe: num ?? null });
    onSaved?.();
  };

  return (
    <Card className={cn("h-full flex flex-col justify-between", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-2xl font-bold flex items-center text-accent">
          Intensity (RPE 1–10)
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 flex-1 flex items-end">
        <div className="w-full">
          <Input
            type="number"
            min="1"
            max="10"
            step="1"
            placeholder="Enter RPE"
            value={rpe}
            onChange={handleChange}
            className="w-full !bg-background/70"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Rate how hard today felt overall.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RPECard;
