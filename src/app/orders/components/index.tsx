"use client";
import { Branch, IOrder, Order, Schedule, Service, User } from "@/models";
import { useEffect, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  ListDefault,
  SearchType,
} from "@/lib/constants";
import z from "zod";
import { Api } from "@/utils/api";
import { create, deleteOne, excel, find, search, updateOne } from "@/app/(api)";
import { fetcher } from "@/hooks/fetcher";
import SchedulerViewFilteration from "@/components/schedule/_components/view/schedular-view-filteration";
import { SchedulerProvider } from "@/providers/schedular-provider";
import DynamicHeader from "@/components/dynamicHeader";
import { coerceDate, mnDate, toTimeString } from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";
import { OrderStatus } from "@/lib/enum";
import { getColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AppAlertDialog } from "@/components/AlertDialog";
import { DateRange } from "react-day-picker";
import { Slot } from "@/models/slot.model";

const getTodayRange = (): DateRange => {
  const today = mnDate(new Date());
  return {
    from: today,
    to: today,
  };
};

export type FilterType = {
  status?: OrderStatus;
  artist?: string;
  date?: DateRange;
  branch?: string;
  list?: boolean;
  mobile?: string;
};

export const OrderPage = ({
  branches,
  users,
  customers,
  services,
  initialFilter,
  titleOverride,
  showConfirmButton = true,
}: {
  branches: SearchType<Branch>[];
  services: ListType<Service>;
  users: SearchType<User>[];
  customers: SearchType<User>[];
  initialFilter?: FilterType;
  titleOverride?: string;
  showConfirmButton?: boolean;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [orders, setOrders] = useState<ListType<Order>>(ListDefault);
  const [filter, setFilter] = useState<FilterType>({
    date: getTodayRange(),
    ...initialFilter,
  });
  const [artists, setArtists] = useState<SearchType<User>[]>(users);
  const changeFilter = (
    key: string,
    value: number | string | undefined | boolean | DateRange,
  ) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };
  const rerunCurrentDateRange = () => {
    const from = mnDate(filter?.date?.from ?? new Date());
    const to = mnDate(filter?.date?.to ?? filter?.date?.from ?? new Date());

    changeFilter("date", {
      from,
      to,
    } as DateRange);
  };
  const isFirstRender = useRef(true);
  const getAristSchedules = async () => {
    const date = mnDate(filter?.date?.from);
    let index = date.getDay() - 1;
    index = index == -1 ? 6 : index;
    const schedule = await search<Schedule>(Api.schedule, { index });
    const scheduleItems = schedule.data ?? [];
    const scheduledUserIds = new Set(
      scheduleItems.map((s) => s.user_id).filter(Boolean),
    );

    setArtists(
      users
        .filter((u) => scheduledUserIds.has(u.id))
        .map((u) => ({
          ...u,
          item: scheduleItems.find((a) => a.user_id == u.id)?.value,
        })),
    );
  };
  useEffect(() => {
    refresh();
    getAristSchedules();
  }, [filter?.date, filter?.artist, filter?.branch, filter?.status]);

  const orderFormatter = (data: ListType<Order>) => {
    const items: Order[] = data.items.map((item) => {
      return {
        ...item,
      };
    });

    setOrders({ items, count: data.count });
  };
  useEffect(() => {
    const interval = setInterval(
      () => {
        void refresh();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);
  const deleteOrder = async (id: string) => {
    const res = await deleteOne(Api.order, id);
    refresh();
    return res.success;
  };
  const dateFormat = (d: Date | string | number) => {
    const value = coerceDate(d);
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const selectedStart = filter?.date?.from ?? mnDate(new Date());
    const selectedEnd =
      filter?.date?.to ?? filter?.date?.from ?? mnDate(new Date());
    const d = mnDate(selectedStart);
    const end_date = mnDate(selectedEnd);
    const date = dateFormat(d);
    await fetcher<Order>(Api.order, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      date: date,
      end_date: filter?.list ? dateFormat(end_date) : undefined,
      order_status: filter?.status,
      user_id: filter?.artist,
      branch_id: filter?.branch,
      friend: filter?.status != OrderStatus.Friend ? undefined : 0,
      ...(pg.filter && { customer: pg.filter }),
      //   name: pg.filter,
    }).then((d) => {
      orderFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };

  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const { edit, ...body } = e as any;

    const payload = { ...body };
    const details = payload.details;
    if (details.length == 1) {
      payload.details = details.map((d: any) => {
        return {
          price: body.total_amount,
          ...d,
        };
      });
    }
    const res = edit
      ? await updateOne<Order>(
          Api.order,
          edit ?? "",
          {
            ...payload,
            // order_date: mnDate(payload.order_date),
          } as unknown as Order,
          "update",
        )
      : await create(Api.order, {
          ...payload,
        } as unknown as Order);
    if (res.success) {
      refresh();
      showToast(
        "success",
        edit ? "Мэдээлэл шинэчиллээ!" : "Амжилттай нэмэгдлээ!",
      );
    } else {
      showToast("info", res.error ?? "Алдаа гарлаа!", {
        duration: 5000,
      });
    }
    setAction(ACTION.DEFAULT);
  };

  const downloadExcel = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const selectedStart = filter?.date?.from ?? mnDate(new Date());
    const selectedEnd =
      filter?.date?.to ?? filter?.date?.from ?? mnDate(new Date());
    const start = dateFormat(mnDate(selectedStart));
    const end = dateFormat(mnDate(selectedEnd));
    const res = await excel(Api.order, {
      page: 0,
      limit: -1,
      sort: DEFAULT_PG.sort,
      date: start,
      end_date: filter?.list ? end : undefined,
      order_status: filter?.status,
      user_id: filter?.artist,
      branch_id: filter?.branch,
      friend: filter?.status != OrderStatus.Friend ? undefined : 0,
    });
    if (res.success && res.data) {
      const blob = new Blob([res.data], { type: "application/xlsx" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `order_${mnDate().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      showToast("error", res.message);
    }
    setAction(ACTION.DEFAULT);
  };
  const deleteOrders = async (index: number) => {
    const id = orders?.items?.[index]?.id ?? "";
    const res = await deleteOne(Api.order, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IOrder) => {
    // setOpen(true);
    // form.reset({ ...e, date: e.date?.toString().slice(0, 10), edit: e.id });
  };

  const confirmOrders = async () => {
    const from = dateFormat(mnDate(filter?.date?.from ?? new Date()));
    const to = dateFormat(
      mnDate(filter?.date?.to ?? filter?.date?.from ?? new Date()),
    );

    setAction(ACTION.RUNNING);
    const res = await find(Api.order, { from, to } as any, "confirm");
    const processed = Number((res?.data as any)?.count ?? 0);
    const success = processed > 0;

    showToast(
      success ? "success" : "info",
      success
        ? from === to
          ? `${from} өдрийн ${processed} захиалга бодогдлоо`
          : `${from} - ${to} хоорондын ${processed} захиалга бодогдлоо`
        : "Бодох захиалга олдсонгүй",
    );
    setAction(ACTION.DEFAULT);
    rerunCurrentDateRange();
  };
  const columns = getColumns(edit, deleteOrders);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    refresh({});
  }, [filter?.list]);
  return (
    <div className="relative">
      <DynamicHeader count={orders?.count} titleOverride={titleOverride} />

      <div className="admin-container relative">
        <div className="bg-white rounded-xl shadow-light border-light p-0 md:p-5">
          <SchedulerProvider weekStartsOn="monday">
            <SchedulerViewFilteration
              loading={action == ACTION.RUNNING}
              send={onSubmit}
              excel={downloadExcel}
              deleteOrder={deleteOrder}
              orders={orders}
              values={{
                branch: branches,
                customer: customers,
                service: services,
                user: users,
                artists: artists
              }}
              filter={filter}
              setFilter={changeFilter}
              action={action}
              columns={columns}
              refresh={refresh}
            />
          </SchedulerProvider>
          {showConfirmButton && (
            <div className="flex justify-end my-8">
              <AppAlertDialog
                onConfirm={confirmOrders}
                title={`${dateFormat(
                  mnDate(filter?.date?.from),
                )}${
                  filter?.date?.to
                    ? ` - ${dateFormat(mnDate(filter?.date?.to))}`
                    : ""
                } хугацааны захиалгуудыг бодоход бэлэн байна уу`}
                trigger={
                  <Button variant="default" disabled={action == ACTION.RUNNING}>
                    <Check className="w-4 h-4 text-green-500" />
                    {action == ACTION.RUNNING ? "Бодож байна" : "Захиалга хаах"}
                  </Button>
                }
              />
            </div>
          )}

          {/* <Button>Баталгаажуулах</Button> */}
        </div>
      </div>
    </div>
  );
};
