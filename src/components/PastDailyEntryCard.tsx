"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react"; // Importing the Star icon

interface DailyMoodCardProps extends React.ComponentProps<typeof Card> {
  date: string;
  mood: number;
  notes: string;
  onEdit: () => void;
}

const DailyMoodCard: React.FC<DailyMoodCardProps> = ({
  date,
  mood,
  notes,
  onEdit,
  ...props
}) => {
  // Helper function to render mood as stars
  const renderMoodStars = (currentMood: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-6 w-6 ${
            i <= currentMood ? 'text-[var(--accent)] fill-[var(--accent)]' : 'text-gray-500'
          }`}
        />
      );
    }
    return <div className="flex space-x-1">{stars}</div>;
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{date}</span>
          <button onClick={onEdit} className="text-sm text-[var(--accent)] hover:underline">
            Edit
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-center py-4">
          {renderMoodStars(mood)}
        </div>
        {notes && (
          <p className="text-sm text-gray-400 italic">"{notes}"</p>
        )}
        {!notes && mood === 0 && (
          <p className="text-sm text-gray-500 italic">No entry for this day.</p>
        )}
        {mood > 0 && !notes && (
          <p className="text-sm text-gray-500 italic">No notes for this mood.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyMoodCard;