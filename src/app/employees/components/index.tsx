"use client";
import { DataTable } from "@/components/data-table";
import {
  ACTION,
  EMPLOYEE_USER_LEVELS,
  DEFAULT_PG,
  EmployeeStatusValue,
  getUserLevelValue,
  getEnumValues,
  ListType,
  Option,
  PG,
  RoleValue,
  UserStatusValue,
  VALUES,
  zNumOpt,
  zStrOpt,
} from "@/lib/constants";
import { Branch, IUser, User } from "@/models";
import { getColumns } from "./columns";
import { Modal } from "@/shared/components/modal";
import { ComboBox } from "@/shared/components/combobox";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  EmployeeStatus,
  INPUT_TYPE,
  ROLE,
  UserLevel,
  UserStatus,
} from "@/lib/enum";
import { PasswordField } from "@/shared/components/password.field";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@/shared/components/text.field";
import { firstLetterUpper, objectCompact, textValue } from "@/lib/functions";
import { DatePicker } from "@/shared/components/date.picker";
import { create, deleteOne, updateOne } from "@/app/(api)";
import { Api } from "@/utils/api";
import { FormItems } from "@/shared/components/form.field";
import { fetcher } from "@/hooks/fetcher";
import { EmployeeProductModal } from "./employee.product";
import { imageUploader } from "@/app/(api)/base";
import { Pencil, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DynamicHeader from "@/components/dynamicHeader";
import { toast } from "sonner";
import { showToast } from "@/shared/components/showToast";
import { ACCEPT_ATTR, validateImageFile } from "@/lib/image.validator";
import { COLOR_HEX } from "@/lib/colors";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  firstname: zStrOpt({
    allowNullable: false,
    label: "Нэр",
  }),
  lastname: zStrOpt({
    allowNullable: false,
    label: "Овог",
  }),
  branch_id: zStrOpt({
    allowNullable: false,
    label: "Салбар",
  }),
  mobile: zStrOpt({
    allowNullable: false,
    label: "Утасны дугаар",
  }),
  birthday: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date(),
  ) as unknown as Date,
  experience: zNumOpt({
    label: "Туршлага",
  }),
  percent: zNumOpt({
    label: "Цалингийн хувь",
  }),
  password: zStrOpt({
    label: "Нууц үг",
  }),
  nickname: zStrOpt({
    allowNullable: false,
    label: "Хоч",
  }),
  profile_img: zStrOpt({}),
  color: zNumOpt({
    allowNullable: false,
    label: "Өнгө",
  }),
  role: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.number().refine((val) => [ROLE.EMPLOYEE, ROLE.MANAGER].includes(val), {
        message: "Зөвхөн EMPLOYEE эсвэл MANAGER сонгож болно",
      }),
    )
    .optional() as unknown as number,
  file: z
    .any()
    // .refine((f) => f.size > 0, { message: "Файл заавал оруулна" })
    .nullable(),
  description: zStrOpt({
    label: "Тайлбар",
  }),
  level: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(UserLevel).nullable(),
    )
    .optional() as unknown as number,
});

type UserType = z.infer<typeof formSchema>;
interface FilterType {
  role?: number;
  branch?: string;
  status?: number;
}
const defaultValues = {
  role: ROLE.EMPLOYEE,
  firstname: undefined,
  lastname: undefined,
  branch_id: undefined,
  nickname: undefined,
  mobile: undefined,
  birthday: new Date(),
  percent: 30,
  // color: 0,
  experience: 0,
  password: undefined,
};
export const EmployeePage = ({
  data,
  branches,
}: {
  data: ListType<User>;
  branches: ListType<Branch>;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<boolean | undefined>(false);
  const form = useForm<UserType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [users, setUsers] = useState<ListType<User>>(data);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [userProduct, setUserProduct] = useState<string | undefined>(undefined);
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const { file, password, ...body } = form.getValues();
    if (editingUser == null && password == null) {
      toast("Нууц үг оруулна уу", {});
      setAction(ACTION.DEFAULT);
      return;
    }
    const formData = new FormData();
    let payload = {};
    if (file != null) {
      formData.append("files", file);
      const uploadResult = await imageUploader(formData);
      payload = {
        ...(body as IUser),
        profile_img: uploadResult[0],
      };
    } else {
      payload = {
        ...(body as IUser),
      };
    }
    const res = editingUser
      ? await updateOne<IUser>(
          Api.user,
          editingUser?.id as string,
          payload,
          "update",
        )
      : await create<IUser>(Api.user, {
          ...payload,
          password: password as string,
        });

    if (res.success) {
      refresh();
      setOpen(false);
      showToast(
        "success",
        editingUser?.id != undefined
          ? "Мэдээлэл засагдсан!"
          : "Ажилтан нэмэгдлээ!",
      );
      form.reset(defaultValues);
    } else {
      showToast("error", res.error ?? "");
    }
    setAction(ACTION.DEFAULT);
  };
  const onInvalid = async <T,>(e: T) => {
    const error = Object.entries(e as any)
      .map(([er, v], i) => {
        const value = VALUES[er];
        if (er == "color") return firstLetterUpper(value) + " оруулна уу";
        if ((v as any)?.message) {
          return (v as any)?.message;
        }
        return i == 0 ? firstLetterUpper(value) : value;
      })
      .join(", ");
    showToast("info", error);
    // setSuccess(false);
  };

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const branch_id = filter?.branch;
    const role = filter?.role;
    const user_status = filter?.status;

    await fetcher<User>(Api.user, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      isCost: false,
      role: role ?? ROLE.E_M,
      mobile: pg.filter,
      user_status,
      branch_id,
      ...pg,
    }).then((d) => {
      setUsers(d);
      form.reset(defaultValues);
    });
    setAction(ACTION.DEFAULT);
  };
  const edit = (e: IUser) => {
    setOpen(true);
    setEditingUser(e);
    form.reset(e);
  };
  const setStatus = async (index: number, status: number) => {
    await updateOne(
      Api.user,
      users.items[index].id,
      {
        user_status: status,
      },
      "status",
    );
    refresh();
  };
  const giveProduct = (index: number) => {
    setUserProduct(users.items[index].id);
  };
  const deleteEmployee = async (index: number) => {
    const id = users!.items[index].id;
    const res = await deleteOne(Api.user, id);
    refresh();
    return res.success;
  };
  const columns = getColumns(edit, setStatus, giveProduct, deleteEmployee);

  const [filter, setFilter] = useState<FilterType>({
    status: UserStatus.ACTIVE,
  });
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
          key: "role",
          label: textValue("role"),
          items: [
            { value: ROLE.EMPLOYEE, label: "Ажилтан" },
            { value: ROLE.MANAGER, label: "Manager" },
          ],
        },
        {
          key: "branch",
          label: "Салбар",
          items: branches.items.map((b) => ({ value: b.id, label: b.name })),
        },
        {
          key: "status",
          label: textValue("status"),
          items: getEnumValues(EmployeeStatus).map((s) => ({
            value: s,
            label: EmployeeStatusValue[s].name,
          })),
        },
      ],
      [branches.items],
    );
  return (
    <div className="relative w-full">
      <DynamicHeader />

      <div className="admin-container">
        <EmployeeProductModal
          id={userProduct}
          clear={() => setUserProduct(undefined)}
        />
        <DataTable
          clear={() => setFilter({})}
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
                      className="max-w-36 w-full text-xs!"
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
          columns={columns}
          data={users.items}
          refresh={refresh}
          loading={action === ACTION.RUNNING}
          count={users.count}
          modalAdd={
            <Modal
              maw="2xl"
              submit={() => {
                form.handleSubmit(onSubmit, onInvalid)();
              }}
              name="Ажилтан нэмэх"
              submitTxt={editingUser ? "Засах" : "Нэмэх"}
              open={!open ? false : open}
              setOpen={(v) => {
                setOpen(v);
                setEditingUser(null);
                if (!editingUser) form.reset(defaultValues);
              }}
              loading={action == ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="divide-y">
                  <div className="double-col pb-5">
                    <div className="double-col">
                      <FormItems
                        control={form.control}
                        name="file"
                        label="Зураг өөрчлөх"
                      >
                        {(field) => {
                          const fileUrl = field.value
                            ? URL.createObjectURL(field.value as any)
                            : null;

                          return (
                            <div className="relative w-32 h-32">
                              {fileUrl ? (
                                <div>
                                  {/* Preview */}
                                  <img
                                    src={fileUrl}
                                    alt="preview"
                                    className="object-cover w-full h-full overflow-hidden bg-white border rounded-md"
                                  />

                                  <label
                                    htmlFor="file-upload"
                                    className="absolute p-1 rounded cursor-pointer top-1 right-7 bg-primary hover:bg-slate-600"
                                  >
                                    <Pencil className="text-white size-3" />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => field.onChange(null)}
                                    className="absolute p-1 rounded cursor-pointer top-1 right-1 bg-primary hover:bg-slate-600"
                                  >
                                    <X className="text-white size-3" />
                                  </button>
                                </div>
                              ) : (
                                <label
                                  htmlFor="file-upload"
                                  className="flex flex-col items-center justify-center w-full h-full transition-colors bg-white border rounded-md cursor-pointer hover:bg-gray-50"
                                >
                                  <UploadCloud className="w-6 h-6 text-gray-500" />
                                  <span className="mt-1 text-xs text-gray-500">
                                    Browse
                                  </span>
                                </label>
                              )}

                              <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept={ACCEPT_ATTR}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const res = validateImageFile(file);
                                  if (!res.ok) {
                                    showToast("error", res.message);
                                    e.currentTarget.value = "";
                                    return;
                                  }
                                  field.onChange(file);
                                }}
                              />
                            </div>
                          );
                        }}
                      </FormItems>

                      {(form.getValues("profile_img") as string) && (
                        <FormItems
                          control={form.control}
                          name="profile_img"
                          label="Одоогийн зураг"
                        >
                          {(field) => {
                            return (
                              <div>
                                {field.value && (
                                  <div className="relative w-32 h-32 bg-white">
                                    <img
                                      src={`/api/file/${field.value}`}
                                      alt="preview"
                                      className="object-cover overflow-hidden border border-red-400 rounded-md size-full bg-gray"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        </FormItems>
                      )}
                    </div>
                    <div className="double-col grid-cols-1">
                      <FormItems
                        control={form.control}
                        name="branch_id"
                        label="Салбар"
                      >
                        {(field) => {
                          return (
                            <ComboBox
                              props={{ ...field }}
                              items={branches.items.map((branch) => {
                                return {
                                  value: branch.id,
                                  label: branch.name,
                                };
                              })}
                            />
                          );
                        }}
                      </FormItems>

                      <FormItems
                        control={form.control}
                        name="role"
                        label="Эрхийн түвшин"
                      >
                        {(field) => {
                          return (
                            <ComboBox
                              items={[ROLE.EMPLOYEE, ROLE.MANAGER].map(
                                (role) => {
                                  return {
                                    label: RoleValue[role],
                                    value: role.toString(),
                                  };
                                },
                              )}
                              props={{
                                ...field,
                              }}
                            />
                          );
                        }}
                      </FormItems>
                    </div>
                  </div>
                  <div className="pt-5 double-col">
                    {!editingUser && (
                      <FormItems
                        label="Нууц үг"
                        control={form.control}
                        name="password"
                        className="col-span-1"
                      >
                        {(field) => {
                          return (
                            <PasswordField
                              label=""
                              props={{ ...field }}
                              view={true}
                            />
                          );
                        }}
                      </FormItems>
                    )}
                    {[
                      "lastname",
                      "firstname",
                      "mobile",
                      "nickname",
                      "percent",
                      "experience",
                    ].map((i, index) => {
                      const item = i as keyof UserType;
                      return (
                        <FormItems
                          label={firstLetterUpper(VALUES[item])}
                          control={form.control}
                          name={item}
                          key={index}
                          className={"col-span-1"}
                        >
                          {(field) => {
                            return (
                              <TextField
                                type={
                                  item === "mobile"
                                    ? INPUT_TYPE.NUMBER
                                    : INPUT_TYPE.TEXT
                                }
                                props={{
                                  ...field,
                                  ...(item === "mobile"
                                    ? {
                                        inputMode: "numeric",
                                        pattern: "[0-9]*",
                                      }
                                    : {}),
                                }}
                                className={cn(
                                  item === "mobile" ? "hide-number-arrows" : "",
                                )}
                              />
                            );
                          }}
                        </FormItems>
                      );
                    })}
                    <FormItems
                      label="Төрсөн өдөр"
                      control={form.control}
                      name="birthday"
                    >
                      {(field) => {
                        return (
                          <DatePicker
                            mode="single"
                            name=""
                            pl="Огноо сонгох"
                            value={field.value}
                            onChange={(v) => {
                              field.onChange(v);
                            }}
                          />
                        );
                      }}
                    </FormItems>
                    <FormItems label="Өнгө" control={form.control} name="color">
                      {(field) => {
                        return (
                          <ComboBox
                            props={{ ...field }}
                            items={Object.entries(COLOR_HEX).map(
                              ([key, value], index) => {
                                return {
                                  color: key,
                                  value: index.toString(),
                                  label: key,
                                };
                              },
                            )}
                          />
                        );
                      }}
                    </FormItems>
                    <FormItems
                      control={form.control}
                      name="level"
                      label="Артистын түвшин"
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            props={{ ...field }}
                            items={EMPLOYEE_USER_LEVELS.map((item) => {
                              return {
                                value: item.toString(),
                                label: getUserLevelValue[item].name,
                              };
                            })}
                          />
                        );
                      }}
                    </FormItems>
                  </div>
                     <FormItems control={form.control} name={`description`}>
                        {(field) => {
                          return (
                            <Textarea
                              className=""
                              onChange={field.onChange}
                              value={field.value as string}
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
    </div>
  );
};
