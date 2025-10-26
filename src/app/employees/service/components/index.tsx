"use client";
import { DataTable } from "@/components/data-table";
import { IUserService, User, UserService } from "@/models";
import { useEffect, useMemo, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  Option,
  SearchType,
  VALUES,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, search } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { fetcher } from "@/hooks/fetcher";
import { getColumns } from "./columns";
import {
  firstLetterUpper,
  objectCompact,
  searchUsernameFormatter,
  usernameFormatter,
} from "@/lib/functions";
import { Service } from "@/models/service.model";
import DynamicHeader from "@/components/dynamicHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { showToast } from "@/shared/components/showToast";
import { CategoryType, ROLE } from "@/lib/enum";
import { SearchParams } from "next/dist/server/request/search-params";

const formSchema = z.object({
  user_id: z.string().min(1, "Артист сонгоно уу"),
  services: z.array(z.string()).refine((arr) => arr.length > 0, {
    message: "Үйлчилгээний жагсаалтыг сонгоно уу",
  }),

  edit: z.string().nullable().optional(),
});
const defaultValues: UserServiceType = {
  user_id: "",
  services: [],
  edit: undefined,
};
type UserServiceType = z.infer<typeof formSchema>;
type FilterType = {
  service?: string;
  user?: string;
};
export const EmployeeUserServicePage = ({
  data,
  services,
  users,
}: {
  data: ListType<UserService>;
  services: ListType<Service>;
  users: SearchType<User>[];
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<UserServiceType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [userServices, setUserServices] =
    useState<ListType<UserService> | null>(null);
  const serviceMap = useMemo(
    () => new Map(services.items.map((b) => [b.id, b])),
    [services.items]
  );
  const userMap = useMemo(
    () => new Map(users.map((b) => [b.id, b.value])),
    [users]
  );

  const UserServiceFormatter = (data: ListType<UserService>) => {
    const items: UserService[] = data.items.map((item) => {
      const user = userMap.get(item.user_id);
      const service = serviceMap.get(item.service_id);
      return {
        ...item,
        user_name: item.user_name
          ? item.user_name
          : user
          ? searchUsernameFormatter(user)
          : "",
        service_name: item.services
          ?.map((s: any) => {
            return `${s.service_name}`;
          })
          .join(", "),
      };
    });

    setUserServices({ items, count: data.count });
  };
  useEffect(() => {
    UserServiceFormatter(data);
  }, [data]);
  const clear = () => {
    form.reset(defaultValues);
    console.log(form.getValues());
  };
  const deleteUserService = async (index: number) => {
    const id = userServices!.items[index].id;
    const res = await deleteOne(Api.user_service, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IUserService) => {
    form.reset({ edit: e.user_id, user_id: e.user_id });
    setOpen(true);
  };
  const columns = getColumns(edit, deleteUserService);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const service_id = filter?.service;
    const user_id = filter?.user;
    await fetcher<UserService>(
      Api.user_service,
      {
        page: page ?? DEFAULT_PG.page,
        limit: limit ?? DEFAULT_PG.limit,
        sort: sort ?? DEFAULT_PG.sort,
        service_id,
        user_id,
        ...pg,
        //   name: pg.filter,
      },
      "employee"
    ).then((d) => {
      UserServiceFormatter(d);
      console.log(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as UserServiceType;
    const { edit, ...payload } = body;
    const res = await create<IUserService>(Api.user_service, e as IUserService);
    if (res.success) {
      refresh();
      setOpen(false);
      clear();
      showToast(
        "success",
        edit ? "Мэдээлэл шинэчлэлээ." : "Амжилттай хадгаллаа."
      );
    } else {
      showToast("error", res.error ?? "Алдаа гарлаа");
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
        service_id: filter?.service,
        user_id: filter?.user,
        page: 0,
      })
    );
  }, [filter]);
  const groups: { key: keyof FilterType; label: string; items: Option[] }[] =
    useMemo(
      () => [
        {
          key: "user",
          label: "Артист",
          items: users.map((b) => ({
            value: b.id,
            label: searchUsernameFormatter(b.value),
          })),
        },
        {
          key: "service",
          label: "Үйлчилгээ",
          items: services.items.map((b) => ({ value: b.id, label: b.name })),
        },
      ],
      [services.items, users]
    );

  useEffect(() => {
    if (open) {
      const editUser = form.watch("edit");
      if (editUser) {
        const services =
          userServices?.items
            .filter((se) => se.user_id == editUser)
            ?.map((s) => {
              return [...(s.services?.map((s: any) => s.service_id) ?? [])];
            }) ?? [];
        form.reset({
          services: [...services[0]],
          user_id: editUser,
          edit: editUser,
        });
      } else {
        const user_id = form.watch("user_id");
        const services =
          userServices?.items
            .filter((se) => se.user_id == user_id)
            ?.map((s) => s.service_id) ?? [];
        form.reset({
          user_id,
          services,
        });
      }
    }
  }, [open, form.watch("user_id")]);
  const [items, setItems] = useState({
    [Api.user]: users,
    [Api.service]: services,
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
          }
        : {
            role: ROLE.E_M,

            value: v,
          };
    await search(key as any, {
      ...payload,
      limit: 20,
      page: 0,
    }).then((d) => {
      setItems((prev) => ({
        ...prev,
        [key]: d.data,
      }));
    });
  };
  return (
    <div className="">
      <DynamicHeader count={userServices?.count} />

      <div className="admin-container">
        <DataTable
          filter={
            <>
              {groups.map((item, i) => {
                const { key } = item;
                return (
                  // <FilterPopover
                  //   key={i}
                  //   content={item.items.map((it, index) => (
                  //     <label key={index} className="checkbox-label">
                  //       <Checkbox checked={filter?.[key] == it.value} onCheckedChange={() => changeFilter(key, it.value)} />
                  //       <span>{it.label as string}</span>
                  //     </label>
                  //   ))}
                  //   value={filter?.[key] ? item.items.filter((item) => item.value == filter[key])[0].label : undefined}
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
            </>
          }
          search={false}
          clear={() => setFilter(undefined)}
          columns={columns}
          count={userServices?.count}
          data={(userServices?.items as any) ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              maw="md"
              name={"Үйлчилгээ нэмэх"}
              submit={() => form.handleSubmit(onSubmit, onInvalid)()}
              open={open == true}
              setOpen={(v) => {
                setOpen(v);
                clear();
              }}
              loading={action == ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="grid grid-cols-1 gap-3 space-y-4">
                  <FormItems
                    control={form.control}
                    name="user_id"
                    label="Ажилчин"
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
                  {form.watch("user_id") && (
                    <FormItems
                      control={form.control}
                      name="services"
                      label="Үйлчилгээ"
                    >
                      {(field) => (
                        <div className="p-2 mt-2 bg-white border rounded-md">
                          {services.items.map((service: any) => {
                            const selected = field.value ?? ([] as string[]);
                            const isChecked = selected.includes(service.id);

                            return (
                              <div
                                key={service.id}
                                className="flex items-center gap-2 hover:bg-[#e9ebfa] p-2 border-b last:border-none"
                              >
                                <Checkbox
                                  id={service.id}
                                  checked={isChecked}
                                  onCheckedChange={(val) => {
                                    const checked = val === true;
                                    const prev = field.value ?? [];
                                    const next = checked
                                      ? Array.from(
                                          new Set([...prev, service.id])
                                        )
                                      : (prev as string[]).filter(
                                          (id: string) => id !== service.id
                                        );
                                    field.onChange(next);
                                  }}
                                />
                                <Label
                                  htmlFor={service.id}
                                  className="py-2 size-full"
                                >
                                  {service.name}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </FormItems>
                  )}
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
