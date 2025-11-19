"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type NoteType = "insight" | "nutrition" | "positive";

const NOTE_CONFIG: Record<
  NoteType,
  { label: string; question: string; placeholder: string }
> = {
  insight: {
    label: "Technique & Physical Insight",
    question:
      "What new insight did I gain about my technique or physical capabilities?",
    placeholder: "Jot down your thoughts...",
  },
  nutrition: {
    label: "Nutrition & Hydration",
    question:
      "How did my nutrition and hydration today affect my performance or recovery?",
    placeholder: "What did I eat/drink before, during, and after training?",
  },
  positive: {
    label: "Something Positive About Today",
    question:
      "What is one positive thing from today that I’m proud of or grateful for?",
    placeholder: "Big or small, what went well?",
  },
};

type DailyNotesCardProps = {
  selectedDate: Date;
  onSaved?: () => void;
  className?: string;
};

const DailyNotesCard: React.FC<DailyNotesCardProps> = ({
  selectedDate,
  onSaved,
  className,
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Record<NoteType, string>>({
    insight: "",
    nutrition: "",
    positive: "",
  });
  const [loading, setLoading] = useState(false);

  const entryDateStr = format(selectedDate, "yyyy-MM-dd");

  // Load all notes for this date
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadNotes = async () => {
      setLoading(true);
      setNotes({
        insight: "",
        nutrition: "",
        positive: "",
      });

      const { data, error } = await supabase
        .from("daily_notes")
        .select("note_type, content")
        .eq("user_id", user.id)
        .eq("entry_date", entryDateStr)
        .in("note_type", ["insight", "nutrition", "positive"]);

      if (cancelled) return;

      if (error) {
        console.error("Error loading notes", error);
        setLoading(false);
        return;
      }

        const next: Record<NoteType, string> = {
          insight: "",
          nutrition: "",
          positive: "",
        };

        (data ?? []).forEach((row: { note_type: NoteType; content: string | null }) => {
          const t = row.note_type;
          if (t in next) {
            next[t] = row.content ?? "";
          }
        });

      setNotes(next);
      setLoading(false);
    };

    loadNotes();

    return () => {
      cancelled = true;
    };
  }, [user, entryDateStr]);

  const handleChange = (type: NoteType, value: string) => {
    setNotes((prev) => ({ ...prev, [type]: value }));
  };

  const saveOne = async (type: NoteType) => {
    if (!user) return;

    const content = notes[type] ?? "";

    const { error } = await supabase.from("daily_notes").upsert(
      {
        user_id: user.id,
        entry_date: entryDateStr,
        note_type: type,
        content,
      },
      { onConflict: "user_id,entry_date,note_type" },
    );

    if (error) {
      console.error("Error saving note", type, error);
    } else if (onSaved) {
      onSaved();
    }
  };

  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className={cn("bg-card border-card-border shadow-md", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-accent">
          Daily Notes for {formattedDate}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {(Object.keys(NOTE_CONFIG) as NoteType[]).map((type) => {
          const cfg = NOTE_CONFIG[type];
          return (
            <div key={type} className="space-y-2">
              <p className="text-base font-semibold text-foreground">
                {cfg.label}
              </p>
              <p className="text-sm text-muted-foreground">{cfg.question}</p>
              <textarea
                value={notes[type]}
                onChange={(e) => handleChange(type, e.target.value)}
                onBlur={() => saveOne(type)}
                placeholder={cfg.placeholder}
                className="w-full min-h-[110px] rounded-lg border border-border bg-input p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent-soft"
                disabled={loading}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DailyNotesCard;
