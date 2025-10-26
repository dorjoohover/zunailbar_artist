import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  formatTime,
  getDayNameWithDate,
  mnDate,
  numberArray,
  sameYMD,
  stripTime,
  totalHours,
} from "@/lib/functions";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Dispatch, SetStateAction, useState } from "react";
import { ScheduleEdit } from "@/lib/constants";
const days = numberArray(7);
const today = new Date().getDay();
export const ScheduleTable = ({
  edit,
  d,
  value,
  setEdit,
  artist = false,
}: {
  edit?: ScheduleEdit[];
  setEdit?: (time: number, day: number) => void;
  d: number | Date;
  artist?: boolean;
  value: string[];
}) => {
  const date = d;
  const today = mnDate();
  const hour = today.getHours();
  today.setHours(0, 0, 0, 0);
  const checkDate = mnDate(date as Date);
  checkDate.setHours(0, 0, 0, 0);

  // Ашиглах нь

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          {days.map((day) => {
            const d = getDayNameWithDate(day, date);
            return (
              <TableHead className="w-[60px] " key={day}>
                <div className="flex items-center justify-center flex-col">
                  {/* {!artist && <div>{d.date}</div>} */}
                  <div>{d.day}</div>
                </div>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {numberArray(totalHours).map((time) => {
          const hour = time + 6; // 8..22
          return (
            <TableRow key={time}>
              {days.map((day) => {
                const idx = day - 1;
                const times = (value[idx] ?? "").split("|").filter(Boolean);

                const keyStr = String(hour);
                const includes = times.includes(keyStr);
                const selected = edit?.findIndex(
                  (e) => e.day == day && e.times.includes(time + 6)
                );
                return (
                  <TableCell key={day}>
                    <Button
                      type="button"
                      variant={"ghost"}
                      className={cn(
                        includes && selected != -1
                          ? "bg-red-500 text-white hover:bg-teal-500/80 hover:text-white"
                          : includes
                          ? "bg-teal-500 text-white hover:bg-teal-500/80 hover:text-white"
                          : selected != -1
                          ? "bg-teal-300 text-white hover:bg-teal-300/80 hover:text-white -translate-y-1"
                          : "bg-gray-100 text-black hover:bg-gray-200",
                        "w-full"
                      )}
                      onClick={() => {
                        if (setEdit) {
                          setEdit(time, day);
                        }
                      }}
                    >
                      {formatTime(hour)}
                    </Button>
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const ScheduleForm = ({
  date,
  value,
  setValue,
  artist = false,
}: {
  date: number | Date;
  artist?: boolean;
  value: string[];
  setValue: (value: string[]) => void;
}) => {
  return (
    <Table className="table-fixed ">
      <TableHeader>
        <TableRow>
          {days.map((day) => {
            const d = getDayNameWithDate(day, date);
            return (
              <TableHead className="w-[60px] " key={day}>
                <div className="flex items-center justify-center flex-col">
                  <div>{d.day}</div>
                </div>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>

      <TableBody className="h-72 overflow-hidden">
        {numberArray(totalHours).map((time) => {
          const hour = time + 6; // 8..22
          return (
            <TableRow key={time}>
              {days.map((day) => {
                const idx = day - 1; // 1 = Даваа -> 0 индекс
                const times = (value[idx] ?? "").split("|").filter(Boolean);

                const keyStr = String(hour);
                const includes = times.includes(keyStr);

                return (
                  <TableCell key={day}>
                    <Button
                      type="button"
                      variant={"ghost"}
                      className={cn(
                        includes
                          ? "bg-teal-500 text-white hover:bg-teal-500/80 hover:text-white"
                          : "bg-gray-100 text-black hover:bg-gray-200",
                        "w-full"
                      )}
                      onClick={() => {
                        let nextTimes = includes
                          ? times.filter((t) => t !== keyStr)
                          : [...times, keyStr];

                        nextTimes = Array.from(new Set(nextTimes)).sort(
                          (a, b) => Number(a) - Number(b)
                        );

                        const next = [...value];
                        next[idx] = nextTimes.join("|");
                        setValue(next);
                      }}
                    >
                      {formatTime(hour)}
                    </Button>
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
