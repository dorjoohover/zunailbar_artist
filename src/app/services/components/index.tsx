"use client";
import { DataTable } from "@/components/data-table";
import { Branch, IService, Service } from "@/models";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  Option,
  VALUES,
  zStrOpt,
  ServiceView,
  getEnumValues,
  getValueServiceView,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { TextField } from "@/shared/components/text.field";
import { fetcher } from "@/hooks/fetcher";
import { getColumns } from "./columns";
import DynamicHeader from "@/components/dynamicHeader";
import { firstLetterUpper, objectCompact } from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";
import { Switch } from "@/components/ui/switch";
import { ACCEPT_ATTR, validateImageFile } from "@/lib/image.validator";
import { Pencil, UploadCloud, X } from "lucide-react";
import { IconPicker } from "@/components/icons/picker";
import { Label } from "@/components/ui/label";
import { imageUploader } from "@/app/(api)/base";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z
  .object({
    branch_id: z.string(),
    name: z.string().refine((data) => data.length > 0, {
      message: "Нэр оруулна уу",
    }),
    max_price: z
      .preprocess((val) => {
        if (val === null || val === undefined || val === "") return null;
        return typeof val === "string" ? parseFloat(val) : val;
      }, z.number().nullable())
      .nullable()
      .optional() as unknown as number | null,
    pre: z
      .preprocess((val) => {
        if (val === null || val === undefined || val === "") return 0;
        return typeof val === "string" ? parseFloat(val) : val;
      }, z.number())
      .nullable()
      .optional() as unknown as number,
    description: zStrOpt,
    min_price: z
      .preprocess((val) => {
        if (val === null || val === undefined || val === "") return 0;
        return typeof val === "string" ? parseFloat(val) : val;
      }, z.number())
      .optional() as unknown as number,
    duration: z
      .preprocess(
        (val) => (typeof val === "string" ? parseFloat(val) : val),
        z.number()
      )
      .refine((val) => +(val ?? "0") > 0, {
        message: "Хугацаа оруулна уу",
      }) as unknown as number,
    edit: z.string().nullable().optional(),
    isAll: z.boolean().nullable().optional(),
    image: zStrOpt,
    view: z
      .preprocess(
        (val) => (typeof val === "string" ? parseInt(val, 10) : val),
        z.nativeEnum(ServiceView).nullable()
      )
      .optional() as unknown as number,
    file: z
      .any()
      // .refine((f) => f.size > 0, { message: "Файл заавал оруулна" })
      .nullable(),
    icon: zStrOpt,
  })
  .refine((data) => data.isAll, {
    message: "Салбар сонгоно уу",
  })
  .refine(
    (data) =>
      data.max_price === null || data.max_price === undefined
        ? true
        : data.max_price >= (data.min_price ?? 0),
    {
      message: "Их үнэ бага үнээс хямд байна байж болохгүй",
      path: ["max_price"],
    }
  )
  .refine(
    (data) => (data?.pre ?? 0) <= (data?.max_price ?? data?.min_price ?? 0),
    {
      message: "Урьдчилгаа нийт дүнгээс хэтэрч болохгүй",
      path: ["pre"],
    }
  );

const defaultValues: ServiceType = {
  branch_id: "",
  name: "",
  max_price: null,
  min_price: 0,
  pre: 0,
  duration: 0,
  edit: undefined,
  icon: null,
  image: null,
  file: null,
  isAll: true,
  description: null,
  view: null,
};
type FilterType = {
  branch?: string;
};
type ServiceType = z.infer<typeof formSchema>;
export const ServicePage = ({
  data,
  branches,
}: {
  data: ListType<Service>;
  branches: ListType<Branch>;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<ServiceType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [services, setServices] = useState<ListType<Service> | null>(null);
  const branchMap = useMemo(
    () => new Map(branches.items.map((b) => [b.id, b])),
    [branches.items]
  );

  const serviceFormatter = (data: ListType<Service>) => {
    const items: Service[] = data.items.map((item) => {
      const branch = branchMap.get(item.branch_id);

      return {
        ...item,
        branch_name: branch?.name ?? "",
      };
    });

    setServices({ items, count: data.count });
  };
  useEffect(() => {
    serviceFormatter(data);
  }, [data]);
  const clear = () => {
    form.reset(defaultValues);
  };
  const deleteService = async (index: number) => {
    const id = services!.items[index].id;
    const res = await deleteOne(Api.service, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IService) => {
    setOpen(true);
    form.reset({ ...e, edit: e.id });
  };
  const columns = getColumns(edit, deleteService);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    console.log(pg);
    const { page, limit, sort } = pg;
    const branch_id = filter?.branch;
    await fetcher<Service>(Api.service, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      branch_id,
      ...pg,
    }).then((d) => {
      serviceFormatter(d);
      console.log(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);

    const { edit, file, ...body } = e as ServiceType;
    const formData = new FormData();
    let payload = { ...(body as unknown as IService) };
    if (file != null) {
      formData.append("files", file);
      const uploadResult = await imageUploader(formData);
      payload.image = uploadResult[0];
    }
    const res = edit
      ? await updateOne<Service>(
          Api.service,
          edit ?? "",
          payload as unknown as Service
        )
      : await create<Service>(Api.service, e as Service);
    if (res.success) {
      refresh();
      setOpen(false);
      showToast("success", edit ? "Мэдээлэл засагдсан!" : "Ажилтан нэмэгдлээ!");
      clear();
    } else {
      showToast("info", res.error ?? "Алдаа гарлаа");
    }
    setAction(ACTION.DEFAULT);
  };
  const onInvalid = async <T,>(e: T) => {
    console.log(e);
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
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    refresh(
      objectCompact({
        branch_id: filter?.branch,
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
      ],
      [branches.items]
    );

  const isAll = form.watch("isAll");
  return (
    <div className="">
      <DynamicHeader />

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
            </>
          }
          columns={columns}
          count={services?.count}
          data={services?.items ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              // w="2xl"
              maw="xl"
              name={"Үйлчилгээ нэмэх"}
              submit={() => form.handleSubmit(onSubmit, onInvalid)()}
              open={open == true}
              setOpen={(v) => {
                setOpen(v);
                form.reset(defaultValues);
              }}
              loading={action == ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="double-col">
                  <FormItems
                    label="Салбар"
                    control={form.control}
                    name="branch_id"
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
                  {[
                    {
                      key: "name",
                      label: "Үйлчилгээний нэр",
                      type: "text",
                    },
                  ].map((item, i) => {
                    const name = item.key as keyof ServiceType;
                    const label = item.label as keyof ServiceType;
                    return (
                      <FormItems
                        label={label}
                        control={form.control}
                        name={name}
                        key={i}
                        className={item.key && "name"}
                      >
                        {(field) => {
                          return (
                            <TextField props={{ ...field }} type={item.type} />
                          );
                        }}
                      </FormItems>
                    );
                  })}
                </div>

                <div className="divide-x-gray"></div>

                <div className="double-col mb-4">
                  {[
                    {
                      key: "min_price",
                      type: "money",
                      label: "Үнэ",
                    },

                    {
                      key: "max_price",
                      type: "money",
                      label: "Их үнэ",
                    },
                    {
                      key: "pre",
                      type: "money",
                      label: "Урьдчилгаа",
                    },
                    {
                      key: "duration",
                      type: "number",
                      label: "Хугацаа",
                    },
                  ].map((item, i) => {
                    const name = item.key as keyof ServiceType;
                    const label = item.label as keyof ServiceType;
                    return (
                      <FormItems
                        label={label}
                        control={form.control}
                        name={name}
                        key={i}
                        className={item.key && "name"}
                      >
                        {(field) => {
                          return (
                            <TextField props={{ ...field }} type={item.type} />
                          );
                        }}
                      </FormItems>
                    );
                  })}
                </div>
                <div className="double-col">
                  <FormItems
                    control={form.control}
                    name="file"
                    label="Зураг өөрчлөх"
                  >
                    {(field) => {
                      const image = form.getValues("image");
                      const fileUrl = field.value
                        ? URL.createObjectURL(field.value as any)
                        : null;

                      return (
                        <div className="relative w-32 h-32">
                          {fileUrl || image ? (
                            <>
                              {/* Preview */}
                              <img
                                src={
                                  fileUrl ??
                                  `/api/file/${form.getValues("image")}`
                                }
                                alt="preview"
                                className="object-cover w-full h-full overflow-hidden bg-white border rounded-md"
                              />

                              {/* Change */}
                              <label
                                htmlFor="file-upload"
                                className="absolute p-1 rounded cursor-pointer top-1 right-7 bg-primary hover:bg-slate-600"
                              >
                                <Pencil className="text-white size-3" />
                              </label>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => field.onChange(null)}
                                className="absolute p-1 rounded cursor-pointer top-1 right-1 bg-primary hover:bg-slate-600"
                              >
                                <X className="text-white size-3" />
                              </button>
                            </>
                          ) : (
                            // Empty state uploader
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

                          {/* Hidden input */}
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
                                e.currentTarget.value = ""; // буруу бол reset
                                return;
                              }
                              field.onChange(file);
                            }}
                          />
                        </div>
                      );
                    }}
                  </FormItems>
                  <div>
                    <div className="flex gap-2">
                      <FormItems
                        control={form.control}
                        name={`icon`}
                        label="Icon сонгох"
                        className="flex flex-col items-start"
                      >
                        {(field) => {
                          const value = field.value;
                          return (
                            <IconPicker
                              value={value ? value : undefined}
                              onChange={(e) => field.onChange(e)}
                            />
                          );
                        }}
                      </FormItems>
                      <FormItems
                        control={form.control}
                        name={"view"}
                        label="Төлөв"
                        className={"col-span-2"}
                      >
                        {(field) => {
                          return (
                            <ComboBox
                              props={{ ...field }}
                              items={getEnumValues(ServiceView).map((item) => {
                                return {
                                  value: item.toString(),
                                  label: getValueServiceView[item].name,
                                };
                              })}
                            />
                          );
                        }}
                      </FormItems>
                    </div>
                    <FormItems
                      control={form.control}
                      name={`description`}
                      label="Тайлбар"
                      className="mt-2"
                    >
                      {(field) => {
                        const value = field.value;
                        return (
                          <Textarea
                            className=""
                            onChange={field.onChange}
                            value={value as string}
                          />
                        );
                      }}
                    </FormItems>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 max-w-lg w-full">
                  <Switch
                    checked={isAll ?? false}
                    onCheckedChange={(val) => form.setValue("isAll", val)}
                    id="compare-switch"
                  />
                  <label
                    htmlFor="compare-switch"
                    className="text-sm text-muted-foreground"
                  >
                    Бүх салбарын үйлчилгээ эсэх
                  </label>
                </div>
              </FormProvider>
            </Modal>
          }
        />
      </div>
    </div>
  );
};
