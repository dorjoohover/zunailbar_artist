import { useEffect, useMemo, useState } from "react";
import { Copy, RotateCcw, Edit3, Check } from "lucide-react";
import { ScheduleDayData } from "@/lib/constants";
import { TimeSlotPill } from "./schedule.table.time.slot";
import { LoaderMini } from "../loader";
import { AppAlertDialog } from "@/components/AlertDialog";

interface DayScheduleColumnProps {
  dayName: string;
  dayIndex: number;
  loading: boolean;
  day: ScheduleDayData;
  allowFinishTimeEdit?: boolean;
  onUpdateDay: (day: ScheduleDayData, action: number) => void;
  onCopyPrevious?: () => void;
}

export function DayScheduleColumn({
  dayName,
  loading,
  day,
  allowFinishTimeEdit = true,
  onUpdateDay,
  onCopyPrevious,
}: DayScheduleColumnProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [send, setSend] = useState(false);
  const times = day.times ?? [];
  const finishTime = day.finish_time ?? null;

  const allAvailableTimes = Array.from({ length: 32 }, (_, i) => {
    const index = i * 0.5;
    const hour = index + 7;
    return `${Math.floor(hour).toString().padStart(2, "0")}:${
      hour % 1 == 0 ? "00" : "30"
    }`;
  });
  const timeToDecimal = (value: string) => {
    const [hours, minutes = "0"] = value.split(":");
    return Number(hours) + Number(minutes) / 60;
  };

  // 24 цагаас давсан утгыг дараагийн өдрийн цаг руу шилжүүлж (жишээ 25 -> 01:00)
  // native <input type="time"> зөвхөн 00:00-23:59 хүлээн авдаг тул хүчинтэй
  // утга үргэлж буцаана.
  const decimalToTime = (value: number) => {
    const wrapped = ((value % 24) + 24) % 24;
    const hours = Math.floor(wrapped);
    const minutes = wrapped % 1 === 0 ? "00" : "30";
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  };

  const FINISH_GAP = 0.5;
  // Дуусах цаг сүүлийн авах цагаас бага, мөн эрт өглөө (шөнө дунд давсан,
  // жишээ 00:30) орсон бол хүчинтэй гэж үзнэ (backend-тэй ижил дүрэм).
  const isValidFinishTime = (nextFinishTime: string, lastStart: number) => {
    let finish = timeToDecimal(nextFinishTime);
    if (finish <= lastStart && finish < 7) finish += 24;
    return finish > lastStart;
  };

  const normalizeDay = (nextTimes: string[], nextFinishTime?: string | null) => {
    if (nextTimes.length === 0) {
      return { times: [], finish_time: null };
    }

    const sortedTimes = [...nextTimes].sort();
    const lastStart = Math.max(...sortedTimes.map(timeToDecimal));
    const minimumFinish = decimalToTime(lastStart + FINISH_GAP);
    const resolvedFinish = allowFinishTimeEdit
      ? nextFinishTime && isValidFinishTime(nextFinishTime, lastStart)
        ? nextFinishTime
        : minimumFinish
      : nextFinishTime ?? null;

    return {
      times: sortedTimes,
      finish_time: resolvedFinish,
    };
  };

  const minimumFinishTime = useMemo(() => {
    if (times.length === 0) return "";
    const lastStart = Math.max(...times.map(timeToDecimal));
    return decimalToTime(lastStart + FINISH_GAP);
  }, [times]);

  // Сүүлийн авах цаг орой (жишээ 18:00-с хойш) бол шөнө дунджийг давж
  // (00:00–06:59) тарах цаг сонгох боломжтой болгоно. Native time input дээр
  // min > max үед хугацааны хязгаар шөнө дундыг тойрч "wrap" хийдэг тул
  // энэ хосолсон утга нь 23:00–06:59 хооронд сонгогдох боломжийг олгоно.
  const maxFinishTime = useMemo(() => {
    if (times.length === 0) return "23:00";
    const lastStart = Math.max(...times.map(timeToDecimal));
    return lastStart >= 18 ? "06:59" : "23:00";
  }, [times]);

  const toggleTime = (time: string) => {
    if (times.includes(time)) {
      onUpdateDay(normalizeDay(times.filter((t) => t !== time), finishTime), 1);
    } else {
      onUpdateDay(normalizeDay([...times, time], finishTime), 1);
    }
  };

  const resetDay = () => {
    onUpdateDay({ times: [], finish_time: null }, 4);
  };

  useEffect(() => {
    if (send) {
      onUpdateDay(normalizeDay(times, finishTime), 2);
      setSend(false);
    }
  }, [send, times, finishTime]);

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-slate-200">
        <div className="text-slate-800 mb-1 text-sm">{dayName}</div>
        <div className="text-teal-600 text-xs mt-1">
          {times.length} цаг идэвхтэй
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 space-y-2 mb-4 min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoaderMini />
          </div>
        ) : isEditMode ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <label className="mb-2 block text-[11px] text-slate-500">
                Дуусах цаг
              </label>
              {allowFinishTimeEdit ? (
                <input
                  type="time"
                  step={1800}
                  min={minimumFinishTime || undefined}
                  max={maxFinishTime}
                  value={finishTime ?? ""}
                  onChange={(event) =>
                    onUpdateDay(
                      normalizeDay(times, event.target.value || null),
                      1,
                    )
                  }
                  disabled={times.length === 0}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
                />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {finishTime ?? "Admin оноогоогүй"}
                </div>
              )}
              <p className="mt-2 text-[11px] leading-4 text-slate-500">
                {allowFinishTimeEdit
                  ? `Энэ цаг нь үйлчилгээ хамгийн оройдоо хэдэн цагт дуусахыг заана. Хамгийн багадаа ${minimumFinishTime || "--"} байна.`
                  : "Дуусах цагийг зөвхөн admin талаас онооно."}
              </p>
            </div>

            {(() => {
              const outOfRangeTimes = times.filter(
                (time) => !allAvailableTimes.includes(time),
              );
              if (outOfRangeTimes.length === 0) return null;
              return (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 space-y-1.5">
                  <p className="text-[11px] text-amber-700">
                    Ажлын цагийн хязгаараас (07:00–22:30) гадуурх хуучин цаг.
                    Хуваарьт ороогүй тул устгахыг зөвлөж байна.
                  </p>
                  {outOfRangeTimes.map((time) => (
                    <button
                      key={time}
                      onClick={() => toggleTime(time)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 transition-all"
                    >
                      <span>{time}</span>
                      <span className="text-[11px]">Устгах</span>
                    </button>
                  ))}
                </div>
              );
            })()}

            <div className="space-y-1.5">
              {allAvailableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => toggleTime(time)}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
                    times.includes(time)
                      ? "bg-teal-500 hover:bg-teal-600 text-white shadow-sm"
                      : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {times.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-8">
                Цаг оруулаагүй байна
              </div>
            ) : (
              times.map((time) => (
                <TimeSlotPill
                  key={time}
                  time={time}
                  onRemove={() => toggleTime(time)}
                />
              ))
            )}
            {times.length > 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                <div>
                  Сүүлийн авах цаг:{" "}
                  {decimalToTime(Math.max(...times.map(timeToDecimal)))}
                </div>
                <div>
                  Дуусах цаг:{" "}
                  {finishTime ?? (allowFinishTimeEdit ? "-" : "Admin оноогоогүй")}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-200">
        <button
          onClick={() => {
            if (isEditMode) setSend(true);
            setIsEditMode(!isEditMode);
          }}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
            isEditMode
              ? "bg-teal-500 hover:bg-teal-600 text-white"
              : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          {isEditMode ? <Check size={14} /> : <Edit3 size={14} />}
          <span>{isEditMode ? "Дуусгах" : "Засах"}</span>
        </button>

        {!isEditMode && (
          <>
            {onCopyPrevious && (
              <button
                onClick={onCopyPrevious}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] whitespace-nowrap transition-colors"
                title="Өмнөх өдрийн хуваарь хуулах"
              >
                <Copy size={12} />
                <span>Өмнөхийг хуулах</span>
              </button>
            )}

            {times.length > 0 && (
              <AppAlertDialog
                title="Энэ өдрийн хуваарийг цэвэрлэх үү?"
                description="Сонгосон цагууд болон дуусах цаг хоёулаа устна."
                confirmText="Цэвэрлэх"
                trigger={
                  <button className="w-full flex items-center text-sm justify-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-xs transition-colors">
                    <RotateCcw size={12} />
                    <span>Цэвэрлэх</span>
                  </button>
                }
                onConfirm={resetDay}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
