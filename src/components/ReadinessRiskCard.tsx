// src/components/ReadinessRiskCard.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { format } from "date-fns";
import { fetchRiskForDate } from "@/data/dailyMetricsSupabase";

interface Props {
  selectedDate: Date;
  className?: string;
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

// Convert model drivers into brief teen-friendly explanations
const friendlyDriver = (d: string) => {
  const s = d ?? "";

  // Load / ACWR
  let m = s.match(/Load spike:\s*ACWR\s*([0-9.]+)/i);
  if (m) {
    const v = Number(m[1]);
    const times = isFinite(v) ? v.toFixed(1) : m[1];
    return `You trained about ${times}× your usual this week — take 1–2 lighter days.`;
  }

  m = s.match(/Rising load:\s*ACWR\s*([0-9.]+)/i);
  if (m) {
    return `Training is climbing fast lately — keep recovery in mind.`;
  }

  // Resting HR
  m = s.match(/Resting HR \+(\d+)\s*bpm/i);
  if (m) {
    const bpm = m[1];
    return `Morning heart rate is up ~${bpm} bpm — your body may be tired.`;
  }
  if (/Resting HR elevated/i.test(s)) {
    return `Morning heart rate is a bit higher lately — watch fatigue.`;
  }

  // Mood / motivation
  m = s.match(/Mood down\s*([0-9.]+)%/i);
  if (m) {
    const pct = m[1];
    return `Mood has been ~${pct}% lower than normal lately.`;
  }
  if (/Mood slipping/i.test(s)) {
    return `Mood has been dropping a bit lately.`;
  }

  // Tags / notes
  m = s.match(/Fatigue noted\s*(\d+)×/i);
  if (m) {
    const n = m[1];
    return `You’ve felt tired a few times this week (${n} days).`;
  }

  m = s.match(/Stress flagged\s*(\d+)×/i);
  if (m) {
    const n = m[1];
    return `Stress has shown up a few times this week (${n} days).`;
  }

  m = s.match(/Pain\/soreness noted\s*(\d+)×/i);
  if (m) {
    const n = m[1];
    return `More soreness/pain noted this week (${n} days).`;
  }

  if (/Load up while mood trending down/i.test(s)) {
    return `Training is up while mood is down — that combo can drain you.`;
  }

  if (/Performance risk high/i.test(s)) {
    return `A few signals together suggest a performance dip risk.`;
  }

  // Fallback: return original if we don't recognize it
  return s;
};

const ReadinessRiskCard: React.FC<Props> = ({ selectedDate, className }) => {
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
  }, [user, formattedDate]);

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

            {risk.drivers?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-1">Why:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {risk.drivers.slice(0, 4).map((d, i) => (
                    <li key={i}>{friendlyDriver(d)}</li>
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
