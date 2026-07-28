"use client";
import { DataTable } from "@/components/data-table";
import { Brand, Category, IProduct, Product } from "@/models";
import { getColumns } from "./columns";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  Option,
  SearchType,
  VALUES,
  zStrOpt,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, excel, search, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { TextField } from "@/shared/components/text.field";
import { fetcher } from "@/hooks/fetcher";
import { CategoryType } from "@/lib/enum";
import { showToast } from "@/shared/components/showToast";
import DynamicHeader from "@/components/dynamicHeader";
import { firstLetterUpper, mnDate, objectCompact } from "@/lib/functions";

const formSchema = z.object({
  brand_id: zStrOpt({
    label: "Бранд",
  }),
  category_id: zStrOpt({
    allowNullable: false,
    label: "Ангилал",
  }),
  name: zStrOpt({
    allowNullable: false,
    label: "Нэр",
  }),

  edit: z.string().nullable().optional(),
});

type FilterType = {
  brand?: string;
  category?: string;
};
type ProductType = z.infer<typeof formSchema>;
const defaultValues = {
  edit: undefined,
  branch_id: "",
  category_id: "",
  name: "",
};
export const ProductPage = ({
  data,
  categories,
  brands,
}: {
  data: ListType<Product>;
  categories: SearchType<Category>[];
  brands: SearchType<Brand>[];
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<ProductType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [products, setProducts] = useState<ListType<Product>>(data);
  const deleteProduct = async (index: number) => {
    const id = products.items[index].id;
    const res = await deleteOne(Api.product, id);
    refresh(
      objectCompact({
        brand_id: filter?.brand,
        category_id: filter?.category,
        page: 0,
      })
    );
    return res.success;
  };
  const edit = async (e: IProduct) => {
    setOpen(true);
    form.reset({ ...e, edit: e.id });
  };
  const columns = getColumns(edit, deleteProduct);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const brand_id = filter?.brand;
    const category_id = filter?.category;
    await fetcher<Product>(Api.product, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      name: pg.filter,
      type: CategoryType.DEFAULT,
      brand_id,
      category_id,
      ...pg,
    }).then((d) => {
      setProducts(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as ProductType;
    const { edit, ...payload } = body;
    const res = edit
      ? await updateOne<IProduct>(Api.product, edit ?? "", payload as IProduct)
      : await create<IProduct>(Api.product, e as IProduct);
    if (res.success) {
      refresh(
        objectCompact({
          brand_id: filter?.brand,
          category_id: filter?.category,
          page: 0,
        })
      );
      setOpen(false);
      clear();
    }
    setAction(ACTION.DEFAULT);
    showToast("success", "Амжилттай хадгалагдлаа!");
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

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refresh();
  }, [filter]);
  const groups: { key: keyof FilterType; label: string; items: Option[] }[] =
    useMemo(
      () => [
        {
          key: "brand",
          label: "Бренд",
          items: brands.map((b) => ({
            value: b.id,
            label: b.value?.split("__")?.[0],
          })),
        },
        {
          key: "category",
          label: "Ангилал",
          items: categories.map((b) => ({
            value: b.id,
            label: b.value?.split("__")?.[0],
          })),
        },
      ],
      [brands, categories]
    );
  const clear = () => {
    form.reset(defaultValues);
  };

  const downloadExcel = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const res = await excel(Api.product, {
      page: page ?? DEFAULT_PG.page,
      limit: -1,
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
        `product_${mnDate().toISOString().slice(0, 10)}.xlsx`
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
  const [items, setItems] = useState({
    [Api.brand]: brands,
    [Api.category]: categories,
  });
  const searchField = async (v: string, key: Api, edit?: boolean) => {
    let value = "";
    if (v.length > 1) value = v;
    if (v.length == 1) return;

    const payload = { id: value };

    await search(key as any, {
      ...payload,
      limit: 20,
      page: 0,
      type: CategoryType.DEFAULT,
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
      <DynamicHeader count={products.count} />

      <div className="admin-container">
        <DataTable
          columns={columns}
          count={products.count}
          data={products.items}
          refresh={refresh}
          excel={downloadExcel}
          loading={action == ACTION.RUNNING}
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
            </>
          }
          modalAdd={
            <Modal
              // w="md"
              maw="xl"
              name="Бүтээгдэхүүн нэмэх"
              submit={() => form.handleSubmit(onSubmit, onInvalid)()}
              open={open == true}
              setOpen={(v) => {
                form.reset(defaultValues);
                setOpen(v);
              }}
              loading={action == ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="divide-y">
                  <div className="grid grid-cols-1 gap-3 pb-5 sm:grid-cols-2">
                    <FormItems
                      control={form.control}
                      name="category_id"
                      label="Ангилал"
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            search={(e) => searchField(e, Api.category)}
                            props={{ ...field }}
                            items={items[Api.category].map((item) => {
                              return {
                                value: item.id,
                                label: item.value?.split("__")?.[0],
                              };
                            })}
                          />
                        );
                      }}
                    </FormItems>
                    <FormItems
                      control={form.control}
                      name="brand_id"
                      label="Бренд"
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            search={(e) => searchField(e, Api.brand)}
                            props={{ ...field }}
                            items={items[Api.brand].map((item) => {
                              return {
                                value: item.id,
                                label: item.value?.split("__")?.[0],
                              };
                            })}
                          />
                        );
                      }}
                    </FormItems>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-5">
                    {[
                      {
                        key: "name",
                        label: "Бүтээгдэхүүний нэр",
                      },
                    ].map((item, i) => {
                      const name = item.key as keyof ProductType;
                      const label = item.label as keyof ProductType;
                      return (
                        <FormItems
                          control={form.control}
                          name={name}
                          label={label}
                          key={i}
                          className={item.key === "name" ? "col-span-2" : ""}
                        >
                          {(field) => {
                            return <TextField props={{ ...field }} />;
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
