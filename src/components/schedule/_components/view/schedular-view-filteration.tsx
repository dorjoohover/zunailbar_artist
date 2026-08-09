"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { FileText, CircleX, Plus } from "lucide-react";

import DailyView from "./day/daily-view";
import { ClassNames, Views } from "@/types/index";
import { cn } from "@/lib/utils";
import {
  ACTION,
  getEnumValues,
  ListType,
  OrderStatusValues,
  SearchType,
  zNumOpt,
  zStrOpt,
} from "@/lib/constants";
import { Branch, IOrder, Order, Service, User } from "@/models";
import { Api } from "@/utils/api";
import { DatePicker } from "@/shared/components/date.picker";
import { firstLetterUpper, mobileFormatter } from "@/lib/functions";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/shared/components/modal";
import { create } from "@/app/(api)";
import { OrderStatus, ROLE, UserLevel } from "@/lib/enum";
import { showToast } from "@/shared/components/showToast";
import { FormItems } from "@/shared/components/form.field";
import { TextField } from "@/shared/components/text.field";
import { PasswordField } from "@/shared/components/password.field";
import { ComboBox } from "@/shared/components/combobox";
import { FilterType } from "@/app/orders/components";
import { getUserColor } from "@/lib/colors";
import { DateRange } from "react-day-picker";

// Animation settings for Framer Motion
const animationConfig = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, type: "spring" },
};
const formSchema = z.object({
  mobile: z.string().length(8),
  level: zNumOpt({
    label: "Эрэмбэ",
  }),
  nickname: zStrOpt({
    label: "Хоч",
    allowNullable: false,
  }),
  password: z.string().nullable().optional(),
});

const defaultValues: UserType = {
  mobile: "",
  nickname: "",
  password: "",
  level: UserLevel.BRONZE,
};
type UserType = z.infer<typeof formSchema>;

const normalizeScheduleTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.length >= 5 ? trimmed.slice(0, 5) : trimmed;
};

const timeToMinutes = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
};

const getArtistScheduleBlocks = (value?: string) => {
  const times = (value ?? "")
    .split("|")
    .map(normalizeScheduleTime)
    .filter(Boolean);

  if (times.length === 0) return [];

  const sortedUniqueTimes = Array.from(new Set(times)).sort(
    (a, b) => timeToMinutes(a) - timeToMinutes(b),
  );

  const groups: string[][] = [];

  sortedUniqueTimes.forEach((time) => {
    const lastGroup = groups.at(-1);

    if (!lastGroup) {
      groups.push([time]);
      return;
    }

    const previousTime = lastGroup[lastGroup.length - 1];
    const isAdjacent = timeToMinutes(time) - timeToMinutes(previousTime) === 30;

    if (isAdjacent) {
      lastGroup.push(time);
      return;
    }

    groups.push([time]);
  });

  return groups.map((group) =>
    group.length === 1
      ? group[0]
      : `${group[0]} - ${group[group.length - 1]}`,
  );
};

export default function ({
  views = {
    views: ["day", "week", "month"],
    mobileViews: ["day"],
  },
  loading,
  stopDayEventSummary = false,
  CustomComponents,
  classNames,
  orders,
  excel,
  refresh,
  values,
  send,
  filter,
  setFilter,
  deleteOrder,
  action,
  columns,
}: {
  loading: boolean;
  deleteOrder: (id: string) => void;
  orders: ListType<Order>;
  setFilter: (
    key: string,
    value: string | number | undefined | boolean | DateRange,
  ) => void;
  filter?: FilterType;
  values: {
    branch: SearchType<Branch>[];
    customer: SearchType<User>[];
    user: SearchType<User>[];
    artists: SearchType<User>[];
    filterArtists?: SearchType<User>[];
    service: ListType<Service>;
  };
  views?: Views;
  stopDayEventSummary?: boolean;
  CustomComponents?: any;
  classNames?: ClassNames;
  send: (order: IOrder) => void | boolean | Promise<void | boolean>;
  action: ACTION;
  columns: ColumnDef<IOrder>[];
  refresh: <T>({
    page,
    limit,
    sort,
    filter,
  }: {
    page?: number;
    limit?: number;
    sort?: boolean;
    filter?: T;
  }) => void;
  excel?: <T>({
    page,
    limit,
    sort,
    filter,
  }: {
    page?: number;
    limit?: number;
    sort?: boolean;
    filter?: T;
  }) => void;
}) {
  const resetDate = new Date();
  const [activeView, setActiveView] = useState<string>("day");
  const [clientSide, setClientSide] = useState(false);
  const form = useForm<UserType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    setClientSide(true);
  }, []);
  const [isMobile, setIsMobile] = useState(
    clientSide ? window.innerWidth <= 768 : false,
  );

  useEffect(() => {
    if (!clientSide) return;
    setIsMobile(window.innerWidth <= 768);
    function handleResize() {
      if (window && window.innerWidth <= 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }

    window && window.addEventListener("resize", handleResize);

    return () => window && window.removeEventListener("resize", handleResize);
  }, [clientSide]);

  const viewsSelector = isMobile ? views?.mobileViews : views?.views;

  // Set initial active view
  useEffect(() => {
    if (viewsSelector?.length) {
      setActiveView(viewsSelector[0]);
    }
  }, []);
  const downloadExcel = () => {
    if (excel) {
      excel({});
    }
  };
  const [open, setIsOPen] = useState<undefined | boolean>(false);
  const onSubmit = async <T,>(e: T) => {
    const body = e as UserType;
    const res = await create<User>(Api.user, {
      ...body,
      role: ROLE.CLIENT,
      birthday: null,
    } as any);

    if (res.success) {
      refresh({});
      setIsOPen(false);
      showToast("success", "Амжилттай нэмлээ.");
      form.reset(defaultValues);
    } else {
      showToast("error", res.error ?? "");
    }
  };
  const onInvalid = async <T,>(e: T) => {
    const value = e as any;
    if (value.password != undefined)
      showToast("info", value.password?.message ?? "");
  };
  const scheduledArtists = values.artists
    .map((user) => {
      const [mobile, nickname, , color] = user.value?.split("__");
      const scheduleBlocks = getArtistScheduleBlocks(
        typeof user.item === "string" ? user.item : undefined,
      );

      return {
        user,
        color,
        scheduleBlocks,
        formattedMobile: mobileFormatter(mobile ?? ""),
        displayName: firstLetterUpper(nickname ?? ""),
      };
    })
    .filter((artist) => artist.scheduleBlocks.length > 0);

  return (
    <div className="flex w-full flex-col">
      <div className="daily-weekly-monthly-selection relative w-full">
        <div className="mb-0 flex w-full flex-col gap-3">
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <label className="min-w-[150px]">
              <span className="filter-label">Огноо</span>

              <DatePicker
                value={filter?.list ? filter?.date : filter?.date?.from}
                mode={filter?.list ? "range" : "single"}
                onChange={(date) => {
                  if (filter?.list) {
                    setFilter("date", date as DateRange);
                    return;
                  }

                  const selected = date as Date | undefined;
                  setFilter(
                    "date",
                    selected
                      ? {
                          from: selected,
                          to: selected,
                        }
                      : undefined,
                  );
                }}
                name=""
                pl="Огноо сонгох"
              />
            </label>
            <label className="w-full maw-[300px] min-w-[150px]">
              <span className="filter-label">Салбар</span>
              <ComboBox
                props={{
                  name: "Артист",
                  onBlur: () => {},
                  onChange: (e) => setFilter("branch", e),
                  ref: () => null,
                  value: filter?.branch,
                }}
                items={values.branch.map((item) => {
                  const [name] = item?.value?.split("__") ?? [""];
                  return {
                    value: item.id,
                    label: name ?? "",
                  };
                })}
              />
            </label>
            <label className="w-full maw-[300px] min-w-[150px]">
              <span className="filter-label">Артист</span>
              <ComboBox
                props={{
                  name: "Артист",
                  onBlur: () => {},
                  onChange: (e) => setFilter("artist", e),
                  ref: () => null,
                  value: filter?.artist,
                }}
                items={(values.filterArtists ?? values.artists).map((item) => {
                  const [mobile, nickname] = item?.value?.split("__") ?? [
                    "",
                    "",
                    "",
                    "",
                  ];
                  return {
                    value: item.id,
                    label: `${firstLetterUpper(
                      nickname ?? "",
                    )} - ${mobileFormatter(mobile ?? "")}`,
                  };
                })}
              />
            </label>

            <label className="w-full maw-[300px] min-w-[150px]">
              <span className="filter-label">Төлөв</span>
              <ComboBox
                props={{
                  name: "Төлөв",
                  onBlur: () => {},
                  onChange: (e) => setFilter("status", e),
                  ref: () => null,
                  value: filter?.status,
                }}
                items={getEnumValues(OrderStatus).map((item) => {
                  return {
                    value: item.toString(),
                    label: OrderStatusValues[item],
                  };
                })}
              />
            </label>

            <label className="w-full maw-[300px] min-w-[150px]">
              <span className="filter-label">Суваг</span>
              <ComboBox
                props={{
                  name: "Суваг",
                  onBlur: () => {},
                  onChange: (e) => setFilter("channel", e),
                  ref: () => null,
                  value: filter?.channel,
                }}
                items={[{ value: "chatbot", label: "Chatbot-оор үүссэн" }]}
              />
            </label>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setFilter("artist", undefined);
                  setFilter("branch", undefined);
                  setFilter("status", undefined);
                  setFilter("channel", undefined);
                  setFilter("date", {
                    from: resetDate,
                    to: resetDate,
                  });
                }}
                className="h-10 justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-500 hover:bg-red-100 hover:text-red-500 md:min-w-[120px]"
              >
                <CircleX />
                Цэвэрлэх
              </Button>

              <Button
                variant="purple"
                onClick={() => setIsOPen(true)}
                className="h-10 justify-center gap-2 rounded-xl text-xs font-bold md:min-w-[140px]"
              >
                <Plus strokeWidth={2.5} />
                Клиент нэмэх
              </Button>

              <Modal
                maw="md"
                name=""
                submit={() => form.handleSubmit(onSubmit, onInvalid)()}
                open={open == true}
                setOpen={(v) => {
                  setIsOPen(v);
                  form.reset(defaultValues);
                }}
                loading={action == ACTION.RUNNING}
              >
                <FormProvider {...form}>
                  <div className="space-y-4">
                    {[
                      {
                        key: "nickname",
                        label: "Нэр",
                        pattern: true,
                      },
                      {
                        key: "mobile",
                        label: "Утас",
                      },
                    ].map((item, i) => {
                      const name = item.key as keyof UserType;
                      const label = item.label as keyof UserType;

                      return (
                        <FormItems
                          label={label}
                          control={form.control}
                          name={name}
                          key={i}
                          className={item.key === "name" ? "col-span-2" : ""}
                        >
                          {(field) => {
                            const blockRe: RegExp | undefined = item.pattern
                              ? /[^\p{L}\s\-']/gu
                              : undefined;
                            const onChange: React.ChangeEventHandler<
                              HTMLInputElement
                            > = (e) => {
                              if (blockRe) {
                                const raw = e.target?.value ?? "";
                                const cleaned = raw.replace(blockRe, "");
                                (field.onChange as (v: string) => void)(cleaned);
                              } else {
                                field.onChange(e);
                              }
                            };
                            return (
                              <TextField
                                props={{ ...field, onChange }}
                                label={""}
                              />
                            );
                          }}
                        </FormItems>
                      );
                    })}
                    <FormItems
                      control={form.control}
                      name="password"
                      className="col-span-2"
                    >
                      {(field) => {
                        return <PasswordField props={{ ...field }} view={true} />;
                      }}
                    </FormItems>
                  </div>
                </FormProvider>
              </Modal>

              {excel && (
                <Button
                  variant={"ghost"}
                  onClick={downloadExcel}
                  className="h-10 justify-center rounded-xl bg-green-500 text-white hover:bg-green-500/80 hover:text-white md:min-w-[110px]"
                >
                  <FileText />
                  Excel
                </Button>
              )}
            </div>

            <label
              htmlFor="compare-switch"
              className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 sm:w-auto sm:min-w-[180px]"
            >
              <span>{isMobile ? "Жагсаалт" : "Жагсаалтаар харах"}</span>
              <Switch
                checked={filter?.list}
                onCheckedChange={(val) => setFilter("list", val)}
                id="compare-switch"
              />
            </label>
          </div>
        </div>
        <div className="divide-x-gray"></div>

        {filter?.list ? (
          <DataTable
            limit={20}
            columns={columns}
            count={Number(orders?.count ?? "0")}
            data={orders?.items ?? []}
            refresh={refresh}
            loading={action == ACTION.RUNNING}
          />
        ) : (
          <Tabs
            value={activeView}
            onValueChange={setActiveView}
            className={cn("w-full gap-0", classNames?.tabs)}
          >
            <>
              {scheduledArtists.length > 0 && (
                <div className="grid grid-cols-1 gap-3 px-2 mb-4 md:grid-cols-2 xl:grid-cols-3">
                  {scheduledArtists.map(
                    ({
                      user,
                      color,
                      scheduleBlocks,
                      formattedMobile,
                      displayName,
                    }) => (
                      <div
                        className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                        key={user.id}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn("mt-1 h-3 w-3 shrink-0 rounded-full bg-slate-300")}
                            style={{
                              backgroundColor: color
                                ? `${getUserColor(+color)}`
                                : undefined,
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 break-words">
                              {displayName || formattedMobile || "Нэргүй артист"}
                            </p>
                            {formattedMobile && (
                              <p className="text-xs text-slate-500">
                                {formattedMobile}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {scheduleBlocks.map((timeBlock) => (
                            <span
                              key={`${user.id}-${timeBlock}`}
                              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm"
                            >
                              {timeBlock}
                            </span>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
              <div className="px-2">
                {viewsSelector?.includes("day") && (
                  <TabsContent value="day">
                    <AnimatePresence mode="wait">
                      <motion.div {...(animationConfig as any)}>
                        <DailyView
                          deleteOrder={deleteOrder}
                          loading={loading}
                          filter={filter}
                          setFilter={setFilter}
                          values={values}
                          events={orders.items}
                          send={send}
                          stopDayEventSummary={stopDayEventSummary}
                          classNames={classNames?.buttons}
                          prevButton={
                            CustomComponents?.customButtons?.CustomPrevButton
                          }
                          nextButton={
                            CustomComponents?.customButtons?.CustomNextButton
                          }
                          CustomEventComponent={
                            CustomComponents?.CustomEventComponent
                          }
                          CustomEventModal={CustomComponents?.CustomEventModal}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>
                )}
              </div>
            </>
          </Tabs>
        )}
      </div>
    </div>
  );
}
