"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type MoodValue = 1 | 2 | 3 | 4 | 5;

interface MoodSelectorProps {
  value: MoodValue | null;
  onChange: (mood: MoodValue | null) => void;
  className?: string;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ value, onChange, className }) => {
  const [hoveredMood, setHoveredMood] = React.useState<MoodValue | null>(null);

  const handleClick = (mood: MoodValue) => {
    onChange(value === mood ? null : mood); // Toggle selection
  };

  const displayMood = hoveredMood !== null ? hoveredMood : value;

  return (
    <div className={cn("flex space-x-1", className)}>
      {[1, 2, 3, 4, 5].map((moodOption) => (
        <Star
          key={moodOption}
          className={cn(
            "h-8 w-8 cursor-pointer transition-colors duration-150",
            moodOption <= (displayMood || 0)
              ? "text-[var(--accent)] fill-[var(--accent)]"
              : "text-gray-500 hover:text-[var(--accent-soft)]"
          )}
          onClick={() => handleClick(moodOption as MoodValue)}
          onMouseEnter={() => setHoveredMood(moodOption as MoodValue)}
          onMouseLeave={() => setHoveredMood(null)}
        />
      ))}
    </div>
  );
};