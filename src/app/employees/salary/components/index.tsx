"use client";
import { DataTable } from "@/components/data-table";
import { IUserSalary, User, UserSalary } from "@/models";
import { useEffect, useMemo, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  Option,
  SearchType,
  VALUES,
  getEnumValues,
  getValuesStatus,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, search, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { fetcher } from "@/hooks/fetcher";
import { getColumns } from "./columns";
import {
  firstLetterUpper,
  objectCompact,
  searchUsernameFormatter,
} from "@/lib/functions";
import DynamicHeader from "@/components/dynamicHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { showToast } from "@/shared/components/showToast";
import { CategoryType, ROLE, STATUS } from "@/lib/enum";
import { TextField } from "@/shared/components/text.field";

const formSchema = z.object({
  user_id: z.string().min(1, "Артист сонгоно уу"),

  percent: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number()
  ) as unknown as number,
  duration: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number()
  ) as unknown as number,
  date: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date()
  ) as unknown as Date,
  status: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(STATUS).nullable()
    )
    .optional() as unknown as number,
  edit: z.string().nullable().optional(),
});
const defaultValues: UserSalaryType = {
  user_id: "",
  date: new Date(),
  duration: 5,
  percent: 30,
  status: STATUS.Active,
  edit: undefined,
};
type UserSalaryType = z.infer<typeof formSchema>;
type FilterType = {
  service?: string;
  user?: string;
};
export const EmployeeUserSalaryPage = ({
  data,
  users,
}: {
  data: ListType<UserSalary>;
  users: SearchType<User>[];
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<UserSalaryType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [userSalaries, setUserSalarys] = useState<ListType<UserSalary> | null>(
    null
  );

  const userMap = useMemo(
    () => new Map(users.map((b) => [b.id, b.value])),
    [users]
  );

  const UserSalaryFormatter = (data: ListType<UserSalary>) => {
    const items: UserSalary[] = data.items.map((item) => {
      const user = userMap.get(item.user_id);
      return {
        ...item,
        user_name: user ? searchUsernameFormatter(user) : "",
      };
    });

    setUserSalarys({ items, count: data.count });
  };
  useEffect(() => {
    UserSalaryFormatter(data);
  }, [data]);
  const clear = () => {
    form.reset(defaultValues);
    console.log(form.getValues());
  };
  const deleteUserSalary = async (index: number) => {
    const id = userSalaries!.items[index].id;
    const res = await deleteOne(Api.user_salaries, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IUserSalary) => {
    form.reset({
      edit: e.id,
      user_id: e.user_id,
      date: e.date,
      duration: e.duration,
      percent: e.percent,
      status: e.status,
    });
    setOpen(true);
  };
  const columns = getColumns(edit, deleteUserSalary);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const user_id = filter?.user;
    await fetcher<UserSalary>(Api.user_salaries, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      user_id,
      ...pg,
      //   name: pg.filter,
    }).then((d) => {
      UserSalaryFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as UserSalaryType;
    const { edit, ...payload } = body;
    const res = edit
      ? await updateOne<IUserSalary>(
          Api.user_salaries,
          edit as string,
          payload as IUserSalary
        )
      : await create<IUserSalary>(Api.user_salaries, e as IUserSalary);
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
      ],
      [users]
    );

  const [items, setItems] = useState({
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
      <DynamicHeader count={userSalaries?.count} />

      <div className="admin-container">
        <DataTable
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
          search={false}
          clear={() => setFilter(undefined)}
          columns={columns}
          count={userSalaries?.count}
          data={(userSalaries?.items as any) ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              maw="md"
              name={"Цалин нэмэх"}
              submit={() => form.handleSubmit(onSubmit, onInvalid)()}
              open={open == true}
              setOpen={(v) => {
                setOpen(v);
                clear();
              }}
              loading={action == ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="grid grid-cols-2 gap-3 space-y-4">
                  <FormItems
                    control={form.control}
                    name="user_id"
                    className="col-span-2"
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

                  <FormItems
                    control={form.control}
                    name={"duration"}
                    className={"col-span-1"}
                  >
                    {(field) => {
                      return (
                        <TextField
                          props={{ ...field }}
                          type={"number"}
                          label={"Хугацаа"}
                        />
                      );
                    }}
                  </FormItems>
                  <FormItems
                    control={form.control}
                    name={"percent"}
                    className={"col-span-1"}
                  >
                    {(field) => {
                      return (
                        <TextField
                          props={{ ...field }}
                          type={"number"}
                          label={"Цалинийн хувь"}
                        />
                      );
                    }}
                  </FormItems>
                  <FormItems
                    control={form.control}
                    name={"status"}
                    label="Төлөв"
                    className={"col-span-1"}
                  >
                    {(field) => {
                      return (
                        <ComboBox
                          props={{ ...field }}
                          items={[STATUS.Active, STATUS.Pending].map((item) => {
                            return {
                              value: item.toString(),
                              label: getValuesStatus[item].name,
                            };
                          })}
                        />
                      );
                    }}
                  </FormItems>
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
