"use client";
import { OrderLog, User } from "@/models";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  SearchType,
  Option,
  getEnumValues,
  StatusValues,
  OrderStatusValues,
  textValue,
} from "@/lib/constants";
import { Api } from "@/utils/api";
import { search } from "@/app/(api)";
import { fetcher } from "@/hooks/fetcher";
import DynamicHeader from "@/components/dynamicHeader";
import { mobileFormatter, parseDate } from "@/lib/functions";
import { OrderStatus, STATUS } from "@/lib/enum";
import { getColumns } from "./columns";
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
  const orderLogsFormatter = (data: ListType<OrderLog>) => {
    const items: OrderLog[] = data.items.map((item) => ({
      ...item,
      changed_user_name: item.changed_user_name ?? "",
      changed_user_mobile: item.changed_user_mobile ?? "",
      branch_name: item.branch_name ?? "",
      artist_names: item.artist_names ?? "",
      customer_mobile: item.customer_mobile ?? "",
      customer_name: item.customer_name ?? "",
    }));
    return { items, count: data.count };
  };

  const [userItems, setUserItems] = useState<SearchType<User>[]>(users);
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [orderLogs, setOrderLogs] = useState<ListType<OrderLog>>(
    orderLogsFormatter(logs),
  );
  const [filter, setFilter] = useState<FilterType>({});

  const changeFilter = (key: string, value: number | string | undefined | boolean) => {
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

  const searchField = async (v: string, key: Api) => {
    if (v.length <= 1) return;
    await search(key as any, { id: v, limit: 20, page: 0 }).then((d) => {
      setUserItems(d.data);
    });
  };

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const date = filter.date ? parseDate(filter.date) : undefined;

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
      setOrderLogs(orderLogsFormatter(d));
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
        items: userItems.map((b) => ({
          value: b.id,
          label: `${mobileFormatter(b.value?.split("__")?.[0])} ${b.value?.split("__")?.[1]?.trim() || "-"}`,
        })),
        search: true,
      },
      {
        key: "date",
        label: "Өөрчлөлт оруулсан огноо",
        items: [],
        type: "date",
      },
      {
        key: "old_status",
        label: textValue("old_status"),
        items: getEnumValues(STATUS).map((s) => ({ value: s, label: StatusValues[s] })),
      },
      {
        key: "new_status",
        label: textValue("new_status"),
        items: getEnumValues(STATUS).map((s) => ({ value: s, label: StatusValues[s] })),
      },
      {
        key: "old_order_status",
        label: textValue("old_order_status"),
        items: getEnumValues(OrderStatus).map((s) => ({ value: s, label: OrderStatusValues[s] })),
      },
      {
        key: "new_order_status",
        label: textValue("new_order_status"),
        items: getEnumValues(OrderStatus).map((s) => ({ value: s, label: OrderStatusValues[s] })),
      },
    ],
    [userItems],
  );

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
                    onChange={(e) =>
                      changeFilter("customer_mobile", e.target.value || undefined)
                    }
                  />
                </label>
                {groups.map((item, i) => {
                  const { key, type } = item;
                  if (type === "date") {
                    return (
                      <label key={i}>
                        <span className="filter-label">{item.label}</span>
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
                      <span className="filter-label">{item.label}</span>
                      <ComboBox
                        pl={item.label}
                        name={item.label}
                        className="max-w-50 w-full text-xs!"
                        value={filter?.[key] ? String(filter[key]) : ""}
                        items={item.items.map((it) => ({
                          value: String(it.value),
                          label: it.label as string,
                        }))}
                        search={item.search ? (v) => searchField(v, Api.user) : undefined}
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
            loading={action === ACTION.RUNNING}
          />
        </div>
      </div>
    </div>
  );
};
