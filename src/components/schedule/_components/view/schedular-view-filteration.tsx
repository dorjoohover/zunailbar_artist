"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { FileText, CircleX } from "lucide-react";

import DailyView from "./day/daily-view";
import { ClassNames, Views } from "@/types/index";
import { cn } from "@/lib/utils";
import {
  ACTION,
  getEnumValues,
  getUserLevelValue,
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
    value: string | number | undefined | boolean,
  ) => void;
  filter?: FilterType;
  values: {
    branch: SearchType<Branch>[];
    customer: SearchType<User>[];
    user: SearchType<User>[];
    service: ListType<Service>;
  };
  views?: Views;
  stopDayEventSummary?: boolean;
  CustomComponents?: any;
  classNames?: ClassNames;
  send: (order: IOrder) => void;
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

    console.log({
      ...body,
      role: ROLE.CLIENT,
      birthday: null,
    });
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

  return (
    <div className="flex w-full flex-col">
      <div className="daily-weekly-monthly-selection relative w-full">
        <div className="flex items-center justify-between w-full gap-4 mb-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-2">
            {filter?.list && (
              <label className="min-w-[150px]">
                <span className="filter-label">Огноо</span>

                <DatePicker
                  value={filter?.date}
                  mode="range"
                  onChange={(date) => setFilter("date", date as any)}
                  name=""
                  pl="Огноо сонгох"
                />
              </label>
            )}
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
                items={values.customer.map((item) => {
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
          </div>
          <div className="grid grid-cols-1 md:flex gap-2 items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setFilter("artist", undefined);
                setFilter("branch", undefined);
                setFilter("status", undefined);
                setFilter("date", undefined);
              }}
              className="text-xs text-red-500 hover:text-red-500 bg-red-50 hover:bg-red-100  lg:h-10"
            >
              <CircleX />
            </Button>
            <Modal
              maw="md"
              name={"Хэрэглэгч нэмэх"}
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
                              // RHF-д value-гаар нь дамжуулна
                              (field.onChange as (v: string) => void)(cleaned);
                            } else {
                              field.onChange(e); // хэвийн дамжуул
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
                  <FormItems label="Эрэмбэ" control={form.control} name="level">
                    {(field) => {
                      return (
                        <ComboBox
                          props={{ ...field }}
                          items={getEnumValues(UserLevel).map((item) => {
                            return {
                              value: item.toString(),
                              label: getUserLevelValue[item].name,
                            };
                          })}
                        />
                      );
                    }}
                  </FormItems>
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
                className="bg-green-500 text-white hover:bg-green-500/80 gap-1 hover:text-white"
              >
                <FileText />
                Excel
              </Button>
            )}
            <div className="flex items-center justify-center sm:justify-end gap-2 mt-2 max-w-md md:max-w-lg w-full">
              <Switch
                checked={filter?.list}
                onCheckedChange={(val) => setFilter("list", val)}
                id="compare-switch"
              />
              <label
                htmlFor="compare-switch"
                className="text-sm text-muted-foreground hidden sm:block"
              >
                Жагсаалтаар харах
              </label>
            </div>
          </div>
        </div>
        <div className="divide-x-gray"></div>

        {filter?.list ? (
          <DataTable
            // clear={() => setFilter(undefined)}
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1 mb-4">
                {values.user.map((user, i) => {
                  const [mobile, nickname, branch, color] =
                    user.value?.split("__");
                  return (
                    <div className="flex gap-1 items-center" key={i}>
                      <div
                        className={cn("rounded-full w-4 h-4")}
                        style={{
                          backgroundColor: color
                            ? `${getUserColor(+color)}`
                            : "",
                        }}
                      />
                      <span className="text-xs">
                        {mobileFormatter(mobile)}{" "}
                        {firstLetterUpper(nickname ?? "")}
                      </span>
                    </div>
                  );
                })}
              </div>
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
            </>
          </Tabs>
        )}
      </div>
    </div>
  );
}
