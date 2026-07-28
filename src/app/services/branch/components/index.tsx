"use client";
import { DataTable } from "@/components/data-table";
import { Branch, BranchService, IBranchService, Service } from "@/models";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  Option,
  VALUES,
  zStrOpt,
  zNumOpt,
  getEnumValues,
  getValuesStatus,
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
import { INPUT_TYPE, STATUS } from "@/lib/enum";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z
  .object({
    branch_id: zStrOpt({}),
    service_id: zStrOpt({}),
    max_price: zNumOpt(),
    status: zNumOpt(),
    min_price: zNumOpt({
      allowNullable: false,
      label: "Үнэ",
    }),
    pre: zNumOpt({
      allowNullable: false,
      label: "Урьдчилгаа",
    }),
    duration: zNumOpt({
      allowNullable: false,
      label: "Хугацаа",
    }),
    edit: zStrOpt({}),
    custom_name: zStrOpt({}),
    custom_description: zStrOpt({}),
    service_count: zNumOpt({
      allowNullable: false,
      label: "Тоо хэмжээ",
    }),
    index: zNumOpt(),
    meta: z.any(),
  })
  .refine(
    (data) =>
      data.max_price === null || data.max_price === undefined
        ? true
        : data.max_price >= (data.min_price ?? 0),
    {
      message: "Их үнэ бага үнээс хямд байна байж болохгүй",
      path: ["max_price"],
    },
  )
  .refine(
    (data) => (data?.pre ?? 0) <= (data?.max_price ?? data?.min_price ?? 0),
    {
      message: "Урьдчилгаа нийт дүнгээс хэтэрч болохгүй",
      path: ["pre"],
    },
  );

const defaultValues: BranchServiceType = {
  branch_id: "",
  max_price: undefined,
  min_price: 0,
  pre: 0,
  duration: 0,
  edit: undefined,
  service_id: "",
  status: undefined,
  custom_description: undefined,
  custom_name: undefined,
  index: undefined,
  service_count: undefined,
  meta: undefined,
};
type FilterType = {
  branch?: string;
  service?: string;
  status?: STATUS;
};
type BranchServiceType = z.infer<typeof formSchema>;
export const BranchServicePage = ({
  data,
  branches,
  services,
}: {
  data: ListType<BranchService>;
  branches: ListType<Branch>;
  services: ListType<Service>;
}) => {
  const firstBranch = branches.items?.[0]?.id;
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<BranchServiceType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [branchServices, setBranchServices] =
    useState<ListType<BranchService> | null>(null);
  const branchMap = useMemo(
    () => new Map(branches.items.map((b) => [b.id, b])),
    [branches.items],
  );

  const branchServiceFormatter = (data: ListType<BranchService>) => {
    const items: BranchService[] = data.items.map((item) => {
      const branch = branchMap.get(item.branch_id);

      return {
        ...item,
        branch_name: branch?.name ?? "",
      };
    });

    setBranchServices({ items, count: data.count });
  };
  useEffect(() => {
    branchServiceFormatter(data);
  }, [data]);
  const clear = () => {
    form.reset(defaultValues);
  };
  const deleteBranchService = async (index: number) => {
    const id = branchServices!.items[index].id;
    const res = await deleteOne(Api.branch_service, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IBranchService) => {
    setOpen(true);
    form.reset({ ...e, edit: e.id });
  };
  const columns = getColumns(edit, deleteBranchService);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const branch_id = filter?.branch;
    const service_id = filter?.service;
    const status = filter?.status;
    await fetcher<BranchService>(Api.branch_service, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      branch_id,
      service_id,
      status,
      ...pg,
    }).then((d) => {
      branchServiceFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);

    const { edit, meta, ...body } = e as BranchServiceType;
    let payload = {
      ...(body as unknown as IBranchService),
      service_count:
        body.service_count == 0 ? null : (body.service_count ?? null),
    };
    const res = edit
      ? await updateOne<BranchService>(
          Api.branch_service,
          (edit as string) ?? "",
          payload as unknown as BranchService,
        )
      : await create<BranchService>(Api.branch_service, e as BranchService);
    if (res.success) {
      refresh();
      setOpen(false);
      showToast(
        "success",
        edit ? "Мэдээлэл засагдсан!" : "Амжилттай нэмэгдлээ!",
      );
      clear();
    } else {
      showToast("info", res.error ?? "Алдаа гарлаа");
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
  const [filter, setFilter] = useState<FilterType>({
    branch: firstBranch,
    service: undefined,
    status: STATUS.Active,
  });
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refresh();
  }, [filter]);
  const changeFilter = (key: string, value: number | string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const groups: { key: keyof FilterType; label: string; items: Option[] }[] =
    useMemo(
      () => [
        {
          key: "branch",
          label: "Салбар",
          items: branches.items.map((b) => ({ value: b.id, label: b.name })),
        },
        {
          key: "service",
          label: "Үйлчилгээ",
          items: services.items.map((b) => ({ value: b.id, label: b.name })),
        },
        {
          key: "status",
          label: "Төлөв",
          items: [STATUS.Active, STATUS.Hidden].map((b) => {
            return {
              value: b,
              label: getValuesStatus[b].name,
            };
          }),
        },
      ],
      [branches.items, services.items],
    );
  const resetFilter = () => {
    setFilter({
      branch: firstBranch,
      service: undefined,
      status: STATUS.Active,
    });
    refresh();
  };
  return (
    <div className="">
      <DynamicHeader />

      <div className="admin-container">
        <DataTable
          clear={resetFilter}
          search={false}
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
          count={branchServices?.count}
          data={branchServices?.items ?? []}
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
                  <FormItems
                    label="Үйлчилгээ"
                    control={form.control}
                    name="service_id"
                  >
                    {(field) => {
                      return (
                        <ComboBox
                          props={{ ...field }}
                          items={services.items.map((item) => {
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
                      key: "custom_name",
                      label: "Тухайн салбарт зориулсан үйлчилгээний нэр",
                      type: INPUT_TYPE.TEXT,
                    },
                  ].map((item, i) => {
                    const name = item.key as keyof BranchServiceType;
                    const label = item.label as keyof BranchServiceType;
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
                  <FormItems
                    control={form.control}
                    name={`custom_description`}
                    label="Салбарын тайлбар"
                    className="mt-2"
                  >
                    {(field) => {
                      const value = field.value;
                      return (
                        <Textarea
                          className=""
                          onChange={field.onChange}
                          value={`${value ?? ""}`}
                        />
                      );
                    }}
                  </FormItems>
                </div>

                <div className="divide-x-gray"></div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    {
                      key: "min_price",
                      type: INPUT_TYPE.MONEY,
                      label: "Үнэ",
                    },
                    {
                      key: "max_price",
                      type: INPUT_TYPE.MONEY,
                      label: "Их үнэ",
                    },
                    {
                      key: "pre",
                      type: INPUT_TYPE.MONEY,
                      label: "Урьдчилгаа",
                    },
                    {
                      key: "duration",
                      type: INPUT_TYPE.NUMBER,
                      label: "Хугацаа",
                    },
                    {
                      key: "service_count",
                      type: INPUT_TYPE.NUMBER,
                      label: "Үйлчилгээний тоо хэмжээ",
                    },
                  ].map((item, i) => {
                    const name = item.key as keyof BranchServiceType;
                    const label = item.label as keyof BranchServiceType;

                    return (
                      <FormItems
                        label={label}
                        control={form.control}
                        name={name}
                        key={i}
                      >
                        {(field) => (
                          <TextField props={{ ...field }} type={item.type} />
                        )}
                      </FormItems>
                    );
                  })}

                 
                  <FormItems
                    control={form.control}
                    name={"status"}
                    label="Төлөв"
                  >
                    {(field) => (
                      <ComboBox
                        props={{ ...field }}
                        items={[STATUS.Active, STATUS.Hidden].map((item) => ({
                          value: item.toString(),
                          label: getValuesStatus[item].name,
                        }))}
                      />
                    )}
                  </FormItems>

                  <FormItems
                    control={form.control}
                    name={"meta"}
                    label="Үйлчилгээний нэр"
                  >
                    {(field) => {
                      const value = field.value;
                      return (
                        <TextField
                          props={{
                            name: "serviceName",
                            disabled: true,
                            value: value?.serviceName ?? "",
                            onBlur: () => {},
                            onChange: () => {},
                            ref: () => null,
                          }}
                          type={INPUT_TYPE.TEXT}
                        />
                      );
                    }}
                  </FormItems>

                  <FormItems
                    control={form.control}
                    name={"meta"}
                    label="Давхар эсэх"
                  >
                    {(field) => {
                      const value = field.value;
                      return (
                        <TextField
                          props={{
                            name: "parallel",
                            disabled: true,
                            value: value?.parallel ? "Тийм" : "Үгүй",
                            onBlur: () => {},
                            onChange: () => {},
                            ref: () => null,
                          }}
                          type={INPUT_TYPE.TEXT}
                        />
                      );
                    }}
                  </FormItems>

                  {/* Тайлбар бүтэн мөр эзэлнэ */}
                  <FormItems
                    control={form.control}
                    name={"meta"}
                    label="Тайлбар"
                    className="col-span-2"
                  >
                    {(field) => {
                      const value = field.value;
                      return (
                        <Textarea
                          disabled
                          value={value?.description ?? ""}
                          onChange={() => {}}
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
