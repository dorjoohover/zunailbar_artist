import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/functions";
import { Clock } from "lucide-react";
import { useState } from "react";
import { ControllerRenderProps, FieldValues } from "react-hook-form";

export const SelectTime = <T extends FieldValues>({
  label,
  props,
}: {
  label?: string;
  props: ControllerRenderProps<T>;
}) => {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const [display, setDisplay] = useState(String(formatDate(props.value) ?? ""));
  return (
    <div className="relative space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative w-full">
        {/* value={formatDate(`${props.value ?? ""}`)} */}
        <Select
          {...props}
          value={display}
          onValueChange={(e) => {
            const raw = e.replace(/[^\d]/g, "");
            props.onChange(raw);
            setDisplay(raw);
          }}
        >
          <SelectTrigger className="w-[100px]">
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent className="h-[200px]">
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour.toString()}>
                {hour.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
