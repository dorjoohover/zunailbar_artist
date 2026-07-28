import { X } from "lucide-react";

interface AddTimeModalProps {
  availableTimes: string[];
  onSelectTime: (time: string) => void;
  onClose: () => void;
}

export function AddTimeModal({
  availableTimes,
  onSelectTime,
  onClose,
}: AddTimeModalProps) {
  const handleSelect = (time: string) => {
    onSelectTime(time);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-800">Цаг сонгох</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Time list */}
        <div className="grid grid-cols-3 gap-2">
          {availableTimes.map((time) => (
            <button
              key={time}
              onClick={() => handleSelect(time)}
              className="px-4 py-3 bg-slate-50 hover:bg-teal-500 hover:text-white text-slate-700 rounded-lg transition-all hover:shadow-md border border-slate-200 hover:border-teal-500"
            >
              {time}
            </button>
          ))}
        </div>

        {availableTimes.length === 0 && (
          <div className="text-slate-500 text-center py-8">
            Бүх цаг нэмэгдсэн байна
          </div>
        )}
      </div>
    </div>
  );
}
