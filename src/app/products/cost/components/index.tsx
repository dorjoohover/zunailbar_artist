"use client";
import { DataTable } from "@/components/data-table";
import { Branch, Category, Cost, ICost, Product } from "@/models";
import { getColumns } from "./columns";
import { useEffect, useMemo, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  ListDefault,
  getEnumValues,
  getValuesCostStatus,
  Option,
  SearchType,
  VALUES,
  ZValidator,
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
import { CategoryType, CostStatus, INPUT_TYPE } from "@/lib/enum";
import {
  dateOnly,
  firstLetterUpper,
  mnDate,
  mnDateFormat,
  objectCompact,
  searchFormatter,
  searchProductFormatter,
} from "@/lib/functions";
import DynamicHeader from "@/components/dynamicHeader";
import { FilterPopover } from "@/components/layout/popover";
import { Calendar } from "@/components/ui/calendar";
import { showToast } from "@/shared/components/showToast";

const formSchema = z
  .object({
    category_id: z.string().nullable().optional(),
    branch_id: ZValidator.branch,
    product_id: ZValidator.product,
    date: z.preprocess(
      (val) => (typeof val === "string" ? new Date(val) : val),
      z.date()
    ) as unknown as Date,
    price: z.preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z.number()
    ) as unknown as number,
    paid_amount: z.preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z.number()
    ) as unknown as number,

    edit: z.string().nullable().optional(),
  })
  .refine((data) => (data?.paid_amount ?? 0) <= (data?.price ?? 0), {
    message: "Төлсөн дүн нийт дүнгээс хэтэрч болохгүй",
    path: ["paid_amount"], // алдаа paid_amount дээр харагдана
  });
const defaultValues = {
  category_id: "",
  branch_id: "",
  product_id: "",
  date: mnDateFormat(mnDate()),
  price: 0,
  paid_amount: 0,
  edit: undefined,
};
type CostType = z.infer<typeof formSchema>;
type FilterType = {
  category?: string;
  branch?: string;
  product?: string;
  start?: Date;
  end?: Date;
  status?: number;
};
export const CostPage = ({
  data,
  products,
  branches,
  categories,
}: {
  data: ListType<Cost>;
  products: SearchType<Product>[];
  branches: ListType<Branch>;
  categories: SearchType<Category>[];
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<CostType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [costs, setCosts] = useState<ListType<Cost>>(ListDefault);
  const productMap = useMemo(
    () => new Map(products.map((b) => [b.id, b.value])),
    [products]
  );
  const branchMap = useMemo(
    () => new Map(branches.items.map((b) => [b.id, b])),
    [branches.items]
  );

  const costFormatter = (data: ListType<Cost>) => {
    const items: Cost[] = data.items.map((item) => {
      const product = productMap.get(item.product_id);
      const branch = branchMap.get(item.branch_id);

      return {
        ...item,
        branch_name: branch?.name ?? "",
        product_name: searchProductFormatter(product ?? "") ?? "",
      };
    });

    setCosts({ items, count: data.count });
  };
  useEffect(() => {
    costFormatter(data);
  }, [data]);
  const deleteProduct = async (index: number) => {
    const id = costs?.items?.[index]?.id ?? "";
    const res = await deleteOne(Api.cost, id);
    refresh();
    return res.success;
  };
  const edit = async (e: ICost) => {
    setOpen(true);
    console.log(e);
    form.reset({ ...e, date: e.date?.toString().slice(0, 10), edit: e.id });
  };
  const columns = getColumns(edit, deleteProduct);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const branch_id = filter?.branch;
    const category_id = filter?.category;
    const product_id = filter?.product;
    const user_product_status = filter?.status;
    const start_date = filter?.start ? dateOnly(filter?.start) : undefined;
    const end_date = filter?.end ? dateOnly(filter?.end) : undefined;
    await fetcher<Cost>(Api.cost, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      name: pg.filter,
      branch_id,
      category_id,
      product_id,
      user_product_status,
      start_date,
      end_date,
      ...pg,
    }).then((d) => {
      costFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as CostType;
    const { edit, ...payload } = body;
    const res = edit
      ? await updateOne<ICost>(Api.cost, edit ?? "", payload as ICost)
      : await create<ICost>(Api.cost, e as ICost);
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
  const [filter, setFilter] = useState<FilterType>();
  const changeFilter = (key: string, value: number | string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    refresh(
      objectCompact({
        branch_id: filter?.branch,
        category_id: filter?.category,
        product_id: filter?.product,
        user_product_status: filter?.status,
        start_date: filter?.start ? dateOnly(filter?.start) : undefined,
        end_date: filter?.end ? dateOnly(filter?.end) : undefined,
        page: 0,
      })
    );
  }, [filter]);
  const groups: { key: keyof FilterType; label: string; items: Option[] }[] =
    useMemo(
      () => [
        {
          key: "branch",
          label: "Салбар",
          items: branches.items.map((b) => ({ value: b.id, label: b.name })),
        },
        {
          key: "category",
          label: "Ангилал",
          items: categories.map((b) => ({
            value: b.id,
            label: searchFormatter(b.value),
          })),
        },

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
          items: getEnumValues(CostStatus).map((s) => ({
            value: s,
            label: getValuesCostStatus[s].name,
          })),
        },
      ],
      [branches.items, categories, products]
    );

  const [items, setItems] = useState({
    [Api.product]: products,
    [Api.category]: categories,
  });
  const searchField = async (v: string, key: Api, edit?: boolean) => {
    let value = "";
    if (v.length > 1) value = v;
    if (v.length == 1) return;

    const payload =
      key === Api.product
        ? { id: value, type: CategoryType.COST }
        : {
            id: value,
          };

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
      <DynamicHeader count={costs?.count} />

      <div className="admin-container">
        <DataTable
          clear={() => setFilter(undefined)}
          filter={
            <>
              {groups.map((item, i) => {
                const { key } = item;
                return (
                  // <FilterPopover
                  // key={i}
                  //   content={item.items.map((it, index) => (
                  //     <label
                  //       key={index}
                  //       className="checkbox-label"
                  //     >
                  //       <Checkbox
                  //         checked={filter?.[key] == it.value}
                  //         onCheckedChange={() => changeFilter(key, it.value)}
                  //       />
                  //       <span>{it.label as string}</span>
                  //     </label>
                  //   ))}
                  //   value={
                  //     filter?.[key]
                  //       ? item.items.filter(
                  //           (item) => item.value == filter[key]
                  //         )[0].label
                  //       : undefined
                  //   }
                  //   label={item.label}
                  // />
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
                value={filter?.start?.toString()}
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
                value={filter?.end?.toString()}
                label={"Дуусах огноо"}
              />
            </>
          }
          columns={columns}
          count={costs?.count}
          data={costs?.items ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              maw="md"
              name="Зардал нэмэх"
              submit={() => form.handleSubmit(onSubmit, onInvalid)()}
              open={open == true}
              setOpen={(v) => {
                setOpen(v);
                form.reset(defaultValues);
              }}
              loading={action == ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="divide-y">
                  <div className="pb-5 space-y-4">
                    <FormItems
                      control={form.control}
                      name="product_id"
                      label="Зардал"
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            search={(e) => searchField(e, Api.product)}
                            props={{ ...field }}
                            items={items[Api.product].map((item) => {
                              return {
                                value: item.id,
                                label: item.value?.split("__")?.[2],
                              };
                            })}
                          />
                        );
                      }}
                    </FormItems>
                    <FormItems
                      control={form.control}
                      name="branch_id"
                      label="Салбар"
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            props={{ ...field }}
                            items={branches.items.map((item) => {
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

                  <div className="pt-5 space-y-4">
                    {[
                      {
                        key: "price",
                        label: "Нийт төлбөр",
                        type: INPUT_TYPE.MONEY,
                      },
                      {
                        key: "paid_amount",
                        label: "Төлсөн төлбөр",
                        type: INPUT_TYPE.MONEY,
                      },
                      {
                        key: "date",
                        label: "Огноо",
                        type: INPUT_TYPE.DATE,
                      },
                    ].map((item, i) => {
                      const name = item.key as keyof CostType;
                      const label = item.label as keyof CostType;
                      return (
                        <FormItems
                          control={form.control}
                          name={name}
                          key={i}
                          className={item.key === "name" ? "col-span-2" : ""}
                        >
                          {(field) => {
                            return (
                              <TextField
                                props={{ ...field }}
                                label={label}
                                type={item.type}
                              />
                            );
                          }}
                        </FormItems>
                      );
                    })}
                  </div>
                </div>
              </FormProvider>
            </Modal>
          }
        />
      </div>
    </div>
  );
};
