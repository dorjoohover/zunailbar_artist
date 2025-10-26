"use client";
import { Branch, IBooking, Booking } from "@/models";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  ScheduleEdit,
  VALUES,
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
import { getColumns } from "./columns";
import {
  ScheduleForm,
  ScheduleTable,
} from "@/components/layout/schedule.table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import DynamicHeader from "@/components/dynamicHeader";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { firstLetterUpper, mnDate, numberArray } from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";

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

export const BookingPage = ({
  data,
  branches,
}: {
  data: ListType<Booking>;
  branches: ListType<Branch>;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<BookingType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [bookings, setBookings] = useState<ListType<Booking> | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [page, setPage] = useState(0);
  const [branch, setBranch] = useState(branches.items[0]);
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
    if (lastBooking == null) setLastBooking(items[0]);
  };
  useEffect(() => {
    bookingFormatter(data);
  }, [data]);
  const clear = () => {
    form.reset(defaultValues);
  };
  const deleteBooking = async (index: number) => {
    const id = bookings!.items[index].id;
    const res = await deleteOne(Api.booking, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IBooking) => {
    setOpen(true);
    form.reset({ ...e, edit: e.id });
  };
  const columns = getColumns(edit, deleteBooking);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    await fetcher<Booking>(
      Api.booking,
      {
        page: page,
        limit,
        sort: false,
        branch_id: branch.id,
        //   name: pg.filter,
      },
      "employee"
    ).then((d) => {
      bookingFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    let lastDate = lastBooking ? lastBooking.index : 0;

    const date = lastDate;
    setAction(ACTION.RUNNING);
    const body = e as BookingType;

    const res = await create<IBooking>(Api.booking, {
      index: date,
      times: body.dates,
      branch_id: branch.id,
    });
    if (res.success) {
      refresh();
      setOpen(false);
      clear();
    }
    setAction(ACTION.DEFAULT);
  };
  const [editSchedule, setEdit] = useState<ScheduleEdit[]>([]);
  const update = async () => {
    setAction(ACTION.RUNNING);
    let date = bookings?.items[0].index;
    if (date == null) return;
    date++;
    const dates = numberArray(7).map((date) => {
      const index = editSchedule.findIndex((e) => e.day == date);
      if (index != -1) {
        const time = editSchedule[index].times.join("|");
        return time;
      } else {
        return "";
      }
    });

    const res = await create<Booking>(Api.booking, {
      date: date,
      times: dates,
      branch_id: branch.id,
    } as any);
    if (res.success) {
      refresh();
      showToast("success", "Амжилттай шинэчиллээ.");
      setOpen(false);
      clear();
      setEdit([]);
    } else {
      showToast("error", res.error ?? "");
    }
    setAction(ACTION.DEFAULT);
  };
  const onInvalid = async <T,>(e: T) => {
    const error = Object.entries(e as any)
      .map(([er, v], i) => {
        if ((v as any)?.message) {
          return (v as any)?.message;
        }
        const value = VALUES[er];
        return i == 0 ? firstLetterUpper(value) : value;
      })
      .join(", ");
    showToast("info", error);
  };
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current ? refresh() : (mounted.current = true);
    setEdit([]);
  }, [page, branch]);
  const setUpdate = (time: number, day: number) => {
    setEdit((prev0: ScheduleEdit[]) => {
      const prev = Array.isArray(prev0) ? prev0 : [];
      const newTime = time + 6;

      const idx = prev.findIndex((d) => d.day == day);

      if (idx === -1) {
        return [...prev, { day: day, times: [newTime] }];
      }

      const days = prev[idx];
      const exists = days.times.includes(newTime);
      const newTimes = exists
        ? days.times.filter((t) => t !== newTime)
        : [...days.times, newTime].sort((a, b) => a - b);

      if (newTimes.length === 0) {
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }

      const updated: ScheduleEdit = {
        ...days,
        times: newTimes,
      };
      return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
    });
  };
  return (
    <div className="">
      <DynamicHeader count={bookings?.count} />
      <div className="admin-container space-y-2">
        <div className="flex w-full items-center justify-between bg-white p-3 rounded-2xl border-light shadow-light">
          <ComboBox
            className="max-w-xs"
            items={branches.items.map((b, i) => {
              return {
                label: b.name,
                value: b.id,
              };
            })}
            props={{
              onChange: (v: string) => {
                const selected = branches.items.filter((b) => b.id == v)[0];
                setBranch(selected);
              },
              name: "",
              onBlur: () => {},
              ref: () => {},
              value: branch?.id,
            }}
          />

          <Modal
            maw="3xl"
            title="Цагийн хуваарь оруулах форм"
            name={"Цагийн хуваарь нэмэх"}
            submit={() => form.handleSubmit(onSubmit, onInvalid)()}
            open={open == true}
            setOpen={(v) => {
              setOpen(v);
              clear();
            }}
            loading={action == ACTION.RUNNING}
          >
            <FormProvider {...form}>
              <FormItems control={form.control} name={"dates"} className="">
                {(field) => {
                  const value = (field.value as string[]) ?? Array(7).fill("");
                  let date = lastBooking?.index ?? 0;
                  return (
                    <div className={cn("max-h-[60vh] overflow-y-scroll")}>
                      <ScheduleForm
                        date={date}
                        value={value}
                        setValue={(next) =>
                          form.setValue("dates", next, {
                            shouldDirty: true,
                            shouldTouch: true,
                          })
                        }
                      />
                    </div>
                  );
                }}
              </FormItems>
            </FormProvider>
          </Modal>
        </div>

        <div className="p-3 bg-white rounded-2xl space-y-4 border-light shadow-light">
          <div className="flex justify-between items-center">
            <Pagination>
              <PaginationContent className="gap-4">
                {bookings && Math.ceil(+bookings.count / limit) - 1 > page && (
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(page + 1)} />
                  </PaginationItem>
                )}
                {page > 0 && (
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(page - 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>

            {editSchedule.length > 0 && (
              <Button variant={"purple"} onClick={update}>
                Засах
              </Button>
            )}
          </div>
          {bookings?.items && bookings?.items?.length > 0 ? (
            <ScheduleTable
              d={bookings.items?.[0]?.index ?? 0}
              value={bookings.items.map((item) => item.times)}
              edit={editSchedule}
              setEdit={setUpdate}
            />
          ) : null}
        </div>
        {/* <DataTable
        columns={columns}
        count={bookings?.count}
        data={bookings?.items ?? []}
        refresh={refresh}
        loading={action == ACTION.RUNNING}
      /> */}
      </div>
    </div>
  );
};
