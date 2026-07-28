"use client";
import { DataTable } from "@/components/data-table";
import {
  Branch,
  IProductTransaction,
  Product,
  ProductTransaction,
  User,
} from "@/models";
import { useEffect, useMemo, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  getEnumValues,
  getValuesProductTransactionStatus,
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
import { getColumns } from "./columns";
import {
  CategoryType,
  INPUT_TYPE,
  ProductTransactionStatus,
  ROLE,
  UserStatus,
} from "@/lib/enum";
import {
  firstLetterUpper,
  objectCompact,
  searchProductFormatter,
  searchUsernameFormatter,
  usernameFormatter,
} from "@/lib/functions";
import DynamicHeader from "@/components/dynamicHeader";
import { Item } from "@radix-ui/react-dropdown-menu";
import { showToast } from "@/shared/components/showToast";

const formSchema = z.object({
  branch_id: ZValidator.branch,
  product_id: ZValidator.product,
  user_id: z.string().nullable().optional(),
  quantity: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number(),
  ) as unknown as number,

  edit: z.string().nullable().optional(),
  product_transaction_status: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(ProductTransactionStatus).nullable(),
    )
    .optional() as unknown as number,
});
type TransactionType = z.infer<typeof formSchema>;
type FilterType = {
  product?: string;
  user?: string;
  branch?: string;
  status?: number;
};
const defaultValues = {
  branch_id: "",
  edit: undefined,
  product_id: "",
  product_transaction_status: ProductTransactionStatus.Used,
  quantity: 0,
  user_id: "",
};
export const ProductTransactionPage = ({
  data,
  users,
  branches,
  products,
}: {
  data: ListType<ProductTransaction>;
  users: SearchType<User>[];
  branches: ListType<Branch>;
  products: SearchType<Product>[];
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<TransactionType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [transactions, setTransactions] =
    useState<ListType<IProductTransaction> | null>(null);
  const branchMap = useMemo(
    () => new Map(branches.items.map((b) => [b.id, b])),
    [branches.items],
  );
  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u.value])),
    [users],
  );
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.value])),
    [products],
  );
  const transactionFormatter = (data: ListType<ProductTransaction>) => {
    const items: IProductTransaction[] = data.items.map((item) => {
      const branch = branchMap.get(item.branch_id);
      const user = userMap.get(item.user_id);
      const product = productMap.get(item.product_id);

      return {
        ...item,
        branch_name: branch?.name ?? "",
        user_name: user ? searchUsernameFormatter(user) : "",
        product_name: product?.split("__")?.[2] ?? "",
      };
    });

    setTransactions({ items, count: data.count });
  };
  useEffect(() => {
    transactionFormatter(data);
  }, [data]);
  const deleteProduct = async (index: number) => {
    const id = transactions!.items[index].id;
    const res = await deleteOne(Api.product_transaction, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IProductTransaction) => {
    setOpen(true);
    form.reset({ ...e, edit: e.id });
  };
  const columns = getColumns(edit, deleteProduct);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const branch_id = filter?.branch;
    const user_id = filter?.user;
    const product_id = filter?.product;
    const product_transaction_status = filter?.status;
    await fetcher<ProductTransaction>(Api.product_transaction_admin, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      branch_id,
      user_id,
      product_id,
      product_transaction_status,
      ...pg,
    }).then((d) => {
      transactionFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as TransactionType;
    const { edit, ...payload } = body;
    const res = edit
      ? await updateOne<IProductTransaction>(
          Api.product_transaction,
          edit ?? "",
          payload as IProductTransaction,
        )
      : await create<IProductTransaction>(
          Api.product_transaction,
          e as IProductTransaction,
        );
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
  const [searchState, setSearchState] = useState<
    Partial<Record<keyof FilterType, string>>
  >({});
  const changeFilter = (key: string, value: number | string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    refresh(
      objectCompact({
        branch_id: filter?.branch,
        user_id: filter?.user,
        product_id: filter?.product,
        product_transaction_status: filter?.status,
        page: 0,
      }),
    );
  }, [filter]);
  const groups: {
    key: keyof FilterType;
    label: string;
    items: Option[];
    search?: boolean;
  }[] = useMemo(
    () => [
      {
        key: "branch",
        label: "Салбар",
        items: branches.items.map((b) => ({ value: b.id, label: b.name })),
      },
      {
        key: "user",
        label: "Артист",
        items: users.map((b) => ({
          value: b.id,
          label: searchUsernameFormatter(b.value),
        })),
      },
      {
        key: "product",
        label: "Бүтээгдэхүүн",
        search: true,
        items: products.map((b) => ({
          value: b.id,
          label: searchProductFormatter(b.value) ?? "",
        })),
      },
      {
        key: "status",
        label: "Статус",
        items: getEnumValues(ProductTransactionStatus).map((s) => ({
          value: s,
          label: getValuesProductTransactionStatus[s].name,
        })),
      },
    ],
    [branches.items],
  );
  const [items, setItems] = useState({
    [Api.product]: products,
    [Api.user]: users,
  });
  const searchField = async (v: string, key: Api, edit?: boolean) => {
    let value = "";
    if (v.length > 1) value = v;
    if (v.length == 1) return;

    const payload =
      key === Api.product
        ? { id: value, type: CategoryType.DEFAULT }
        : edit === undefined
          ? {
              id: value,
              role: ROLE.E_M,
              user_status: UserStatus.ACTIVE,
            }
          : {
              role: ROLE.E_M,
              user_status: UserStatus.ACTIVE,
              value: v,
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
      <DynamicHeader count={transactions?.count} />

      <div className="admin-container">
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
                    <span className="filter-label">{item.label as string}</span>
                    <ComboBox
                      pl={item.label}
                      name={item.label}
                      className="max-w-36 text-xs!"
                      value={filter?.[key] ? String(filter[key]) : ""} //
                      items={filteredItems.map((it) => ({
                        value: String(it.value),
                        label: it.label as string,
                      }))}
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
          columns={columns}
          count={transactions?.count}
          data={transactions?.items ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              // w="2xl"
              maw="xl"
              name="Хэрэглээ нэмэх"
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
                  <div className="double-col pb-5">
                    <FormItems
                      label="Салбар"
                      control={form.control}
                      name="branch_id"
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            className="w-full"
                            name={Item.name}
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
                    <FormItems
                      label="Ажилтан"
                      control={form.control}
                      name="user_id"
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            search={(e) => searchField(e, Api.user)}
                            props={{ ...field }}
                            items={items[Api.user].map((item) => {
                              return {
                                value: item.id,
                                label: searchUsernameFormatter(item.value),
                              };
                            })}
                          />
                        );
                      }}
                    </FormItems>
                    <div className="col-span-full">
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
                    </div>
                  </div>

                  <div className="double-col pt-5">
                    <FormItems
                      label="Төлөв"
                      control={form.control}
                      name="product_transaction_status"
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            props={{ ...field }}
                            items={getEnumValues(ProductTransactionStatus).map(
                              (item) => {
                                return {
                                  value: item.toString(),
                                  label:
                                    getValuesProductTransactionStatus[item]
                                      .name,
                                };
                              },
                            )}
                          />
                        );
                      }}
                    </FormItems>
                    {[
                      {
                        key: "quantity",
                        type: INPUT_TYPE.NUMBER,
                        label: "Тоо ширхэг",
                      },
                      // {
                      //   key: "price",
                      //   type: "number",
                      //   label: "Үнэ",
                      // },
                      // {
                      //   key: "total_amount",
                      //   type: "number",
                      //   label: "Нийт үнэ",
                      // },
                    ].map((item, i) => {
                      const name = item.key as keyof TransactionType;
                      const label = item.label as keyof TransactionType;
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
                    {/* <FormItems
                    label="Бараа"
                    control={form.control}
                    name="product_id"
                  >
                    {(field) => {
                      return (
                        <ComboBox
                          props={{ ...field }}
                          items={products.items.map((item) => {
                            return {
                              value: item.id,
                              label: item.name,
                            };
                          })}
                        />
                      );
                    }}
                  </FormItems> */}
                  </div>
                </div>
              </FormProvider>
            </Modal>
          }
        />
      </div>
      {/* <ProductDialog
        editingProduct={editingProduct}
        onChange={onChange}
        save={handleSave}
      /> */}
    </div>
  );
};
