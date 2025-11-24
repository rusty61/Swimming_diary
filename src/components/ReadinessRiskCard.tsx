// src/components/ReadinessRiskCard.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { format } from "date-fns";
import { fetchRiskForDate } from "@/data/dailyMetricsSupabase";

interface Props {
  selectedDate: Date;
  refreshKey?: number;
  className?: string;
  hideWhy?: boolean; // keep for flexibility
}

const barClass = (v: number) => {
  if (v >= 0.7) return "bg-red-500/80";
  if (v >= 0.4) return "bg-yellow-500/80";
  return "bg-green-500/80";
};

const label = (v: number) => {
  if (v >= 0.7) return "High";
  if (v >= 0.4) return "Moderate";
  return "Low";
};

const ReadinessRiskCard: React.FC<Props> = ({
  selectedDate,
  refreshKey,
  className,
  hideWhy = false,
}) => {
  const { user } = useAuth();
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const [risk, setRisk] = useState<{
    overtrainRisk: number;
    motivationRisk: number;
    performanceRisk: number;
    drivers: string[];
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const r = await fetchRiskForDate(user.id, formattedDate);
      if (!r) {
        setRisk(null);
        return;
      }

      setRisk({
        overtrainRisk: r.overtrainRisk,
        motivationRisk: r.motivationRisk,
        performanceRisk: r.performanceRisk,
        drivers: r.drivers ?? [],
      });
    };

    load();
  }, [user, formattedDate, refreshKey]);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-accent">
          Readiness / Risk (Option A)
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!risk && (
          <p className="text-sm text-muted-foreground">
            No risk data yet. Log a few days of training + RPE.
          </p>
        )}

        {risk && (
          <>
            <div className="space-y-2">
              {[
                ["Overtraining", risk.overtrainRisk],
                ["Motivation", risk.motivationRisk],
                ["Performance dip", risk.performanceRisk],
              ].map(([name, v]) => (
                <div key={name as string}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{name}</span>
                    <span className="font-semibold">{label(v as number)}</span>
                  </div>
                  <div className="w-full h-2 rounded bg-white/10 overflow-hidden">
                    <div
                      className={cn("h-full rounded", barClass(v as number))}
                      style={{ width: `${Math.round((v as number) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* WHY = RAW ONLY (moved/kept in this card) */}
            {!hideWhy && risk.drivers?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-1">Why:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {risk.drivers.slice(0, 4).map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              This is an early-warning trend model, not a diagnosis.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadinessRiskCard;
