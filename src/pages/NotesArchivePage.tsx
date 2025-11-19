"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type NoteRow = {
  id: string;
  entry_date: string; // YYYY-MM-DD
  note_type: string;
  content: string;
};

const NOTE_LABELS: Record<string, string> = {
  insight: "Technique & Physical Insight",
  nutrition: "Nutrition & Hydration",
  positive: "Something Positive About Today",
};

const NotesArchivePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["daily-notes-archive", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NoteRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_notes")
        .select("id, entry_date, note_type, content")
        .eq("user_id", user.id)
        .in("note_type", ["insight", "nutrition", "positive"])
        .order("entry_date", { ascending: false })
        .order("note_type", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Group by date
  const groupedByDate = React.useMemo(() => {
    const grouped: Record<string, NoteRow[]> = {};
    (data ?? []).forEach((row) => {
      if (!grouped[row.entry_date]) grouped[row.entry_date] = [];
      grouped[row.entry_date].push(row);
    });
    return grouped;
  }, [data]);

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-main">
            Notes Archive
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        {isLoading && <p className="text-muted-foreground">Loading notes…</p>}
        {error && (
          <p className="text-destructive">
            Error loading notes. Check console for details.
          </p>
        )}

        {!isLoading && !error && sortedDates.length === 0 && (
          <p className="text-muted-foreground">
            No notes yet. Start writing in your Daily Entry and they’ll appear
            here.
          </p>
        )}

        <div className="space-y-6">
          {sortedDates.map((date) => {
            const rows = groupedByDate[date];
            const prettyDate = new Date(date).toLocaleDateString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={date}
                className="rounded-xl border border-border bg-card/70 px-4 py-3"
              >
                <div className="mb-3 text-sm font-semibold text-accent">
                  {prettyDate}
                </div>

                <div className="space-y-3">
                  {rows.map((row) => (
                    <div key={row.id} className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {NOTE_LABELS[row.note_type] ?? row.note_type}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {row.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotesArchivePage;
