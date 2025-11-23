import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchMetricsForDate, upsertDailyMetrics } from "@/data/dailyMetricsSupabase";

interface RestingHRCardProps {
  selectedDate: Date;
  onSaved?: () => void;
  className?: string;
}

const RestingHRCard: React.FC<RestingHRCardProps> = ({
  selectedDate,
  onSaved,
  className,
}) => {
  const { user } = useAuth();
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const [restingHr, setRestingHr] = useState("");

  // *** FIX: clear state before fetching new date
  useEffect(() => {
    setRestingHr("");
  }, [formattedDate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const met = await fetchMetricsForDate(user.id, formattedDate);

      const value =
        met?.restingHr === null || met?.restingHr === undefined
          ? ""
          : String(met.restingHr);

      setRestingHr(value);
    };
    load();
  }, [user, formattedDate]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const value = e.target.value;
    setRestingHr(value);

    const num = value === "" ? null : parseFloat(value);

    await upsertDailyMetrics(user.id, { date: formattedDate, restingHr: num });
    onSaved?.();
  };

  return (
    <Card className={cn("h-full flex flex-col justify-between", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-2xl font-bold flex items-center text-accent">
          Resting HR (bpm)
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 flex-1 flex items-end">
        <div className="w-full">
          <Input
            type="number"
            step="1"
            placeholder="Morning HR"
            value={restingHr}
            onChange={handleChange}
            className="w-full !bg-background/70 text-center"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Best taken on waking, before training.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RestingHRCard;
