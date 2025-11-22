"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";

type DailyNotesCardProps = {
  selectedDate: Date;
};

type NotesState = {
  insight: string;
  nutrition: string;
  positive: string;
};

type DailyNoteRow = {
  id?: string;
  user_id: string;
  entry_date: string; // yyyy-MM-dd
  note_type: string;
  content: string;
};

const NOTE_TYPES = {
  insight: "insight",
  nutrition: "nutrition",
  positive: "positive",
} as const;

const emptyNotes: NotesState = {
  insight: "",
  nutrition: "",
  positive: "",
};

const DailyNotesCard: React.FC<DailyNotesCardProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState<NotesState>(emptyNotes);

  const entryDateStr = useMemo(
    () => format(selectedDate, "yyyy-MM-dd"),
    [selectedDate]
  );

  // ───────────────── LOAD EXISTING NOTES FOR USER + DATE ─────────────────

  const {
    data: rows,
    isLoading,
    isFetching,
  } = useQuery<DailyNoteRow[] | null>({
    queryKey: ["daily-notes", user?.id, entryDateStr],
    enabled: !!user && !!entryDateStr,
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("daily_notes")
        .select("id, user_id, entry_date, note_type, content")
        .eq("user_id", user.id)
        .eq("entry_date", entryDateStr);

      if (error) {
        console.error("Error loading daily notes:", error);
        throw error;
      }

      return data ?? [];
    },
  });

  // When query result or date changes, push into local state
  useEffect(() => {
    if (!rows || rows.length === 0) {
      setNotes(emptyNotes);
      return;
    }

    const next: NotesState = { ...emptyNotes };

    for (const row of rows) {
      switch (row.note_type) {
        case NOTE_TYPES.insight:
          next.insight = row.content ?? "";
          break;
        case NOTE_TYPES.nutrition:
          next.nutrition = row.content ?? "";
          break;
        case NOTE_TYPES.positive:
          next.positive = row.content ?? "";
          break;
        default:
          // ignore unknown types for now
          break;
      }
    }

    setNotes(next);
  }, [rows, entryDateStr]);

  // ───────────────── SAVE / UPSERT NOTES ─────────────────

  const saveMutation = useMutation({
    mutationFn: async (payload: DailyNoteRow[]) => {
      const { error } = await supabase
        .from("daily_notes")
        .upsert(payload, {
          // This matches your unique index (user_id, entry_date, note_type)
          onConflict: "user_id,entry_date,note_type",
        });

      if (error) {
        console.error("Error saving daily notes:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["daily-notes", user?.id, entryDateStr],
      });
      showSuccess("Daily notes saved");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Daily notes save error:", message);
      showError("Could not save notes. Check console for details.");
    },
  });

  const handleSave = () => {
    if (!user) {
      showError("You must be logged in to save notes.");
      return;
    }

    const payload: DailyNoteRow[] = [
      {
        user_id: user.id,
        entry_date: entryDateStr,
        note_type: NOTE_TYPES.insight,
        content: notes.insight.trim(),
      },
      {
        user_id: user.id,
        entry_date: entryDateStr,
        note_type: NOTE_TYPES.nutrition,
        content: notes.nutrition.trim(),
      },
      {
        user_id: user.id,
        entry_date: entryDateStr,
        note_type: NOTE_TYPES.positive,
        content: notes.positive.trim(),
      },
    ];

    saveMutation.mutate(payload);
  };

  const handleChange =
    (field: keyof NotesState) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNotes((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const saving = saveMutation.isPending;
  const loading = isLoading || isFetching;

  return (
    <section className="mt-8 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--accent-soft)]">
          Daily Notes for {format(selectedDate, "d MMMM yyyy")}
        </h2>

        {/* Custom Save Notes button with green text & outline */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center justify-center rounded-full border border-[var(--accent-soft)] px-5 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>

      {loading && (
        <p className="mb-4 text-sm text-[var(--text-muted)]">Loading notes…</p>
      )}

      <div className="space-y-6">
        {/* Technique & Physical Insight */}
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
            Technique &amp; Physical Insight
          </h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">
            What new insight did I gain about my technique or physical
            capabilities?
          </p>
          <Textarea
            rows={3}
            value={notes.insight}
            onChange={handleChange("insight")}
            className="min-h-[80px] resize-vertical bg-transparent text-[var(--text-main)]"
            placeholder="e.g. Felt the catch better on my right arm, stayed longer in streamline off each wall…"
          />
        </div>

        {/* Nutrition & Hydration */}
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
            Nutrition &amp; Hydration
          </h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">
            How did my nutrition and hydration today affect my performance or
            recovery?
          </p>
          <Textarea
            rows={3}
            value={notes.nutrition}
            onChange={handleChange("nutrition")}
            className="min-h-[80px] resize-vertical bg-transparent text-[var(--text-main)]"
            placeholder="e.g. Breakfast sat well, forgot post-session carbs, cramped last 400…"
          />
        </div>

        {/* Something Positive About Today */}
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
            Something Positive About Today
          </h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">
            What is one thing I’m proud of or grateful for from today’s
            training or life?
          </p>
          <Textarea
            rows={3}
            value={notes.positive}
            onChange={handleChange("positive")}
            className="min-h-[80px] resize-vertical bg-transparent text-[var(--text-main)]"
            placeholder="e.g. Held my pace on last reps, coach feedback, teammate support…"
          />
        </div>
      </div>
    </section>
  );
};

export default DailyNotesCard;
