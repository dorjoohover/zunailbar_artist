"use client";
import { Branch, IOrder, Order, OrderLog, Service, User } from "@/models";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  ListDefault,
  SearchType,
  Option,
  getEnumValues,
  StatusValues,
  OrderStatusValues,
} from "@/lib/constants";
import z from "zod";
import { Api } from "@/utils/api";
import { create, deleteOne, excel, find, search, updateOne } from "@/app/(api)";
import { fetcher } from "@/hooks/fetcher";
import SchedulerViewFilteration from "@/components/schedule/_components/view/schedular-view-filteration";
import { SchedulerProvider } from "@/providers/schedular-provider";
import DynamicHeader from "@/components/dynamicHeader";
import {
  formatDate,
  mnDate,
  mobileFormatter,
  parseDate,
  searchUsernameFormatter,
  textValue,
  toTimeString,
  usernameFormatter,
} from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";
import { OrderStatus, STATUS } from "@/lib/enum";
import { getColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AppAlertDialog } from "@/components/AlertDialog";
import { DateRange } from "react-day-picker";
import { Slot } from "@/models/slot.model";
import { DataTable } from "@/components/data-table";
import { ComboBox } from "@/shared/components/combobox";
import { DatePicker } from "@/shared/components/date.picker";

export type FilterType = {
  old_status?: STATUS;
  new_status?: STATUS;
  new_order_status?: OrderStatus;
  old_order_status?: OrderStatus;
  user?: string;
  date?: Date;
  customer_mobile?: string;
};

export const OrderLogPage = ({
  logs,
  users,
}: {
  logs: ListType<OrderLog>;
  users: SearchType<User>[];
}) => {
  const [items, setItems] = useState({
    [Api.user]: users,
  });
  const userMap = useMemo(
    () => new Map(items[Api.user].map((b) => [b.id, b.value])),
    [items],
  );
  const orderLogsFormatter = (data: ListType<OrderLog>) => {
    const items: OrderLog[] = data.items.map((item) => {
      return {
        ...item,
        changed_user_name: item.changed_user_name ?? "",
        changed_user_mobile: item.changed_user_mobile ?? "",
        branch_name: item.branch_name ?? "",
        artist_names: item.artist_names ?? "",
        customer_mobile: item.customer_mobile ?? "",
        customer_name: item.customer_name ?? "",
      };
    });
    return { items, count: data.count };
  };
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [orderLogs, setOrderLogs] = useState<ListType<OrderLog>>(
    orderLogsFormatter(logs),
  );
  const [filter, setFilter] = useState<FilterType>({});
  const changeFilter = (
    key: string,
    value: number | string | undefined | boolean,
  ) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refresh();
  }, [
    filter?.date,
    filter?.old_status,
    filter?.new_status,
    filter?.user,
    filter?.old_order_status,
    filter?.new_order_status,
    filter?.customer_mobile,
  ]);
  const searchField = async (v: string, key: Api, edit?: boolean) => {
    if (v.length <= 1) return;

    const payload = {
      id: v,
    };
    await search(key as any, {
      ...payload,
      limit: 20,
      page: 0,
    }).then((d) => {
      setItems((prev) => ({
        ...prev,
        [key]: d.data,
      }));
    });
  };
  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;

    const date = filter.date ? parseDate(filter?.date) : undefined;

    await fetcher<OrderLog>(
      Api.order,
      {
        page: page ?? DEFAULT_PG.page,
        limit: limit ?? DEFAULT_PG.limit,
        sort: sort ?? DEFAULT_PG.sort,
        changed_at: date,
        changed_by: filter?.user,
        customer_mobile: filter?.customer_mobile,
        old_order_status: filter?.old_order_status,
        new_order_status: filter?.new_order_status,
        new_status: filter?.new_status,
        old_status: filter?.old_status,
      },
      "logs",
    ).then((d) => {
      const formattedOrderLogs = orderLogsFormatter(d);
      setOrderLogs(formattedOrderLogs);
    });
    setAction(ACTION.DEFAULT);
  };
  const view = async (data: OrderLog) => {};
  const columns = getColumns(view);
  const groups: {
    key: keyof FilterType;
    label: string;
    items: Option[];
    type?: string;
    search?: boolean;
  }[] = useMemo(
    () => [
      {
        key: "user",
        label: "Өөрчлөлт оруулсан",
        items: items[Api.user].map((b) => ({
          value: b.id,
          label: `${mobileFormatter(b.value?.split("__")?.[0])} ${b.value?.split("__")?.[1]?.trim() || "-"}`,
        })),
        search: true,
      },
      {
        key: "date",
        label: "Өөрлөлт оруулсан огноо",
        items: [],
        type: "date",
      },
      {
        key: "old_status",
        label: textValue("old_status"),
        items: getEnumValues(STATUS).map((s) => ({
          value: s,
          label: StatusValues[s],
        })),
      },
      {
        key: "new_status",
        label: textValue("new_status"),
        items: getEnumValues(STATUS).map((s) => ({
          value: s,
          label: StatusValues[s],
        })),
      },
      {
        key: "old_order_status",
        label: textValue("old_order_status"),
        items: getEnumValues(OrderStatus).map((s) => ({
          value: s,
          label: OrderStatusValues[s],
        })),
      },
      {
        key: "new_order_status",
        label: textValue("new_order_status"),
        items: getEnumValues(OrderStatus).map((s) => ({
          value: s,
          label: OrderStatusValues[s],
        })),
      },
    ],
    [items[Api.user]],
  );
  const handleSearch = (e: string) => {
    void searchField(e, Api.user);
  };
  return (
    <div className="relative">
      <DynamicHeader count={orderLogs.count} />

      <div className="admin-container relative">
        <div className="bg-white rounded-xl shadow-light border-light p-0 md:p-5">
          <DataTable
            search={false}
            filter={
              <>
                <label>
                  <span className="filter-label">Хэрэглэгчийн дугаар</span>
                  <input
                    type="text"
                    className="max-w-50 w-full text-xs border rounded px-2 py-1.5"
                    placeholder="Утасны дугаар"
                    value={filter?.customer_mobile ?? ""}
                    onChange={(e) => changeFilter("customer_mobile", e.target.value || undefined)}
                  />
                </label>
                {groups.map((item, i) => {
                  const { key, type } = item;
                  if (type == "date") {
                    return (
                      <label key={i}>
                        <span className="filter-label">
                          {item.label as string}
                        </span>
                        <DatePicker
                          value={filter?.date}
                          mode="single"
                          onChange={(date) => changeFilter("date", date as any)}
                          name=""
                          pl="Огноо сонгох"
                        />
                      </label>
                    );
                  }
                  return (
                    <label key={i}>
                      <span className="filter-label">
                        {item.label as string}
                      </span>
                      <ComboBox
                        pl={item.label}
                        name={item.label}
                        className="max-w-50 w-full text-xs!"
                        value={filter?.[key] ? String(filter[key]) : ""} //
                        items={item.items.map((it) => ({
                          value: String(it.value),
                          label: it.label as string,
                        }))}
                        search={item.search ? handleSearch : undefined}
                        props={{
                          value: filter?.[key] ? String(filter[key]) : "",
                          onChange: (val: string) => changeFilter(key, val),
                          onBlur: () => {},
                          name: key,
                          ref: () => {},
                        }}
                      />
                    </label>
                  );
                })}
              </>
            }
            clear={() => setFilter({})}
            columns={columns}
            count={orderLogs?.count}
            data={orderLogs?.items ?? []}
            refresh={refresh}
            loading={action == ACTION.RUNNING}
          />

          {/* <Button>Баталгаажуулах</Button> */}
        </div>
      </div>
    </div>
  );
};
