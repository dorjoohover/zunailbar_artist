"use client";;
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { useModal } from "@/providers/modal-context";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EventFormData, eventSchema } from "@/types/index";
import { useScheduler } from "@/providers/schedular-provider";
import { Branch, IOrder, Service, User } from "@/models";
import { OrderStatus, ROLE } from "@/lib/enum";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import {
  getEnumValues,
  OrderStatusValues,
  SearchType,
  VALUES,
} from "@/lib/constants";
import {
  firstLetterUpper,
  mnDateFormat,
  mobileFormatter,
  numberArray,
  totalHours,
  toTimeString,
} from "@/lib/functions";
import { TextField } from "@/shared/components/text.field";
import { showToast } from "@/shared/components/showToast";
import { Api } from "@/utils/api";
import { search } from "@/app/(api)";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
const defaultValues = {
  branch_id: "",
  user_id: "",
  customer_desc: "",
  details: [],
  order_date: mnDateFormat(new Date()),
  start_time: "",
  edit: undefined,
  order_status: OrderStatus.Pending,
  total_amount: 0,
  pre_amount: 0,
  paid_amount: 0,
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
    service: SearchType<Service>[];
  };
  loading?: boolean;
  send: (order: IOrder) => void;
  values?: IOrder | any;
  // CustomAddEventModal?: React.FC<{ register: any; errors: any }>;
}) {
  const { setClose, data } = useModal();

  const typedData = data as { default: IOrder };

  const { handlers } = useScheduler();
  const [allItems, setValues] = useState(items);

  const searchField = async (v: string, key: Api, edit?: boolean) => {
    if (edit && key === Api.customer) {
      form.setValue("customer_id", values?.customer_id);
    }

    const value = v;
    const details = form.watch("details") || [];
    const branchId = form.watch("branch_id");

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
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: values ?? defaultValues,
  });

  useEffect(() => {
    const value = form.watch("branch_id");
    if (value) {
      form.setValue("details", []);
      searchField("", Api.user);
      searchField("", Api.service);
    }
  }, [form.watch("branch_id")]);
  // Reset the form on initialization
  useEffect(() => {
    if (values) {
      form.reset({
        ...values,
        edit: values.id,
      });
    }
  }, [data, form.reset, values]);

  const onSubmit: SubmitHandler<EventFormData> = (formData) => {
    const st = formData.start_time?.slice(0, 2);

    const newEvent: IOrder = {
      branch_id: formData.branch_id,
      details: formData.details,
      order_date: formData.order_date as string,
      start_time: st,
      description: formData.description ?? undefined,
      customer_id: formData.customer_id,
      order_status: formData.order_status as OrderStatus | undefined,
      total_amount: formData.total_amount as number | undefined,
      paid_amount: +(formData.paid_amount ?? 0),
      pre_amount: +(formData.pre_amount ?? 0),
      edit: formData.edit ?? undefined,
    };
    send(newEvent);

    setClose();
  };
  const onInvalid = async <T,>(e: T) => {
    const error = Object.entries(e as any)
      .map(([er, v], i) => {
        if ((v as any)?.message) {
          return (v as any)?.message;
        }
        const value = VALUES[er];
        console.log(er, v);
        return i == 0 ? firstLetterUpper(value ?? "") : value;
      })
      .join(", ");
    showToast("info", error);
  };
  const details = form.watch("details");
  type DetailType = {
    service_id: string;
    service_name: string;
    duration: unknown;
    description?: string | null | undefined;
    price?: number | null | undefined;
    user_id?: string | null | undefined;
  };
  const updateDetail = (index: number, value: any, key?: keyof DetailType) => {
    const current = form.getValues("details") || [];

    // Хэрвээ detail байхгүй бол шинэ item нэмнэ
    if (!current[index]) {
      form.setValue("details", [...current, value]);
      return;
    }

    if (!key) {
      const updated = details.filter((_, i) => i != index);
      form.setValue("details", updated);
      return;
    }

    const updated = current.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );

    form.setValue("details", updated);
  };

  return (
    <form
      className="space-y-4 "
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
    >
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
                      return {
                        value: item.id,
                        label: `${mobileFormatter(mobile)} ${nickname}`,
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
                  props={{ ...field }}
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
                return <TextField type="money" props={{ ...field }} />;
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="pre_amount"
              label="Урьдчилгаа төлбөр"
            >
              {(field) => {
                return <TextField type="money" props={{ ...field }} />;
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="paid_amount"
              label="Гүйцээж төлсөн төлбөр"
            >
              {(field) => {
                return <TextField type="money" props={{ ...field }} />;
              }}
            </FormItems>
          </div>
        </div>
        <div className="border-t ">
          <p className="my-4">Цагийн хуваарь</p>
          <div className="double-col">
            <FormItems control={form.control} name="order_date" label="Огноо">
              {(field) => {
                // field.value = mnDateFormat((field.value as Date) ?? new Date());
                return <TextField type="date" props={{ ...field }} />;
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="start_time"
              label="Эхлэх цаг"
            >
              {(field) => {
                field.value = field.value
                  ? +field.value?.toString().slice(0, 2)
                  : field.value;
                return (
                  <ComboBox
                    props={{ ...field }}
                    items={numberArray(totalHours).map((item) => {
                      const value = item + 6;

                      return {
                        value: value.toString(),
                        label: toTimeString(value),
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
            {allItems.service.map((service, i) => {
              const [name, duration] = service.value?.split("__") ?? [""];
              const selected = details?.findIndex(
                (s) => s.service_id == service.id
              );
              return (
                <div key={i} className="col-span-1 flex gap-2 items-center ">
                  <Checkbox
                    checked={details?.some((d) => d.service_id === service.id)}
                    id={service.id}
                    onCheckedChange={() => {
                      updateDetail(selected, {
                        service_id: service.id,
                        service_name: name,
                        duration: duration ? +duration : 0,
                        description: "",
                        price: 0,
                        user_id: "",
                      });
                    }}
                    aria-label="Select row"
                  />
                  <Label htmlFor={service.id} className="font-[600]">
                    {name}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
        {details?.length > 0 && (
          <div className="border-t">
            <p className="my-4">Үйлчилгээ</p>
            <div>
              {details?.map((detail, i) => {
                const users = allItems.user;
                const user = users.filter((u) => detail?.user_id == u.id)?.[0];
                const [mobile, nickname] = user?.value?.split("__") ?? [
                  "",
                  "",
                  "",
                  "",
                ];
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
                              items={users.map((b, i) => {
                                const [mobile, nickname] = b?.value?.split(
                                  "__"
                                ) ?? ["", "", "", ""];
                                return {
                                  label: `${firstLetterUpper(
                                    nickname
                                  )} ${mobileFormatter(mobile)}`,
                                  value: b.id,
                                };
                              })}
                              props={{
                                onChange: (v: string) => {
                                  console.log(details, v);
                                  updateDetail(i, v, "user_id");
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
                              type={"money"}
                              props={{
                                onChange: (v: string) => {
                                  const value = parseInt(v);
                                  updateDetail(
                                    i,
                                    isNaN(value) ? 0 : value,
                                    "price"
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
                            value={detail.description ?? ""}
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
