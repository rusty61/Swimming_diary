// src/pages/MorningCheckinPage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import DailyNotesCard from "@/components/DailyNotesCard";
import InteractiveMoodCard from "@/components/InteractiveMoodCard";
import HeartRateCard from "@/components/HeartRateCard";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";
import MotivationBoostCard from "@/components/MotivationBoostCard";

import { useAuth } from "@/auth/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { MoodValue } from "@/components/MoodSelector";
import { supabase } from "@/lib/supabaseClient";

const MorningCheckinPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const [inputDate, setInputDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [mood, setMood] = useState<MoodValue | null>(null);
  const [restingHr, setRestingHr] = useState<number | "">("");

  const [loading, setLoading] = useState(false);

  const dayKey = useMemo(() => {
    const d = selectedDate ?? new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("daily_entries")
          .select("mood, resting_hr")
          .eq("user_id", user.id)
          .eq("date", dayKey)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        setMood((data?.mood ?? null) as MoodValue | null);
        setRestingHr(data?.resting_hr ?? "");
      } catch (e: any) {
        console.error(e);
        showError("Couldn’t load day entry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, dayKey]);

  const onUpdate = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const payload = {
        user_id: user.id,
        date: dayKey,
        mood: mood ?? null,
        resting_hr: restingHr === "" ? null : Number(restingHr),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("daily_entries")
        .upsert(payload, { onConflict: "user_id,date" });

      if (error) throw error;

      showSuccess("Morning check-in saved.");
    } catch (e: any) {
      console.error(e);
      showError("Couldn’t save check-in.");
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (d: Date) => {
    setInputDate(d);
    setSelectedDate(d);
  };

  return (
    <main className="shell flex min-h-screen flex-col items-center p-4">
      <div className="w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="heading-display text-center text-3xl md:text-4xl">
            Morning Check-in
          </h1>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => navigate("/how-it-works")}
            >
              How it works
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={signOut}>
              Logout
            </Button>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Log how you feel and your heart rate once per day. Use Log for distance
          and notes after training.
        </p>
      </div>

      <div className="mb-6 w-full max-w-5xl">
        <MotivationBoostCard />
      </div>

      <div className="mb-6 flex w-full max-w-5xl flex-col items-center justify-center gap-3 md:flex-row">
        <DatePicker date={inputDate} onChange={onChangeDate} />
        <Button
          onClick={onUpdate}
          disabled={loading}
          className="min-w-[140px] rounded-full border border-emerald-500/40 bg-transparent text-white hover:bg-emerald-500/10"
        >
          {loading ? "Saving..." : "UPDATE"}
        </Button>
      </div>

      <section className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        <InteractiveMoodCard
          value={mood}
          onChange={(v) => setMood(v)}
          title="Daily Mood"
        />

        <HeartRateCard
          value={restingHr}
          onChange={(v) => setRestingHr(v)}
          title="Heart Rate (BPM)"
          placeholder="Enter BPM"
        />
      </section>

      {/* weekly card in your marked zone */}
      <section className="mt-6 w-full max-w-5xl">
        <WeeklySummaryCard selectedDate={selectedDate} />
      </section>

      <section className="mt-6 w-full max-w-5xl">
        <DailyNotesCard selectedDate={selectedDate} />
      </section>

      <div className="h-10" />
    </main>
  );
};

export default MorningCheckinPage;
