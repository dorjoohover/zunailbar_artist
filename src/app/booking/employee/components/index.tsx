"use client";
import { ISchedule, User, Schedule } from "@/models";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  ScheduleEdit,
  VALUES,
  ScheduleData,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { fetcher } from "@/hooks/fetcher";
import {
  firstLetterUpper,
  formatTime,
  mobileFormatter,
  numberArray,
  toTimeString,
  usernameFormatter,
} from "@/lib/functions";

import DynamicHeader from "@/components/dynamicHeader";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { showToast } from "@/shared/components/showToast";
import { getColumns } from "./columns";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/data-table";
import { AdminScheduleManager } from "@/components/layout/schedule.table";
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
  user_id: z.string().refine((data) => data.length > 0, {
    message: "Артист сонгоно уу",
  }),
  dates: z.array(hourLine).length(7), // 7 хоног
  edit: z.string().nullable().optional(),
});
const defaultValues: ScheduleType = {
  user_id: "",
  dates: ["", "", "", "", "", "", ""],
  edit: undefined,
};
type ScheduleType = z.infer<typeof formSchema>;

const toScheduleData = (items: Schedule[] = []): ScheduleData =>
  items.reduce<ScheduleData>((acc, item) => {
    acc[item.index] = {
      times: item.times?.split("|") ?? [],
      finish_time: item.finish_time ? formatTime(String(item.finish_time)) : null,
    };
    return acc;
  }, {});

export const SchedulePage = ({
  data,
  users,
}: {
  data: ListType<Schedule>;
  users: ListType<User>;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [schedules, setSchedules] = useState<ListType<Schedule> | null>(null);
  const [selectedUser, setSelectedUser] = useState(users.items?.[0] ?? null);
  const userMap = useMemo(
    () => new Map(users.items.map((b) => [b.id, b])),
    [users.items]
  );

  const ScheduleFormatter = (data: ListType<Schedule>) => {
    const items: Schedule[] = data.items.map((item) => {
      const user = userMap.get(item.user_id);

      return {
        ...item,
        user_name: user ? usernameFormatter(user) : "",
      };
    });
    setSchedules({ items, count: data.count });
  };
  useEffect(() => {
    ScheduleFormatter(data);
  }, [data]);

  const deleteSchedule = async (index: number) => {
    const id = schedules!.items[index].id;
    const res = await deleteOne(Api.schedule, id!);
    refresh();
    return res.success;
  };

  const edit = (schedule: Schedule) => {};

  const columns = getColumns(edit, deleteSchedule);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { sort } = pg;
    await fetcher<Schedule>(
      Api.schedule,
      {
        page: 0,
        limit,
        sort,
        user_id: selectedUser.id,
        //   name: pg.filter,
      },
      "employee"
    ).then((d) => {
      ScheduleFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };

  useEffect(() => {
    setScheduleData(toScheduleData(schedules?.items ?? []));
  }, [schedules?.items]);
  const add = async (index: number, day: ScheduleData[number], isAdd: boolean) => {
    setAction(ACTION.RUNNING);
    const payload = {
      index: index,
      times: day.times.length == 0 ? null : day.times,
      user_id: selectedUser.id,
    };

    const id = schedules?.items?.filter((b) => b.index == index)?.[0]?.id;
    const res = isAdd
      ? await create<ISchedule>(Api.schedule, payload)
      : await updateOne<ISchedule>(Api.schedule, id!, payload);
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
  }, [selectedUser]);
  const [isList, setList] = useState(true);
  const remove = async (index: number) => {
    setAction(ACTION.RUNNING);

    const res = await deleteOne(
      Api.schedule,
      selectedUser.id + `/${index}`,
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
  const updateSchedule = async (
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
        !(toScheduleData(schedules?.items ?? [])[dayIndex]?.times?.length ?? 0)
      );
    setScheduleData((prev) => ({
      ...prev,
      [dayIndex]: day,
    }));
  };
  return (
    <div className="">
      <DynamicHeader />

      <div className="admin-container space-y-2">
        <div className="flex w-full items-center justify-between bg-white p-3 rounded-2xl border-light shadow-light">
          <div>
            {" "}
            <label className="text-slate-700 text-sm mb-3 block">
              Артист сонгох
            </label>
            <div className="relative">
              <Select
                value={selectedUser?.id}
                onValueChange={(e) => {
                  const user = users?.items?.find((b) => b.id === e);
                  if (user) setSelectedUser(user);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Артист сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {users?.items?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {usernameFormatter(user)} -{" "}
                        {mobileFormatter(user.mobile ?? "")}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-2 max-w-lg w-full">
            <Switch
              checked={isList}
              onCheckedChange={(val) => setList(val)}
              id="compare-switch"
            />
            <label
              htmlFor="compare-switch"
              className="text-sm text-muted-foreground"
            >
              Жагсаалтаар харах
            </label>
          </div>
        </div>
        {isList ? (
          <DataTable
            columns={columns}
            count={schedules?.count}
            data={schedules?.items ?? []}
            refresh={refresh}
            loading={action == ACTION.RUNNING}
            search={false}
          />
        ) : (
          <div>
            <AdminScheduleManager
              schedule={scheduleData}
              allowFinishTimeEdit={false}
              onUpdateSchedule={(dayIndex, day, action) =>
                updateSchedule(dayIndex, day, action)
              }
              loading={action != ACTION.DEFAULT}
            />
          </div>
        )}
      </div>
    </div>
  );
};
