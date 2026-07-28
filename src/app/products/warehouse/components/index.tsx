"use client";
import { DataTable } from "@/components/data-table";
import {
  Product,
  ProductWarehouse,
  Warehouse,
  IProductWarehouse,
  IProductsWarehouse,
} from "@/models";
import { useEffect, useMemo, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  SearchType,
  Option,
  VALUES,
  ErrorMessage,
  ErrorToast,
  ZValidator,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, excel, search, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { fetcher } from "@/hooks/fetcher";
import { getColumns } from "./columns";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import {
  checkEmpty,
  dateOnly,
  firstLetterUpper,
  mnDate,
  objectCompact,
  parseDate,
} from "@/lib/functions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import DynamicHeader from "@/components/dynamicHeader";
import { FilterPopover } from "@/components/layout/popover";
import { Calendar } from "@/components/ui/calendar";
import { showToast } from "@/shared/components/showToast";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
const productItemSchema = z.object({
  quantity: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().nullable(),
  ) as unknown as number,
  product_id: z.string().min(1, "Бүтээгдэхүүн заавал сонгоно").nullable(),
});

const formSchema = z.object({
  warehouse_id: ZValidator.warehouse,
  products: z
    .array(productItemSchema)
    .min(1, "Хамгийн багадаа 1 бүтээгдэхүүн нэмнэ"),
  edit: z.string().nullable().optional(),
});
const defaultValues = {
  warehouse_id: "",
  products: [],
  edit: undefined,
};
type FilterType = {
  warehouse?: string;
  product?: string;
  start?: Date;
  end?: Date;
};
type ProductWarehouseType = z.infer<typeof formSchema>;
export const ProductWarehousePage = ({
  data,
  warehouses,
  productData,
}: {
  data: ListType<ProductWarehouse>;
  warehouses: ListType<Warehouse>;
  productData: ListType<Product>;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<ProductWarehouseType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [productWarehouse, setProductWarehouse] =
    useState<ListType<IProductWarehouse> | null>(null);
  const warehouseMap = useMemo(
    () => new Map(warehouses.items.map((p) => [p.id, p])),
    [warehouses.items],
  );

  const productWarehouseFormatter = (data: ListType<IProductWarehouse>) => {
    const items: IProductWarehouse[] = data.items.map((item) => {
      const warehouse = warehouseMap.get(item.warehouse_id);
      return {
        ...item,
        warehouse_name: warehouse?.name ?? "",
      };
    });

    setProductWarehouse({ items, count: data.count });
  };

  const [products, setProducts] = useState<SearchType<number>[]>([]);
  const warehouse_id = form.watch("warehouse_id");
  useEffect(() => {
    productWarehouseFormatter(data);
  }, [data]);

  // useEffect(() => {
  //   const ps = products.map((product) => {
  //     const [brand, category, name, quantity] =
  //                           product.value.split("__");
  //     quantity
  //   })
  //   setProducts()

  // }, [warehouse_id]);

  const deleteLog = async (index: number) => {
    const id = productWarehouse!.items[index].id;
    const res = await deleteOne(Api.product_warehouse, id);
    refresh();
    return res.success;
  };

  const edit = async (e: IProductWarehouse) => {
    setOpen(true);

    form.reset({ edit: e.id, products: [e], warehouse_id: e.warehouse_id });
  };

  const columns = getColumns(edit, deleteLog);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort, filter: searchValue } = pg;
    const warehouse_id = filter?.warehouse;
    const product_id = filter?.product;
    const start_date = filter?.start ? dateOnly(filter?.start) : undefined;
    const end_date = filter?.end ? dateOnly(filter?.end) : undefined;
    await fetcher<IProductWarehouse>(Api.product_warehouse, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      warehouse_id,
      product_id,
      start_date,
      end_date,
      ...(searchValue && { name: searchValue }),
    }).then((d) => {
      productWarehouseFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };

  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as ProductWarehouseType;
    const { edit, ...payload } = body;

    const res = edit
      ? await updateOne<IProductsWarehouse>(
          Api.product_warehouse,
          edit ?? "",
          payload as IProductsWarehouse,
        )
      : await create<IProductsWarehouse>(
          Api.product_warehouse,
          e as IProductsWarehouse,
        );
    if (res.success) {
      refresh();
      setOpen(false);
      form.reset(defaultValues);
      showToast(
        "success",
        edit ? "Мэдээлэл шинэчлэгдлээ!" : "Амжилттай нэмлээ!",
      );
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

  const searchProduct = async (name = "") => {
    const result = await search<number>(Api.product_warehouse, {
      id: name,
      warehouse_id: warehouse_id,
    });
    setProducts(result.data);
  };

  useEffect(() => {
    searchProduct();
  }, [warehouse_id]);

  const { fields, append, replace } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const handleProductClickOnce = (productId: string, quantity: number) => {
    const existing = form.getValues("products");

    const alreadyExists = existing?.some((p) => p.product_id === productId);

    if (!alreadyExists && quantity > 0) {
      append({
        product_id: productId,
        quantity: 1,
      });
    }
  };

  const handleProductQuantityChange = (
    productId: string,
    change: number,
    qty: number,
  ) => {
    const products = form.getValues("products");
    const index = products.findIndex((p) => p.product_id === productId);
    if (index !== -1) {
      const updated = [...products];
      const currentQty = (updated[index].quantity as number) ?? 0;
      const newQty = currentQty + change;

      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        qty >= newQty
          ? (updated[index] = {
              ...updated[index],
              quantity: newQty,
            })
          : ErrorToast("STOCK_INSUFFICIENT");
      }

      form.setValue("products", updated);
    } else {
      if (change > 0 && qty >= change) {
        append({
          product_id: productId,
          quantity: change,
        });
      } else {
        console.log(change, qty);
        ErrorToast("STOCK_INSUFFICIENT");
      }
    }
  };

  const [filter, setFilter] = useState<FilterType>();
  const [searchState, setSearchState] = useState<
    Partial<Record<keyof FilterType, string>>
  >({});
  const changeFilter = (key: string, value: number | string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      refresh(
        objectCompact({
          warehouse_id: filter?.warehouse,
          product_id: filter?.product,
          start_date: filter?.start ? dateOnly(filter.start) : undefined,
          end_date: filter?.end ? dateOnly(filter.end) : undefined,
          page: 0,
        }),
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [filter]);
  const toKey = (id: number | string) => String(id);
  const qtyByProduct = useMemo(() => {
    const m = new Map<string, number>();
    const items = productWarehouse?.items ?? [];
    for (const w of items) {
      const pid =
        (w as any).product_id ?? (w as any).productId ?? (w as any).id;
      m.set(toKey(pid), Number((w as any).quantity) || 0);
    }
    return m;
  }, [productWarehouse?.items]);
  type ProductWithQty = SearchType<number> & { quantity?: number };

  const groups: {
    key: keyof FilterType;
    label: string;
    items: Option[];
    search?: boolean;
  }[] = useMemo(
    () => [
      {
        key: "warehouse",
        label: "Агуулах",
        items: warehouses.items.map((b) => ({ value: b.id, label: b.name })),
      },

      {
        key: "product",
        label: "Бүтээгдэхүүн",
        search: true,
        items: productData.items.map((b) => ({ value: b.id, label: b.name })),
      },
    ],
    [productData.items, warehouses.items],
  );

  const downloadExcel = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const res = await excel(Api.product_warehouse, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? -1,
      sort: sort ?? DEFAULT_PG.sort,
      ...pg,
    });
    if (res.success && res.data) {
      const blob = new Blob([res.data], { type: "application/xlsx" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `product_warehouse_${mnDate().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      showToast("error", res.message);
    }
    console.log(res);
    setAction(ACTION.DEFAULT);
  };

  const [tab, setTab] = useState("1");

  return (
    <div className="">
      <DynamicHeader count={productWarehouse?.count} />

      <div className="admin-container py-2">
        {/* <div className="flex bg-white shadow-light border-light rounded-lg px-4">
          <Button
            variant="ghost"
            className={cn(
              "w-fit rounded-none hover:bg-white py-6 md:px-14 flex-1 md:flex-0",
              tab === "1" && "border-b-2 border-brand "
            )}
            onClick={() => setTab("1")}
          >
            Агуулах
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-fit rounded-none hover:bg-white py-6 md:px-14 flex-1 md:flex-0",
              tab === "2" && "border-b-2 border-brand"
            )}
            onClick={() => setTab("2")}
          >
            Агуулах дэлгэрэнгүй
          </Button>
        </div> */}
        {tab === "1" && (
          <DataTable
            clear={() => setFilter(undefined)}
            filter={
              <>
                {groups.map((item, i) => {
                  const { key } = item;
                  const filteredItems = item.search
                    ? item.items.filter((it) =>
                        it.label
                          .toLowerCase()
                          .includes((searchState[key] || "").toLowerCase()),
                      )
                    : item.items;
                  return (
                    <label key={i}>
                      <span className="filter-label">
                        {item.label as string}
                      </span>
                      <ComboBox
                        search={
                          item.search
                            ? (searchValue: string) => {
                                setSearchState((prev) => ({
                                  ...prev,
                                  [key]: searchValue,
                                }));
                              }
                            : undefined
                        }
                        pl={item.label}
                        className="max-w-36 text-xs!"
                        value={filter?.[key] ? String(filter[key]) : ""}
                        items={filteredItems.map((it) => ({
                          value: String(it.value),
                          label: it.label,
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
                  value={filter?.start ? parseDate(filter.start, false) : undefined}
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
            count={productWarehouse?.count}
            data={productWarehouse?.items ?? []}
            refresh={refresh}
            loading={action == ACTION.RUNNING}
            modalAdd={
              <Modal
                name={"Бараа нэмэх"}
                title="Агуулахад бараа нэмэх"
                submit={() => form.handleSubmit(onSubmit, onInvalid)()}
                open={open == true}
                maw="6xl"
                setOpen={(v) => {
                  setOpen(v);
                  form.reset(defaultValues);
                }}
                loading={action == ACTION.RUNNING}
              >
                <FormProvider {...form}>
                  <div className="space-y-3">
                    <div className="double-col">
                      <div className="space-y-1">
                        <Label htmlFor="" className="text-sm font-semibold">
                          Хайх
                        </Label>
                        <Input
                          placeholder="Бүтээгдэхүүн хайх..."
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length >= 2) searchProduct(value);
                            else searchProduct("");
                          }}
                          className="w-full h-10 bg-white"
                        />
                      </div>
                      <FormItems
                        label="Агуулах"
                        control={form.control}
                        name="warehouse_id"
                        className=""
                      >
                        {(field) => {
                          return (
                            <ComboBox
                              props={{ ...field }}
                              items={warehouses.items.map((item) => {
                                return {
                                  value: item.id,
                                  label: item.name,
                                };
                              })}
                            />
                          );
                        }}
                      </FormItems>
                    </div>
                    <div className="space-y-2 border rounded-lg overflow-hidden">
                      <ScrollArea className="bg-white h-[50vh] max-w-[calc(100vw-4.5rem)] w-full relative">
                        <div className="sticky top-0 left-0 grid items-center justify-between w-full p-4 bg-white text-sm font-bold grid-cols-20 shadow-light border-b">
                          <span className="col-span-1">№</span>
                          <span className="col-span-3">Бренд</span>
                          <span className="col-span-4">Төрөл</span>
                          <span className="col-span-6">Бараа</span>
                          <span className="col-span-1">Тоо</span>
                          <span className="col-span-5 text-center">Үйлдэл</span>
                        </div>
                        {products.map((product, index) => {
                          const [brand, category, name, quantity] =
                            product.value.split("__");
                          if (+quantity > 0)
                            return (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-3 pr-6 border-b last:border-b-0 flex-nowrap"
                              >
                                <div className="grid items-center justify-between w-full gap-4 grid-cols-20 min-w-[800px]">
                                  <span className="col-span-1 text-xs font-medium text-gray-700 truncate text-start">
                                    {index + 1}
                                  </span>
                                  <span className="col-span-3 text-xs font-medium text-gray-700 truncate text-start">
                                    {checkEmpty(brand)}
                                  </span>
                                  <span className="col-span-4 text-xs font-medium text-gray-700 truncate">
                                    {checkEmpty(category)}
                                  </span>
                                  <span className="col-span-6 text-xs font-semibold text-brand-purple">
                                    {checkEmpty(name)}
                                  </span>
                                  <span className="col-span-1 text-xs font-medium text-gray-700">
                                    {quantity}
                                  </span>
                                  <div className="flex items-center justify-end col-span-5 gap-1">
                                    <Button
                                      variant="purple"
                                      className="hover:scale-105"
                                      size="icon"
                                      onClick={() =>
                                        handleProductQuantityChange(
                                          product.id,
                                          -1,
                                          +quantity,
                                        )
                                      }
                                    >
                                      −
                                    </Button>
                                    <Input
                                      type="number"
                                      className="w-16 text-center bg-gray-200 no-spinner hide-number-arrows border-none focus-visible:border-ring text-xs"
                                      max={quantity}
                                      value={String(
                                        Number(
                                          form
                                            .watch("products")
                                            ?.find(
                                              (p) =>
                                                p.product_id === product.id,
                                            )?.quantity ??
                                            product.quantity ??
                                            0,
                                        ),
                                      )}
                                      onClick={() =>
                                        handleProductClickOnce(
                                          product.id,
                                          +quantity,
                                        )
                                      }
                                      onChange={(e) => {
                                        const val = parseInt(
                                          e.target.value || "0",
                                          10,
                                        );
                                        const existing =
                                          form.getValues("products");
                                        const index = existing.findIndex(
                                          (p) => p.product_id === product.id,
                                        );
                                        const updated = [...existing];
                                        if (val > +quantity) {
                                          ErrorToast("STOCK_INSUFFICIENT");

                                          return;
                                        }
                                        if (val <= 0 && index !== -1) {
                                          updated.splice(index, 1);
                                        } else if (index !== -1) {
                                          updated[index] = {
                                            ...updated[index],
                                            quantity: val,
                                          };
                                        } else if (val > 0) {
                                          updated.push({
                                            product_id: product.id,
                                            quantity: val,
                                          });
                                        }
                                        form.setValue("products", updated);
                                      }}
                                    />
                                    <Button
                                      variant="purple"
                                      className="hover:scale-105"
                                      size="icon"
                                      onClick={() =>
                                        handleProductQuantityChange(
                                          product.id,
                                          1,
                                          +quantity,
                                        )
                                      }
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                        })}
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  </div>
                </FormProvider>
              </Modal>
            }
          />
        )}

        {tab === "2" && <>tab 2 </>}
      </div>
    </div>
  );
};
