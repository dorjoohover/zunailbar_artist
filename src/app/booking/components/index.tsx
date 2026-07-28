"use client";
import { Branch, IBooking, Booking } from "@/models";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  ScheduleData,
} from "@/lib/constants";
import z from "zod";
import { Api } from "@/utils/api";
import { create, deleteOne, updateOne } from "@/app/(api)";
import { fetcher } from "@/hooks/fetcher";
import { AdminScheduleManager } from "@/components/layout/schedule.table";
import DynamicHeader from "@/components/dynamicHeader";
import { formatTime, toTimeString } from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";
import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const hourLine = z.string();
const limit = 7;
const formSchema = z.object({
  dates: z.array(hourLine).length(7), // 7 хоног
  edit: z.string().nullable().optional(),
});
const defaultValues: BookingType = {
  dates: ["", "", "", "", "", "", ""],
  edit: undefined,
};
type BookingType = z.infer<typeof formSchema>;

const toScheduleData = (items: Booking[] = []): ScheduleData =>
  items.reduce<ScheduleData>((acc, item) => {
    acc[item.index] = {
      times: item.times?.split("|") ?? [],
      finish_time: item.finish_time ? formatTime(String(item.finish_time)) : null,
    };
    return acc;
  }, {});

export const BookingPage = ({
  data,
  branches,
}: {
  data: ListType<Booking>;
  branches: ListType<Branch>;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [selectedBranch, setSelectedBranch] = useState(
    branches.items?.[0] ?? null
  );

  const [bookings, setBookings] = useState<ListType<Booking> | null>(null);
  const branchMap = useMemo(
    () => new Map(branches.items.map((b) => [b.id, b])),
    [branches.items]
  );

  const bookingFormatter = (data: ListType<Booking>) => {
    const items: Booking[] = data.items.map((item) => {
      const branch = branchMap.get(item.branch_id);

      return {
        ...item,
        branch_name: branch?.name ?? "",
      };
    });

    setBookings({ items, count: data.count });
  };
  useEffect(() => {
    bookingFormatter(data);
  }, [data]);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    await fetcher<Booking>(
      Api.booking,
      {
        page: 0,
        limit,
        sort: false,
        branch_id: selectedBranch.id,
        //   name: pg.filter,
      },
      "employee"
    ).then((d) => {
      bookingFormatter(d);
      console.log(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const add = async (index: number, day: ScheduleData[number], isAdd: boolean) => {
    setAction(ACTION.RUNNING);
    const payload = {
      index: index,
      times: day.times.length == 0 ? undefined : day.times.map((time) => time),
      branch_id: selectedBranch.id,
    };
    console.log(payload);

    const id = bookings?.items?.filter((b) => b.index == index)?.[0]?.id;
    const res = isAdd
      ? await create<IBooking>(Api.booking, payload)
      : await updateOne<IBooking>(Api.booking, id!, payload);
    if (res.success) {
      refresh();
      showToast("success", "Амжилттай шинэчиллээ.");
    } else {
      showToast("error", res.error ?? "");
    }
    setAction(ACTION.DEFAULT);
  };

  const remove = async (index: number) => {
    setAction(ACTION.RUNNING);

    const res = await deleteOne(
      Api.booking,
      selectedBranch.id + `/${index}`,
      "index"
    );
    if (res.success) {
      refresh();
      showToast("success", "Амжилттай шинэчиллээ.");
    } else {
      showToast("error", res.error ?? "");
    }
    setAction(ACTION.DEFAULT);
  };

  const mounted = useRef(false);
  useEffect(() => {
    mounted.current ? refresh() : (mounted.current = true);
  }, [selectedBranch]);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  useEffect(() => {
    setScheduleData(toScheduleData(bookings?.items ?? []));
  }, [bookings?.items]);
  const updateBranchSchedule = async (
    dayIndex: number,
    day: ScheduleData[number],
    action: number
  ) => {
    if (action == 4) await remove(dayIndex);
    if (action == 0)
      await add(dayIndex, day, !(scheduleData[dayIndex]?.times?.length ?? 0));
    if (action == 2)
      await add(
        dayIndex,
        day,
        !(toScheduleData(bookings?.items ?? [])[dayIndex]?.times?.length ?? 0)
      );

    setScheduleData((prev) => ({
      ...prev,
      [dayIndex]: day,
    }));
  };
  return (
    <div className="">
      <DynamicHeader count={bookings?.count} />
      <div className="admin-container space-y-2">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:justify-between">
            <div>
              {" "}
              <label className="text-slate-700 text-sm mb-3 block">
                Салбар сонгох
              </label>
              <div className="relative">
                <Select
                  value={selectedBranch?.id}
                  onValueChange={(e) => {
                    const branch = branches.items.find((b) => b.id === e);
                    if (branch) setSelectedBranch(branch);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Салбар сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {branches?.items?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-slate-500 text-sm">
              <MapPin size={16} />
              <span>
                {selectedBranch.name} {selectedBranch.address && "-"}{" "}
                {selectedBranch.address}
              </span>
            </div>

            {/* <button
              onClick={() => {}}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              <Copy size={18} />
              <span>Бүх салбарт хэрэглэх</span>
            </button> */}
          </div>
        </div>

        <div>
          <AdminScheduleManager
            schedule={scheduleData}
            allowFinishTimeEdit={false}
            onUpdateSchedule={(dayIndex, day, action) =>
              updateBranchSchedule(dayIndex, day, action)
            }
            loading={action != ACTION.DEFAULT}
          />
        </div>
      </div>
    </div>
  );
};
