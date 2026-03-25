"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import { useModal } from "@/providers/modal-context";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EventFormData, eventSchema } from "@/types/index";
import { useScheduler } from "@/providers/schedular-provider";
import { Branch, IOrder, Service, User } from "@/models";
import { INPUT_TYPE, OrderStatus, PaymentMethod, ROLE } from "@/lib/enum";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import {
  allTimes,
  getEnumValues,
  getMethodValue,
  ListDefault,
  ListType,
  OrderStatusValues,
  SearchType,
  VALUES,
} from "@/lib/constants";
import {
  addMinutes,
  firstLetterUpper,
  mnDateFormat,
  mobileFormatter,
  toTimeString,
  toYMD,
  usernameFormatter,
} from "@/lib/functions";
import { TextField } from "@/shared/components/text.field";
import { showToast } from "@/shared/components/showToast";
import { API, Api } from "@/utils/api";
import { create, find, search } from "@/app/(api)";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { LoaderMini } from "@/components/loader";
import { OrderSlot, Slot } from "@/models/slot.model";
import { isSameDay } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Phone, User as LUser, UserCircle } from "lucide-react";
const defaultValues = {
  branch_id: undefined,
  user_id: undefined,
  customer_desc: undefined,
  details: [],
  order_date: mnDateFormat(new Date()),
  start_time: undefined,
  edit: undefined,
  order_status: OrderStatus.Active,
  total_amount: 0,
  pre_amount: 0,
  paid_amount: 0,
};
type ListFieldProps<T> = {
  api: keyof typeof API;
  value?: string;
  key?: string;
  edit?: boolean;
  route?: string;
  onChange: (data: ListType<T>) => void;
};
const calculateDuration = (details: any[], parallel?: boolean | null) => {
  if (!details?.length) return 0;
  const durations = details.map((d) => Number(d.duration || 0));

  if (parallel && details.length > 1) {
    return Math.max(...durations);
  }

  return durations.reduce((a, b) => a + b, 0);
};
const sumPrices = (details: any[]) =>
  details.reduce((sum, d) => sum + Number(d.price || 0), 0);

type DetailType = {
  service_id: string;
  service_name: string;
  duration: unknown;
  description?: string | null | undefined;
  price?: number | null | undefined;
  user_id?: string | null | undefined;
};
export default function AddEventModal({
  // CustomAddEventModal,
  items,
  send,
  values,
  loading = false,
}: {
  items: {
    branch: SearchType<Branch>[];
    customer: SearchType<User>[];
    user: SearchType<User>[];
    service: ListType<Service>;
  };
  loading?: boolean;
  send: (order: IOrder) => void;
  values?: IOrder | any;
  // CustomAddEventModal?: React.FC<{ register: any; errors: any }>;
}) {
  const listField = async <T,>({
    api,
    value,
    key,
    edit = false,
    route,
    onChange,
  }: ListFieldProps<T>) => {
    try {
      setLoader((prev) => ({ ...prev, [api]: true }));
      const payload: Record<string, any> = {
        limit: -1,
        page: 0,
      };

      // 🔍 Хэрвээ key ба value өгөгдсөн бол filter нэмнэ
      if (key && value) {
        payload[key] = value;
      }

      // 🧩 Хэрвээ edit горим бол зөвхөн value-тай item-г татахыг оролдоно
      if (edit && value && key) {
        payload.limit = 1; // зөвхөн 1 item
      }

      const res = await find<T>(api, payload, route);

      // ✅ Response шалгах
      if (!res || !res.data) {
        console.warn(`[listField] ${String(api)} API-аас өгөгдөл олдсонгүй.`);
        onChange([] as unknown as ListType<T>);
        return;
      }

      onChange(res.data);
      setLoader((prev) => ({ ...prev, [api]: false }));
    } catch (error: any) {
      console.error(
        `[listField] ${String(api)} API дуудах үед алдаа гарлаа:`,
        error,
      );
      onChange([] as unknown as ListType<T>);
      setLoader((prev) => ({ ...prev, [api]: false }));
    }
  };
  const searchField = async (v: string, key: Api, edit?: boolean) => {
    if (edit && key === Api.customer) {
      form.setValue("customer_id", values?.customer_id);
    }
    const value = v;
    const details = form.watch("details") || [];

    let payload: Record<string, any> = {};
    if (key === Api.branch) {
      payload = { name: value };
    } else {
      payload = {
        role: key === Api.customer ? ROLE.CLIENT : ROLE.E_M,
        services: details.map((d) => d.service_id).join(","),
        branch_id: key === Api.customer ? undefined : branchId,
        ...(edit === undefined ? { id: value } : { value }),
      };
    }
    try {
      const res = await search(key === Api.customer ? Api.user : key, {
        ...payload,
        limit: 100,
        page: 0,
      });
      setValues((prev) => ({
        ...prev,
        [key]: res.data,
      }));
    } catch (error) {
      console.error(`Search failed for ${key}:`, error);
    }
  };

  const getSuitableArtists = (
    artists: SearchType<User>[],
    service_id?: string,
  ) => {
    let result = artists;
    // 🟢 Service чадвартай artist
    if (service_id) {
      const serviceArtistIds = new Set(userService[service_id]);
      result = result.filter((a) => serviceArtistIds.has(a.id));
    }

    // 🟢 Сонгосон цагт боломжтой artist
    if (order_date && start_time && slots?.[order_date]) {
      const availableArtistIds = new Set(
        slots[order_date]
          .filter((s) => s.start_time.toString() === start_time)
          .map((s) => s.artist_id),
      );

      result = result.filter((a) => availableArtistIds.has(a.id));
    }

    return result;
  };
  const getSlots = async () => {
    const body = {
      branch_id: branchId,
      services: details?.map((s) => s.service_id),
      parallel: parallel,
    };
    const res = await find<Slot>(Api.order, body, "slots");
    const data: Record<string, Slot[]> = (res.data as unknown as Slot[]).reduce(
      (acc, item) => {
        const key = toYMD(new Date(item.date));

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push({ ...item, key });
        return acc;
      },
      {} as Record<string, Slot[]>,
    );

    setSlots(data);
  };
  const getArtists = async () => {
    const services = details?.map((d) => d.service_id) ?? [];
    if (!services || services.length == 0 || !branchId) return;

    const userServices = await create(
      Api.user_service,
      {
        branch_id: branchId,
        services: services,
      },
      "client",
    );
    // serviceId: artists
    const data: OrderSlot = userServices.data.payload;

    setUserService(data);
  };

  const { setClose, data } = useModal();
  const [allItems, setValues] = useState(items);
  const [artists, setArtists] = useState(allItems.user);
  const [services, setServices] = useState<ListType<Service>>({
    count: 0,
    items: [],
  });
  const [orderDuration, setDuration] = useState(undefined);
  const [userService, setUserService] = useState<OrderSlot>({});
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  const isEdit = Boolean(values?.id);
  const hasId = values?.id !== undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orderDateValue = form.getValues("order_date");
  const orderDate = orderDateValue ? new Date(orderDateValue) : null;

  if (orderDate) {
    orderDate.setHours(0, 0, 0, 0);
  }

  const isFuture = orderDate ? orderDate > today : false;

  const [isTimeSlotsEnabled, setTimeSlotsEnabled] = useState(() => {
    if (orderDate) {
      return isFuture;
    }
    if (isEdit || hasId) {
      return true;
    }
    return false;
  });

  const [loader, setLoader] = useState({
    [Api.service]: false,
  });

  const onSubmit: SubmitHandler<EventFormData> = (formData) => {
    const newEvent = {
      branch_id: formData.branch_id,
      details: formData.details,
      order_date: formData.order_date as string,
      start_time: formData.start_time,
      end_time: formData.end_time,
      duration: formData.duration,
      description: formData.description ?? undefined,
      customer_id: formData.customer_id,
      order_status: formData.order_status as OrderStatus | undefined,
      total_amount: formData.total_amount as number | undefined,
      paid_amount: +(formData.paid_amount ?? 0),
      pre_amount: +(formData.pre_amount ?? 0),
      edit: formData.edit ?? undefined,
      parallel: formData.parallel,
    } as IOrder;
    send(newEvent);

    setClose();
  };
  const onInvalid = async <T,>(e: T) => {
    const error = Object.entries(e as any)
      .map(([er, v], i) => {
        if (er == "details")
          return Object.values(v as any).map((a: any) => {
            return Object.values(a).map((b: any) => b.message);
          });
        if ((v as any)?.message) {
          return (v as any)?.message;
        }
        let value = VALUES[er];

        return i == 0 ? firstLetterUpper(value ?? "") : value;
      })
      .join(", ");

    showToast("info", error);
  };
  const updateDetail = (index: number, value: any, key?: keyof DetailType) => {
    const current = form.getValues("details") || [];
    // Хэрвээ detail байхгүй бол шинэ item нэмнэ
    if (!current[index]) {
      form.setValue("details", [...current, value]);
      return;
    }

    if (!key) {
      const updated = details.filter((_, i) => i != index) as any;
      form.setValue("details", updated);
      return;
    }

    const updated = current.map((item, i) =>
      i === index ? { ...item, [key]: value } : item,
    );

    form.setValue("details", updated);
  };
  const {
    branch_id: branchId,
    customer_id: customerId,
    details = [],
    parallel,
    paid_amount = 0,
    total_amount = 0,
    pre_amount = 0,
    order_date,
    start_time,
    duration,
  } = useWatch<EventFormData>({ control: form.control });
  const isDurationInitialized = useRef(false);
  console.log(details)

  useEffect(() => {
    if (!values || !values?.id || !services.items.length) return;

    const mappedDetails = values?.details?.map((v: any) => {
      const service = services.items.find((s) => s.id === v.service_id);
      return {
        id: v.id,
        service_id: service?.id ?? "",
        service_name: service?.name ?? "",
        duration: Number(service?.duration ?? 0),
        category_id: service?.category_id ?? "",
        description: v.description ?? "",
        price: v.price ?? 0,
        user_id: v.user?.id ?? v.user_id ?? "",
      };
    });

    form.reset({
      ...values,
      details: mappedDetails,
      edit: values.id,
    });
  }, [values, services.items]);
  useEffect(() => {
    if (!details.length) return;

    // ✅ Edit mode: анхны утгыг 1 удаа л хадгална
    if (isEdit && !isDurationInitialized.current) {
      isDurationInitialized.current = true;
      return;
    }

    const calculated = calculateDuration(details, parallel);
    getArtists();
    const current = Number(duration ?? 0);
    if (orderDuration != undefined) {
      return;
    }
    if (current != calculated) {
      form.setValue("duration", calculated, {
        shouldDirty: true,
        shouldTouch: false,
      });
    }
  }, [details, parallel, isEdit]);

  useEffect(() => {
    let cancelled = false;
    async function syncCustomer() {
      if (!customerId) return;

      // 1. Хэрвээ items дотор байхгүй бол API-аар ганцаараа авч нэмнэ
      const exists = allItems.customer.some((v) => v.id == customerId);

      if (!exists) {
        try {
          searchField(customerId as string, Api.customer, true);
        } catch (_) {}
      }
    }

    syncCustomer();

    return () => {
      cancelled = true;
    };
  }, [customerId]);
  useEffect(() => {
    if (branchId) {
      listField<Service>({
        api: Api.service,
        onChange: (data) => {
          setServices(data);
        },
        key: "branch_id",
        value: branchId as string,
      });
      getSlots();
    } else {
      setServices(ListDefault);
      return;
    }
  }, [branchId]);
  useEffect(() => {
    if (!values?.id) return;
    isDurationInitialized.current = false;

    form.reset({
      ...values,
      edit: values.id,
    });
  }, [values, data]);

  useEffect(() => {
    if (isTimeSlotsEnabled) {
    } else {
      setArtists(allItems.user);
    }
  }, [isTimeSlotsEnabled]);

  useEffect(() => {
    const serviceTotal = sumPrices(details);
    const total =
      serviceTotal == 0
        ? Number(pre_amount || 0) + Number(paid_amount || 0)
        : serviceTotal;
    const currentTotal = total_amount || 0;

    // 🔥 Loop-оос хамгаална
    if (currentTotal !== total) {
      form.setValue("total_amount", total, {
        shouldDirty: true,
        shouldTouch: false,
      });
    }
    if (total_amount != serviceTotal && serviceTotal != 0) {
      form.setValue("paid_amount", serviceTotal - +pre_amount, {
        shouldDirty: true,
        shouldTouch: false,
      });
    }
  }, [details, pre_amount]);
  useEffect(() => {
    if (!start_time || !duration) return;

    const endTime = addMinutes(start_time, Number(duration));
    form.setValue("end_time", endTime, {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [start_time, duration]);
  return (
    <form
      className="space-y-4 "
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
    >
      {values.created_by && (
        <div className="flex items-center border rounded-md px-4 justify-between py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LUser className="w-4 h-4 text-rose-500" />
            <span>Үүсгэсэн</span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <UserCircle className="w-4 h-4 text-gray-400" />
              <span>{usernameFormatter(values.created_by)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="w-4 h-4" />
              <span>{mobileFormatter(values.created_by.mobile)}</span>
            </div>
          </div>
        </div>
      )}
      <FormProvider {...form}>
        <div className="double-col">
          <div className="flex gap-4 items-start col-span-2">
            <FormItems
              control={form.control}
              name="customer_id"
              label="Хэрэглэгч"
              className=" flex-1"
            >
              {(field) => {
                return (
                  <ComboBox
                    search={(v) => {
                      if (v.length > 1) searchField(v, Api.customer);
                    }}
                    props={{ ...field }}
                    items={allItems.customer.map((item) => {
                      const [mobile, nickname] = item?.value?.split("__") ?? [
                        "",
                        "",
                        "",
                        "",
                      ];
                      const name = nickname == "null" ? "" : (nickname ?? "");
                      return {
                        value: item.id,
                        label: `${mobileFormatter(mobile)} ${name}`,
                      };
                    })}
                  />
                );
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="description"
              className="flex-1"
              label="Хэрэглэгчийн тайлбар"
            >
              {(field) => {
                let value = field.value;
                if (value == null) value = undefined;
                return (
                  <Textarea
                    onChange={field.onChange}
                    value={field.value as string}
                  />
                );
              }}
            </FormItems>
          </div>
          <FormItems control={form.control} name="branch_id" label="Салбар">
            {(field) => {
              return (
                <ComboBox
                  search={(e) => {
                    if (e.length > 1) searchField(e, Api.branch);
                  }}
                  props={{
                    ...field,
                  }}
                  items={allItems.branch.map((item) => {
                    const [name] = item.value?.split("__") ?? [""];
                    return {
                      value: item.id,
                      label: name,
                    };
                  })}
                />
              );
            }}
          </FormItems>
          <FormItems control={form.control} name="order_status" label="Статус">
            {(field) => {
              return (
                <ComboBox
                  props={{ ...field }}
                  items={getEnumValues(OrderStatus).map((item) => {
                    return {
                      value: item.toString(),
                      label: OrderStatusValues[item],
                    };
                  })}
                />
              );
            }}
          </FormItems>
        </div>
        <div className="border-t ">
          <p className="my-4">Төлбөр</p>
          <div className="double-col">
            <FormItems
              control={form.control}
              name="total_amount"
              label="Нийт төлбөр"
            >
              {(field) => {
                return (
                  <TextField
                    disabled={true}
                    type={INPUT_TYPE.MONEY}
                    props={{ ...field }}
                  />
                );
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="pre_amount"
              label="Урьдчилгаа төлбөр"
            >
              {(field) => {
                return (
                  <TextField
                    type={INPUT_TYPE.MONEY}
                    disabled={false}
                    props={{ ...field }}
                  />
                );
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="paid_amount"
              label="Гүйцээж төлсөн төлбөр"
            >
              {(field) => {
                return (
                  <TextField
                    disabled={true}
                    type={INPUT_TYPE.MONEY}
                    props={{ ...field }}
                  />
                );
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="method"
              label="Төлбөрийн хэлбэр"
            >
              {(field) => {
                field.value = field.value
                  ? +field.value?.toString().slice(0, 2)
                  : field.value;
                return (
                  <ComboBox
                    props={{ ...field }}
                    items={[
                      PaymentMethod.BANK,
                      PaymentMethod.CARD,
                      PaymentMethod.CASH,
                    ].map((item) => {
                      return {
                        value: item.toString(),
                        label: getMethodValue[item],
                      };
                    })}
                  />
                );
              }}
            </FormItems>
          </div>
        </div>

        <div className="border p-2 rounded-md">
          <p className="my-2 font-bold">Үйлчилгээ</p>
          <div className="grid grid-cols-2 gap-1 max-h-[220px] overflow-auto">
            {loader[Api.service] ? (
              <div className="flex col-span-2 py-4 items-center justify-center">
                <LoaderMini />
              </div>
            ) : (
              <>
                {services.count == 0 && (
                  <div className="flex justify-center col-span-2 py-4 m-2 rounded-md bg-primary/10 border border-primary/50">
                    <p className="text-sm">
                      Салбар сонгоогүй эсвэл салбарын үйлчилгээ байхгүй байна.
                    </p>
                  </div>
                )}
                {services.items
                  .sort((a, b) => {
                    if (a.index == null && b.index == null) return 0;
                    if (a.index == null) return 1; // a-г сүүлд
                    if (b.index == null) return -1; // b-г сүүлд
                    return a.index - b.index;
                  })
                  .map((service, i) => {
                    const selected = details?.findIndex(
                      (s) => s.service_id == service.id,
                    );

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between w-full cursor-pointer rounded-lg border p-3 transition-all
    ${
      selected !== undefined && selected != -1
        ? "bg-blue-50 border-blue-400"
        : "hover:bg-muted border-border"
    }`}
                        onClick={() => {
                          if (
                            (selected == undefined || selected == -1) &&
                            details?.length == 2
                          ) {
                            showToast(
                              "info",
                              "2-с олон үйлчилгээ сонгох боломжгүй",
                            );
                            return;
                          }
                          const categorySelected = details?.some(
                            (s) => s.category_id === service.category_id,
                          );
                          if (categorySelected && selected == -1) {
                            showToast(
                              "info",
                              "Өөр ангилалын үйлчилгээ сонгоно уу",
                            );
                            return;
                          }

                          updateDetail(selected, {
                            service_id: service.id,
                            service_name: service.name,
                            duration: service.duration,
                            category_id: service.category_id,
                            description: "",
                            price: 0,
                            user_id: "",
                          });
                        }}
                      >
                        <div>
                          <span className="block font-semibold block text-sm">
                            {service.index}.{service.name}
                          </span>
                        </div>

                        {service.meta?.name && (
                          <span className="text-xs  inline-flex py-0.5 px-2 bg-blue-100 text-muted-foreground px-1 rounded">
                            {service.meta.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>
        <div className="border-t ">
          <div className="flex justify-between items-center">
            <p className="my-4">Цагийн хуваарь</p>
            <div className="flex items-center justify-end gap-2 mt-2 max-w-lg w-full">
              <Switch
                checked={isTimeSlotsEnabled}
                onCheckedChange={(val) => setTimeSlotsEnabled(val)}
                id="compare-switch"
              />
              <label
                htmlFor="compare-switch"
                className="text-sm text-muted-foreground"
              >
                Цаг заавал мөрдөнө
              </label>
            </div>
          </div>
          <div className="double-col">
            <FormItems control={form.control} name="order_date" label="Огноо">
              {(field) => {
                // field.value = mnDateFormat((field.value as Date) ?? new Date());
                return (
                  <TextField type={INPUT_TYPE.DATE} props={{ ...field }} />
                );
              }}
            </FormItems>
            {details?.length > 0 && (
              <FormItems control={form.control} name="duration" label="Хугацаа">
                {(field) => {
                  return (
                    <TextField
                      type={INPUT_TYPE.NUMBER}
                      props={{
                        ...field,
                        onChange: (e) => {
                          field.onChange(e);
                          setDuration(e);
                        },
                      }}
                    />
                  );
                }}
              </FormItems>
            )}
            {((order_date && slots?.[order_date]) || !isTimeSlotsEnabled) && (
              <FormItems
                control={form.control}
                name="start_time"
                label="Эхлэх цаг"
              >
                {(field) => {
                  let slot =
                    isTimeSlotsEnabled && order_date ? slots?.[order_date] : [];
                  const artistIds = details
                    ?.map((d) => d.user_id)
                    .filter(Boolean);
                  if (artistIds?.length && isTimeSlotsEnabled) {
                    slot = slot.filter((s) => artistIds.includes(s.artist_id));
                  }

                  const availableSlots = isTimeSlotsEnabled
                    ? Array.from(new Set(slot.map((s) => s.start_time))).sort()
                    : allTimes.map((i) => toTimeString(i));
                  return (
                    <ComboBox
                      props={{ ...field }}
                      items={[...availableSlots].map((item) => {
                        return {
                          value: item?.toString(),
                          label: item.toString(),
                        };
                      })}
                    />
                  );
                }}
              </FormItems>
            )}

            {start_time && (
              <FormItems
                control={form.control}
                name="end_time"
                label="Дуусах цаг"
              >
                {(field) => <TextField props={{ ...field }} disabled={true} />}
              </FormItems>
            )}
          </div>
        </div>
        {(!order_date || !slots?.[order_date]) && isTimeSlotsEnabled && (
          <div className="flex justify-center col-span-2 py-4 m-2 rounded-md bg-primary/10 border border-primary/50">
            <p className="text-sm">Цаг байхгүй.</p>
          </div>
        )}
        {details?.length > 0 && (
          <div className="border-t">
            <div className="flex justify-between items-center">
              <p className="my-4">
                Үйлчилгээ{details.some((d) => d.category_id)}
              </p>

              {details.length == 2 &&
                details?.[0].category_id != details?.[1].category_id && (
                  <FormItems control={form.control} name="parallel" label="">
                    {(field) => {
                      return (
                        <div className="col-span-1 flex gap-2 cursor-pointer items-center ">
                          <Checkbox
                            id="parallel"
                            checked={field.value as boolean}
                            onCheckedChange={(e) => {
                              form.setValue("parallel", e as boolean);
                              updateDetail(0, undefined, "user_id");
                              updateDetail(1, undefined, "user_id");
                            }}
                            className="w-5 h-5"
                            aria-label="Select row"
                          />
                          <label
                            htmlFor="parallel"
                            className="flex items-center gap-2 font-semibold text-lg"
                          >
                            Давхар эсэх
                          </label>
                        </div>
                      );
                    }}
                  </FormItems>
                )}
            </div>
            <div>
              {details.map((detail, i) => {
                return (
                  <div key={i} className="border rounded-md px-3 py-3">
                    <p className="mb-3">{detail.service_name}</p>
                    <div className="grid gap-3">
                      <div className="px-2 py-3 bg-gray-100 border rounded-md">
                        <p className="text-md mb-2">Artist {i + 1}</p>
                        <div className="double-col">
                          <FormItem>
                            <FormLabel>Артист</FormLabel>
                            <ComboBox
                              className="max-w-xs"
                              items={(isTimeSlotsEnabled
                                ? getSuitableArtists(artists, detail.service_id)
                                : artists
                              ).map((b, i) => {
                                const [mobile, nickname, branch] =
                                  b?.value?.split("__") ?? ["", "", "", ""];
                                return {
                                  label: `${firstLetterUpper(
                                    nickname,
                                  )} ${mobileFormatter(mobile)}`,
                                  value: b.id,
                                };
                              })}
                              props={{
                                onChange: (v: string) => {
                                  if (parallel) {
                                    if (details.find((d) => d.user_id == v)) {
                                      toast.warning("Дахин сонгох боломжгүй ");
                                      form.setValue("parallel", false);
                                      return;
                                    } else {
                                      updateDetail(i, v, "user_id");
                                    }
                                  } else {
                                    updateDetail(0, v, "user_id");
                                    if (details.length == 2)
                                      updateDetail(1, v, "user_id");
                                  }
                                },
                                name: "",
                                onBlur: () => {},
                                ref: () => {},
                                value: detail?.user_id,
                              }}
                            />
                            {/* {message && <FormMessage />} */}
                          </FormItem>
                          <FormItem>
                            <FormLabel>Төлбөр</FormLabel>
                            <TextField
                              type={INPUT_TYPE.MONEY}
                              props={{
                                onChange: (v: string) => {
                                  const value = parseInt(v);
                                  updateDetail(
                                    i,
                                    isNaN(value) ? 0 : value,
                                    "price",
                                  );
                                },
                                name: "",
                                onBlur: () => {},
                                ref: () => {},
                                value: detail?.price ?? "",
                              }}
                            />
                          </FormItem>
                        </div>
                        <FormItem className="mt-2">
                          <FormLabel>Тайлбар</FormLabel>
                          <Textarea
                            onChange={(e) => {
                              updateDetail(i, e.target.value, "description");
                            }}
                            value={(detail.description as string) ?? ""}
                          />
                        </FormItem>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4 pt-2">
          <Button variant="outline" type="button" onClick={() => setClose()}>
            Буцах
          </Button>
          <Button type="submit" loading={loading}>
            Хадгалах
          </Button>
        </div>
      </FormProvider>
      {/* )} */}
    </form>
  );
}
