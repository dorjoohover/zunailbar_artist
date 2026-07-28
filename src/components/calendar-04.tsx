"use client";

import * as React from "react";
import { type DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";

export default function Calendar04() {
  const today = new Date();
  const twoDaysLater = new Date();
  twoDaysLater.setDate(today.getDate() + 2);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: today,
    to: today,
  });

  return <Calendar mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} className="rounded-lg border w-full bg-white" />;
}
