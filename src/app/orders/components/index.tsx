"use client";
import { Booking, Branch, IOrder, Order, Schedule, Service, User } from "@/models";
import { useEffect, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  ListDefault,
  SearchType,
} from "@/lib/constants";
import { Api } from "@/utils/api";
import { create, deleteOne, excel, find, updateOne } from "@/app/(api)";
import { fetcher } from "@/hooks/fetcher";
import SchedulerViewFilteration from "@/components/schedule/_components/view/schedular-view-filteration";
import { SchedulerProvider } from "@/providers/schedular-provider";
import DynamicHeader from "@/components/dynamicHeader";
import { coerceDate, mnDate } from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";
import { OrderStatus } from "@/lib/enum";
import { getColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AppAlertDialog } from "@/components/AlertDialog";
import { DateRange } from "react-day-picker";

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
  channel?: string;
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
  const [orderArtists, setOrderArtists] = useState<SearchType<User>[]>([]);
  const changeFilter = (
    key: string,
    value: number | string | undefined | boolean | DateRange,
  ) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };
  const rerunCurrentDateRange = () => {
    const from = mnDate(filter?.date?.from ?? new Date());
    const to = mnDate(filter?.date?.to ?? filter?.date?.from ?? new Date());

    changeFilter("date", { from, to } as DateRange);
  };
  const isFirstRender = useRef(true);

  const dateFormat = (d: Date | string | number) => {
    const value = coerceDate(d);
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getAristSchedules = async () => {
    const selectedDate = mnDate(filter?.date?.from ?? new Date());
    const selectedDateText = dateFormat(selectedDate);
    // Хуучин `artist_leaves`/`branch_leaves` API-ийн оронд амралтыг
    // шууд schedules.leave_status / bookings.is_leave-ээс (тухайн
    // огноогоор) уншина.
    //
    // ⚠️ Өмнө нь артистын ажиллах цагийг `index`-ээр (7 хоногийн 0-6
    // ерөнхий индекс) хайдаг байсан (`search<Schedule>(Api.schedule,
    // { index })`). `schedules` хүснэгт date-based болсон тул (нэг
    // артистад ойрын ~30 хоногт өдөр бүр өөр мөр байдаг) энэ query
    // сонгосон өдрөөс үл хамааран тухайн гарагт таарах ЯМАР Ч мөрийг
    // (өөр долоо хоногийнх ч байсан) буцааж, буруу/хуучин цаг харагдах
    // алдаа гаргаж байсан. Одоо доор аль хэдийн татаж байгаа тухайн
    // өдрийн (яг `date`-ээр шүүсэн) `daySchedules`-ийг л ашиглана.
    const [daySchedules, branchLeaves] = await Promise.all([
      find<Schedule>(Api.schedule, {
        limit: -1,
        date: selectedDateText,
      }),
      find<Booking>(
        Api.booking,
        {
          limit: -1,
          date: selectedDateText,
        },
        "employee",
      ),
    ]);
    const dayItems = daySchedules.data?.items ?? [];
    const scheduleItems = dayItems.filter(
      (item) =>
        item.leave_status == null &&
        Boolean(item.times && `${item.times}`.trim()),
    );
    const scheduledUserIds = new Set(
      scheduleItems.map((s) => s.user_id).filter(Boolean),
    );
    const artistLeaveIds = new Set(
      dayItems
        .filter((item) => item.leave_status != null)
        .map((item) => item.user_id)
        .filter(Boolean),
    );
    const branchLeaveIds = new Set(
      (branchLeaves.data?.items ?? [])
        .filter((item) => item.is_leave)
        .map((item) => item.branch_id)
        .filter(Boolean),
    );

    setArtists(
      users
        .filter((u) => {
          const [, , branchId = ""] = u.value?.split("__") ?? [];
          return (
            scheduledUserIds.has(u.id) &&
            !artistLeaveIds.has(u.id) &&
            !branchLeaveIds.has(branchId)
          );
        })
        .map((u) => ({
          ...u,
          item: scheduleItems.find((a) => a.user_id == u.id)?.times,
        })),
    );
  };

  const getOrderArtists = async () => {
    // Жагсаалт горимд бүх артистыг харуулна — хүнд query илгээхгүй
    if (filter?.list) {
      setOrderArtists(users);
      return;
    }

    // Өдрийн горимд зөвхөн 1 өдрийн захиалгаас артист жагсаалт гаргана
    const selectedStart = filter?.date?.from ?? mnDate(new Date());
    const start = dateFormat(mnDate(selectedStart));
    const data = await fetcher<Order>(Api.order, {
      page: 0,
      limit: 200,
      sort: DEFAULT_PG.sort,
      date: start,
      order_status: filter?.status,
      branch_id: filter?.branch,
      channel: filter?.channel,
      friend: filter?.status != OrderStatus.Friend ? undefined : 0,
    });
    const map = new Map<string, SearchType<User>>();

    (data?.items ?? []).forEach((order) => {
      (order.details ?? []).forEach((detail: any) => {
        const id = detail.user_id ?? detail.artist_id;
        if (!id || map.has(id)) return;

        const user = users.find((item) => item.id === id);
        const [
          fallbackMobile = "",
          fallbackNickname = "",
          ,
          fallbackColor = "",
        ] = user?.value?.split("__") ?? [];
        const mobile = detail.mobile ?? fallbackMobile;
        const nickname = detail.nickname ?? fallbackNickname;
        const color = detail.color ?? fallbackColor;

        map.set(id, {
          id,
          user_id: id,
          value: `${mobile ?? ""}__${nickname ?? ""}____${color ?? ""}`,
        });
      });
    });

    setOrderArtists([...map.values()]);
  };

  useEffect(() => {
    refresh();
    getAristSchedules();
    getOrderArtists();
  }, [
    filter?.date,
    filter?.artist,
    filter?.branch,
    filter?.status,
    filter?.channel,
  ]);

  const orderFormatter = (data: ListType<Order> | undefined) => {
    if (!data) return;
    const items: Order[] = (data.items ?? []).map((item) => ({ ...item }));
    setOrders({ items, count: data.count ?? 0 });
  };

  useEffect(() => {
    const interval = setInterval(
      () => {
        setFilter({});
        getAristSchedules();
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

  const getFilteredDateFileSuffix = () => {
    const selectedStart = filter?.date?.from ?? mnDate(new Date());
    const selectedEnd =
      filter?.date?.to ?? filter?.date?.from ?? mnDate(new Date());
    const start = dateFormat(mnDate(selectedStart));
    const end = dateFormat(mnDate(selectedEnd));

    if (filter?.list && start !== end) {
      return `${start}_${end}`;
    }

    return start;
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
      channel: filter?.channel,
      friend: filter?.status != OrderStatus.Friend ? undefined : 0,
      ...(pg.filter && { customer: pg.filter }),
    }).then((d) => {
      orderFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };

  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const { edit, ...body } = e as any;
    const payload = { ...body };
    const res = edit
      ? await updateOne<Order>(
          Api.order,
          edit ?? "",
          { ...payload } as unknown as Order,
          "update",
        )
      : await create(Api.order, { ...payload } as unknown as Order);
    if (res.success) {
      refresh();
      showToast(
        "success",
        edit ? "Мэдээлэл шинэчиллээ!" : "Амжилттай нэмэгдлээ!",
      );
    } else {
      showToast("info", res.error ?? "Алдаа гарлаа!", { duration: 5000 });
    }
    setAction(ACTION.DEFAULT);
    return res.success;
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
      channel: filter?.channel,
      friend: filter?.status != OrderStatus.Friend ? undefined : 0,
    });
    if (res.success && res.data) {
      const blob = new Blob([res.data], { type: "application/xlsx" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `order_${getFilteredDateFileSuffix()}.xlsx`,
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

  const edit = async (_e: IOrder) => {
    // no-op (захиалга засах одоохондоо artist-аас идэвхгүй)
  };

  const confirmOrders = async () => {
    const from = dateFormat(mnDate(filter?.date?.from ?? new Date()));
    const to = dateFormat(
      mnDate(filter?.date?.to ?? filter?.date?.from ?? new Date()),
    );

    setAction(ACTION.RUNNING);
    const res = await create(Api.order, { from, to } as any, "confirm");
    const processed = Number((res?.data as any)?.payload?.count ?? 0);
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
    getOrderArtists();
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
                artists: artists,
                filterArtists: orderArtists,
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
                title={`${dateFormat(mnDate(filter?.date?.from))}${
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
        </div>
      </div>
    </div>
  );
};
