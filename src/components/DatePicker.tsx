"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

export function DatePicker({ selectedDate, onDateChange, className }: DatePickerProps) {
  // FIX 1: shadcn Calendar can emit undefined (toggle-off). Ignore it.
  const handleSelect = (date?: Date) => {
    if (!date || isNaN(date.getTime())) return; // keep current date
    onDateChange(date);
  };

  const isValidSelected =
    selectedDate instanceof Date && !isNaN(selectedDate.getTime());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal bg-input text-foreground border-border",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {/* FIX 2: guard format() so Invalid Date can't crash */}
          {isValidSelected ? format(selectedDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 bg-white text-gray-900 border-border"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          // FIX 3: use guarded handler instead of raw onDateChange
          onSelect={handleSelect}
          initialFocus
          className="calendar-red-dates"
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear()}
        />
      </PopoverContent>
    </Popover>
  );
}
