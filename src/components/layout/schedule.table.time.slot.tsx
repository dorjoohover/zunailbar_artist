import { X } from "lucide-react";

interface TimeSlotPillProps {
  time: string;
  onRemove: () => void;
}

export function TimeSlotPill({ time, onRemove }: TimeSlotPillProps) {
  return (
    <div className="group flex items-center justify-between px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-sm transition-all hover:shadow-md">
      <span className="text-sm">{time}</span>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal-700 rounded p-0.5"
        title="Устгах"
      >
        <X size={14} />
      </button>
    </div>
  );
}
