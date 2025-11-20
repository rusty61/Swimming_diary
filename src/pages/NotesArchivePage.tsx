"use client";

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";

type DailyNoteRow = {
  id: string;
  user_id: string;
  entry_date: string; // yyyy-MM-dd from Supabase
  note_type: string;
  content: string;
};

type GroupedNotes = {
  entryDate: Date;
  entryDateStr: string;
  insight?: string;
  nutrition?: string;
  positive?: string;
};

const NotesArchivePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: rows,
    isLoading,
    isError,
    error,
  } = useQuery<DailyNoteRow[] | null>({
    queryKey: ["daily-notes-archive", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("daily_notes")
        .select("id, user_id, entry_date, note_type, content")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      if (error) {
        console.error("Error loading notes archive:", error);
        showError("Could not load notes archive.");
        throw error;
      }

      return data ?? [];
    },
  });

  const grouped = useMemo<GroupedNotes[]>(() => {
    if (!rows || rows.length === 0) return [];

    const map = new Map<string, GroupedNotes>();

    for (const row of rows) {
      const key = row.entry_date;
      let existing = map.get(key);
      if (!existing) {
        const d = new Date(row.entry_date);
        existing = {
          entryDate: d,
          entryDateStr: row.entry_date,
        };
        map.set(key, existing);
      }

      const content = row.content ?? "";
      switch (row.note_type) {
        case "insight":
          existing.insight = content;
          break;
        case "nutrition":
          existing.nutrition = content;
          break;
        case "positive":
          existing.positive = content;
          break;
        default:
          // ignore unknown types for now
          break;
      }
    }

    // Sort newest → oldest
    return Array.from(map.values()).sort(
      (a, b) => b.entryDate.getTime() - a.entryDate.getTime(),
    );
  }, [rows]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Please log in to view your notes archive.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header row */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-text-main">
            Notes Archive
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="px-4"
          >
            Back
          </Button>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading notes…</p>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Error loading notes:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        )}

        {!isLoading && grouped.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No notes saved yet. Start writing in your daily diary!
          </p>
        )}

        <div className="space-y-6">
          {grouped.map((day) => (
            <article
              key={day.entryDateStr}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-5 shadow-md"
            >
              {/* Date header */}
              <header className="mb-3">
                <h2 className="text-base font-semibold text-[var(--accent-soft)]">
                  {format(day.entryDate, "EEE, d MMM yyyy")}
                </h2>
              </header>

              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-semibold tracking-wide text-xs text-text-main">
                    TECHNIQUE &amp; PHYSICAL INSIGHT
                  </div>
                  <div className="text-[13px] text-text-main">
                    {day.insight && day.insight.trim().length > 0
                      ? day.insight
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="font-semibold tracking-wide text-xs text-text-main">
                    NUTRITION &amp; HYDRATION
                  </div>
                  <div className="text-[13px] text-text-main">
                    {day.nutrition && day.nutrition.trim().length > 0
                      ? day.nutrition
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="font-semibold tracking-wide text-xs text-text-main">
                    SOMETHING POSITIVE ABOUT TODAY
                  </div>
                  <div className="text-[13px] text-text-main">
                    {day.positive && day.positive.trim().length > 0
                      ? day.positive
                      : "—"}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotesArchivePage;
