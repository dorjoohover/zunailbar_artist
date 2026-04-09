"use client";
import { DataTable } from "@/components/data-table";
import { IProductLog, Product, ProductLog } from "@/models";
import { useEffect, useMemo, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  getEnumValues,
  getValuesProductLogStatus,
  Option,
  VALUES,
  SearchType,
  ZValidator,
  zNumOpt,
  zStrOpt,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, search, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { TextField } from "@/shared/components/text.field";
import { fetcher } from "@/hooks/fetcher";
import { getColumns } from "./columns";
import { CategoryType, INPUT_TYPE, ProductLogStatus } from "@/lib/enum";
import { DatePicker } from "@/shared/components/date.picker";
import DynamicHeader from "@/components/dynamicHeader";
import {
  dateOnly,
  firstLetterUpper,
  objectCompact,
  parseDate,
  round,
  searchProductFormatter,
} from "@/lib/functions";
import { FilterPopover } from "@/components/layout/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/shared/components/showToast";

const formSchema = z
  .object({
    product_id: zStrOpt({
      allowNullable: false,
      label: "Бүтээгдэхүүн",
    }),

    quantity: zNumOpt({
      label: "Тоо ширхэг",
      allowNullable: false,
    }),
    price: zNumOpt({
      label: "Үнэ(Тухайн вальютаар)",
      allowNullable: false,
    }),
    currency: zStrOpt({
      allowNullable: false,
      label: "Ханш",
    }),
    total_amount: zNumOpt({
      label: "Нийт үнэ",
      allowNullable: false,
    }),
    unit_price: zNumOpt({
      label: "Нэгж үнэ",
      allowNullable: false,
    }),
    paid_amount: zNumOpt({
      label: "Төлсөн үнэ",
      allowNullable: false,
    }),
    cargo: zNumOpt({
      label: "Карго",
      allowNullable: false,
    }),
    currency_amount: zNumOpt({
      label: "Валютын ханш",
      allowNullable: false,
    }),
    edit: z.string().nullable().optional(),
    date: z.preprocess(
      (val) => (typeof val === "string" ? new Date(val) : val),
      z.date(),
    ) as unknown as Date,
  })
  .refine((data) => (data?.paid_amount ?? 0) <= (data?.total_amount ?? 0), {
    message: "Төлсөн дүн нийт дүнгээс хэтэрч болохгүй",
    path: ["paid_amount"], // алдаа paid_amount дээр харагдана
  });
const defaultValues = {
  currency: "cny",
  currency_amount: 500,
  product_id: "",
  cargo: 0,
  quantity: 0,
  total_amount: 0,
  paid_amount: 0,
  unit_price: 0,
  date: new Date(),
  product_log_status: ProductLogStatus.Bought,
};
type FilterType = {
  product?: string;
  status?: number;
  start?: Date;
  end?: Date;
};

type LogType = z.infer<typeof formSchema>;
export const ProductHistoryPage = ({
  data,
  products,
}: {
  data: ListType<ProductLog>;
  products: SearchType<Product>[];
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<LogType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [transactions, setTransactions] =
    useState<ListType<IProductLog> | null>(null);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.value])),
    [products],
  );

  const logFormatter = (data: ListType<ProductLog>) => {
    const items: IProductLog[] = data.items.map((item) => {
      const product = productMap.get(item.product_id);

      return {
        ...item,
        product_name: searchProductFormatter(product ?? "") ?? "",
      };
    });

    setTransactions({ items, count: data.count });
  };
  useEffect(() => {
    logFormatter(data);
  }, [data]);
  const deleteLog = async (index: number) => {
    const id = transactions!.items[index].id;
    const res = await deleteOne(Api.product_log, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IProductLog) => {
    setOpen(true);
    form.reset({
      ...e,
      price: e.price,
      quantity: e.quantity,
      currency_amount: e.currency_amount,
      cargo: e.cargo,
      total_amount: +e.total_amount,
      edit: e.id,
    });
  };
  const setStatus = async (index: number, status: number) => {
    if (transactions?.items != null) {
      await updateOne(Api.product_log, transactions?.items[index].id, {
        product_log_status: status,
      });
      refresh();
    }
  };
  const columns = getColumns(edit, deleteLog, setStatus);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort, filter: searchValue } = pg;
    const product_id = filter?.product;
    const product_log_status = filter?.status;
    const start_date = filter?.start ? dateOnly(filter?.start) : undefined;
    const end_date = filter?.end ? dateOnly(filter?.end) : undefined;
    await fetcher<ProductLog>(Api.product_log, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      product_id,
      product_log_status,
      start_date,
      end_date,
      ...(searchValue && { name: searchValue }),
    }).then((d) => {
      logFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as LogType;
    let { edit, cargo, ...payload } = body;
    payload = {
      ...payload,
      price: round(+(payload.price ?? 0)),
      unit_price: round(+(payload.unit_price ?? 0)),
      total_amount: round(+(payload.total_amount ?? 0)),
    };

    const res = edit
      ? await updateOne<IProductLog>(Api.product_log, edit ?? "", {
          ...payload,
          cargo,
        } as unknown as IProductLog)
      : await create<IProductLog>(Api.product_log, {
          ...payload,
          cargo,
        } as unknown as IProductLog);
    if (res.success) {
      refresh();
      setOpen(false);
      form.reset(defaultValues);
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
  const qty = form.watch("quantity") ?? 0;
  const price = form.watch("price") ?? 0;
  const currency = form.watch("currency_amount") ?? 0;
  const cargo = form.watch("cargo") ?? 0;

  useEffect(() => {
    const unit_price = round((Number(price) || 0) * +(currency ?? 1));
    let total = (Number(qty) || 0) * unit_price + +(cargo ?? 0);
    const paid = +(form.getValues("paid_amount") ?? 0);
    if (Math.abs(paid - total) < 100) total = paid;
    form.setValue("total_amount", total, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("unit_price", unit_price, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [qty, price, form, currency, cargo]);

  const [filter, setFilter] = useState<FilterType>();
  const changeFilter = (key: string, value: number | string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    refresh(
      objectCompact({
        product_id: filter?.product,
        product_log_status: filter?.status,
        start_date: filter?.start ? dateOnly(filter?.start) : undefined,
        end_date: filter?.end ? dateOnly(filter?.end) : undefined,

        page: 0,
      }),
    );
  }, [filter]);
  const groups: { key: keyof FilterType; label: string; items: Option[] }[] =
    useMemo(
      () => [
        {
          key: "product",
          label: "Бүтээгдэхүүн",
          items: products.map((b) => ({
            value: b.id,
            label: searchProductFormatter(b.value),
          })),
        },

        {
          key: "status",
          label: "Статус",
          items: getEnumValues(ProductLogStatus).map((s) => ({
            value: s,
            label: getValuesProductLogStatus[s].name,
          })),
        },
      ],
      [products],
    );
  const [items, setItems] = useState({
    [Api.product]: products,
  });
  const searchField = async (v: string, key: Api, edit?: boolean) => {
    let value = "";
    if (v.length > 1) value = v;
    if (v.length == 1) return;

    const payload = { id: value, type: CategoryType.DEFAULT };

    await search(key as any, {
      ...payload,
      limit: 20,
      page: 0,
    }).then((d) => {
      console.log(key, d.data);
      setItems((prev) => ({
        ...prev,
        [key]: d.data,
      }));
    });
  };
  return (
    <div className="">
      <DynamicHeader count={transactions?.count} />

      <div className="admin-container">
        <DataTable
          clear={() => setFilter(undefined)}
          filter={
            <>
              {groups.map((item, i) => {
                const { key } = item;
                return (
                  <label key={i}>
                    <span className="filter-label">{item.label as string}</span>
                    <ComboBox
                      pl={item.label}
                      name={item.label}
                      className="max-w-36 text-xs!"
                      value={filter?.[key] ? String(filter[key]) : ""} //
                      items={item.items.map((it) => ({
                        value: String(it.value),
                        label: it.label as string,
                      }))}
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
              <FilterPopover
                content={
                  <div className="flex flex-col gap-2">
                    <Calendar
                      mode="single"
                      selected={filter?.start}
                      onSelect={(e) =>
                        setFilter((prev) => ({ ...prev, start: e }))
                      }
                    />
                  </div>
                }
                value={
                  filter?.start ? parseDate(filter.start, false) : undefined
                }
                label={"Эхлэх огноо"}
              />
              <FilterPopover
                content={
                  <div className="flex flex-col gap-2">
                    <Calendar
                      mode="single"
                      selected={filter?.end}
                      onSelect={(e) =>
                        setFilter((prev) => ({ ...prev, end: e }))
                      }
                    />
                  </div>
                }
                value={filter?.end ? parseDate(filter.end, false) : undefined}
                label={"Дуусах огноо"}
              />
            </>
          }
          columns={columns}
          count={transactions?.count}
          data={transactions?.items ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              // w="2xl"
              maw="xl"
              name="Худалдан авалт нэмэх"
              submit={() => form.handleSubmit(onSubmit, onInvalid)()}
              open={open == true}
              setOpen={(v) => {
                setOpen(v);
                form.reset(defaultValues);
              }}
              loading={action == ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="">
                  <FormItems
                    label="Бүтээгдэхүүн"
                    control={form.control}
                    name="product_id"
                  >
                    {(field) => {
                      return (
                        <ComboBox
                          search={(e) => searchField(e, Api.product)}
                          props={{ ...field }}
                          items={items[Api.product].map((item) => {
                            return {
                              value: item.id,
                              label: searchProductFormatter(item.value),
                            };
                          })}
                        />
                      );
                    }}
                  </FormItems>
                  <div className="divide-x-gray"></div>

                  <div className="double-col">
                    <div className="relative">
                      <FormItems
                        label="Currency Value"
                        control={form.control}
                        name="currency_amount"
                      >
                        {(field) => {
                          return (
                            <div className="relative">
                              <div className="relative h-10">
                                <Input
                                  onChange={(e) => field.onChange(e)}
                                  value={field.value as string | undefined}
                                  type="text"
                                  className="h-full pr-10"
                                />
                              </div>
                            </div>
                          );
                        }}
                      </FormItems>
                      <FormItems
                        control={form.control}
                        name="currency"
                        className="absolute bottom-0.5 right-0.5"
                      >
                        {(field) => {
                          return (
                            <Select
                              value={field.value as string | undefined}
                              onValueChange={(e) => field.onChange(e)}
                            >
                              <SelectTrigger className="text-xs font-semibold border-0">
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="cny" defaultChecked={true}>
                                    CNY
                                  </SelectItem>
                                  <SelectItem value="mnt">MNT</SelectItem>
                                  <SelectItem value="krw">KRW</SelectItem>
                                  <SelectItem value="usd">USD</SelectItem>
                                  <SelectItem value="eur">EUR</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          );
                        }}
                      </FormItems>
                    </div>

                    {[
                      {
                        key: "cargo",
                        type: INPUT_TYPE.MONEY,
                        label: "Kargo",
                      },
                      {
                        key: "quantity",
                        type: INPUT_TYPE.NUMBER,
                        label: "Тоо ширхэг",
                      },

                      {
                        key: "price",
                        type: INPUT_TYPE.NUMBER,
                        label: "Үнэ (Тухайн вальютаар)",
                      },
                      {
                        key: "unit_price",
                        type: INPUT_TYPE.MONEY,
                        label: "Нэгжийн үнэ",
                      },
                      {
                        key: "total_amount",
                        type: INPUT_TYPE.MONEY,
                        label: "Нийт дүн",
                      },
                      {
                        key: "paid_amount",
                        type: INPUT_TYPE.MONEY,
                        label: "Төлсөн дүн",
                      },
                    ].map((item, i) => {
                      const name = item.key as keyof LogType;
                      const label = item.label as keyof LogType;
                      return (
                        <FormItems
                          control={form.control}
                          name={name}
                          key={i}
                          label={label}
                          className={item.key === "name" ? "col-span-2" : ""}
                        >
                          {(field) => {
                            return (
                              <TextField
                                props={{ ...field }}
                                type={item.type}
                              />
                            );
                          }}
                        </FormItems>
                      );
                    })}
                    <div className="">
                      <FormItems
                        label="Огноо"
                        control={form.control}
                        name="date"
                      >
                        {(field) => {
                          return (
                            <DatePicker
                              mode="single"
                              value={field.value as any}
                              onChange={(date) => field.onChange(date)}
                            />
                          );
                        }}
                      </FormItems>
                    </div>
                  </div>
                  <div className="divide-x-gray"></div>
                </div>
              </FormProvider>
            </Modal>
          }
        />
      </div>
    </div>
  );
};
