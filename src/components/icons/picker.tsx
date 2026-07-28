"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brush,
  BrushCleaning,
  Bubbles,
  Component,
  Eraser,
  Facebook,
  Footprints,
  Hand,
  Instagram,
  Mail,
  Scissors,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { icons } from "@/lib/constants";

export function IconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (e: string) => void;
}) {
  const [list, setList] = React.useState(Object.entries(icons));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Icon сонгох" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-2 py-1 mb-1 border rounded"
          onChange={(e) => {
            setList(
              Object.entries(icons).filter(([key]) =>
                key.toLowerCase().includes(e.target.value.toLowerCase())
              )
            );
          }}
        />
        {list?.map(([key, Icon]) => {
          return (
            <SelectItem
              value={key}
              key={key}
              className="flex items-center gap-2"
            >
              <Icon size={18} />
              <span>{key}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
