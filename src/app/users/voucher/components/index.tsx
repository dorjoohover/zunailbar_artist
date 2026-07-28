"use client";

import { DataTable } from "@/components/data-table";
import DynamicHeader from "@/components/dynamicHeader";
import { Modal } from "@/shared/components/modal";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { TextField } from "@/shared/components/text.field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Api } from "@/utils/api";
import { create, deleteOne, search, updateOne } from "@/app/(api)";
import { fetcher } from "@/hooks/fetcher";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import z from "zod";
import {
  ACTION,
  CUSTOMER_USER_LEVELS,
  DEFAULT_PG,
  getUserLevelValue,
  getVoucherStatusValue,
  getVoucherTypeValue,
  ListDefault,
  ListType,
  PG,
  SearchType,
} from "@/lib/constants";
import { firstLetterUpper, mobileFormatter } from "@/lib/functions";
import { INPUT_TYPE, ROLE, UserLevel, VoucherStatus, VOUCHER } from "@/lib/enum";
import { showToast } from "@/shared/components/showToast";
import { IVoucher, User, Voucher } from "@/models";
import { getColumns } from "./columns";

type RewardConfigItem = {
  name: string;
  type: VOUCHER;
  value: number;
};

type RewardConfig = {
  customer: Partial<Record<UserLevel, RewardConfigItem>>;
};

const defaultRewardConfig: RewardConfig = {
  customer: CUSTOMER_USER_LEVELS.reduce(
    (acc, level) => {
      acc[level] = {
        name: `${getUserLevelValue[level].name} урамшуулал`,
        type: VOUCHER.Price,
        value: 0,
      };
      return acc;
    },
    {} as Partial<Record<UserLevel, RewardConfigItem>>,
  ),
};

const normalizeRewardConfig = (value: any): RewardConfig => {
  const normalized = { ...defaultRewardConfig, customer: { ...defaultRewardConfig.customer } };

  CUSTOMER_USER_LEVELS.forEach((level) => {
    const current = value?.customer?.[level] ?? value?.[level];
    if (!current) return;

    normalized.customer[level] = {
      name: current.name ?? defaultRewardConfig.customer[level]?.name ?? "",
      type: Number(current.type ?? defaultRewardConfig.customer[level]?.type ?? VOUCHER.Price) as VOUCHER,
      value: Number(current.value ?? defaultRewardConfig.customer[level]?.value ?? 0),
    };
  });

  return normalized;
};

const formSchema = z.object({
  user_id: z.string().min(1, { message: "Хэрэглэгч сонгоно уу" }),
  name: z.string().min(1, { message: "Нэр оруулна уу" }),
  type: z.preprocess(
    (value) => (typeof value === "string" ? parseInt(value, 10) : value),
    z.nativeEnum(VOUCHER),
  ),
  value: z.preprocess(
    (value) => (typeof value === "string" ? parseFloat(value) : value),
    z.number().min(1, { message: "Дүн оруулна уу" }),
  ),
  note: z.string().nullable().optional(),
  edit: z.string().nullable().optional(),
});

type VoucherForm = z.infer<typeof formSchema>;
type FilterType = {
  voucher_status?: VoucherStatus;
  level?: UserLevel;
};

const defaultValues: VoucherForm = {
  user_id: "",
  name: "",
  type: VOUCHER.Price,
  value: 0,
  note: "",
  edit: undefined,
};

export const VoucherPage = ({
  data,
  customers,
  config,
}: {
  data: ListType<Voucher>;
  customers: SearchType<User>[];
  config: any;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [vouchers, setVouchers] = useState<ListType<Voucher>>(ListDefault);
  const [customerItems, setCustomerItems] = useState<SearchType<User>[]>(customers);
  const [filter, setFilter] = useState<FilterType>({});
  const [rewardConfig, setRewardConfig] = useState<RewardConfig>(
    normalizeRewardConfig(config),
  );
  const isFirstRender = useRef(true);

  const form = useForm<VoucherForm>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    setVouchers(data);
  }, [data]);

  useEffect(() => {
    setRewardConfig(normalizeRewardConfig(config));
  }, [config]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    refresh();
  }, [filter]);

  const summary = useMemo(() => {
    return vouchers.items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.voucher_status === VoucherStatus.Available) acc.available += 1;
        if (item.voucher_status === VoucherStatus.Used) acc.used += 1;
        if (item.voucher_status === VoucherStatus.Cancelled) acc.cancelled += 1;
        return acc;
      },
      {
        total: 0,
        available: 0,
        used: 0,
        cancelled: 0,
      },
    );
  }, [vouchers.items]);

  const clear = () => {
    form.reset(defaultValues);
  };

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort, filter: searchValue } = pg;

    const result = await fetcher<Voucher>(Api.voucher, {
      page,
      limit,
      sort,
      ...(searchValue && { name: searchValue }),
      ...(filter.voucher_status && { voucher_status: filter.voucher_status }),
      ...(filter.level !== undefined && { level: filter.level }),
    });

    setVouchers(result);
    setAction(ACTION.DEFAULT);
  };

  const searchCustomers = async (value: string) => {
    if (value.length === 1) return;

    const result = await search<User>(Api.user, {
      id: value.length > 1 ? value : "",
      role: ROLE.CLIENT,
      limit: 20,
      page: 0,
    });

    setCustomerItems(result.data);
  };

  const deleteVoucher = async (voucher: IVoucher) => {
    if (!voucher.id) return false;
    const res = await deleteOne(Api.voucher, voucher.id);
    if (res.success) {
      await refresh();
    }
    return res.success;
  };

  const editVoucher = (voucher: IVoucher) => {
    if (!voucher.id) return;
    form.reset({
      user_id: voucher.user_id,
      name: voucher.name,
      type: voucher.type,
      value: voucher.value,
      note: voucher.note ?? "",
      edit: voucher.id,
    });
    setOpen(true);
  };

  const onSubmit = async (value: VoucherForm) => {
    setAction(ACTION.RUNNING);
    const { edit, ...payload } = value;
    const res = edit
      ? await updateOne(Api.voucher, edit, payload as Voucher)
      : await create(Api.voucher, payload as Voucher);

    if (res.success) {
      await refresh();
      setOpen(false);
      clear();
      showToast("success", edit ? "Урамшуулал шинэчиллээ" : "Урамшуулал нэмэгдлээ");
    } else {
      showToast("error", res.error ?? "Алдаа гарлаа");
    }

    setAction(ACTION.DEFAULT);
  };

  const onInvalid = (error: any) => {
    const message = Object.values(error ?? {})
      .map((item: any) => item?.message)
      .filter(Boolean)
      .join(", ");
    showToast("info", message || "Мэдээллээ шалгана уу");
  };

  const saveConfig = async () => {
    setAction(ACTION.RUNNING);
    const res = await updateOne(Api.voucher, "config", rewardConfig as any);
    if (res.success) {
      setConfigOpen(false);
      showToast("success", "Урамшууллын тохиргоо шинэчлэгдлээ");
    } else {
      showToast("error", res.error ?? "Алдаа гарлаа");
    }
    setAction(ACTION.DEFAULT);
  };

  const changeFilter = (key: keyof FilterType, value?: string) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value ? Number(value) : undefined,
    }));
  };

  const columns = getColumns(editVoucher, deleteVoucher);

  return (
    <div className="">
      <DynamicHeader count={vouchers.count} />

      <div className="admin-container space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Нийт урамшуулал", value: summary.total },
            { label: "Идэвхтэй", value: summary.available },
            { label: "Ашигласан", value: summary.used },
            { label: "Цуцалсан", value: summary.cancelled },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border bg-white px-4 py-3 shadow-light"
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <DataTable
          columns={columns}
          count={vouchers.count}
          data={vouchers.items}
          refresh={refresh}
          loading={action === ACTION.RUNNING}
          clear={() => setFilter({})}
          filter={
            <>
              <label>
                <span className="filter-label">Төлөв</span>
                <ComboBox
                  name="Төлөв"
                  className="max-w-40"
                  props={{
                    name: "voucher_status",
                    value: filter.voucher_status?.toString() ?? "",
                    onChange: (value: string) => changeFilter("voucher_status", value),
                    onBlur: () => {},
                    ref: () => {},
                  }}
                  items={Object.entries(getVoucherStatusValue).map(([key, value]) => ({
                    value: key,
                    label: value.name,
                  }))}
                />
              </label>
              <label>
                <span className="filter-label">Түвшин</span>
                <ComboBox
                  name="Түвшин"
                  className="max-w-40"
                  props={{
                    name: "level",
                    value: filter.level?.toString() ?? "",
                    onChange: (value: string) => changeFilter("level", value),
                    onBlur: () => {},
                    ref: () => {},
                  }}
                  items={CUSTOMER_USER_LEVELS.map((level) => ({
                    value: level.toString(),
                    label: getUserLevelValue[level].name,
                  }))}
                />
              </label>
            </>
          }
          filterRight={
            <Button onClick={() => setConfigOpen(true)}>Урамшууллын тохиргоо</Button>
          }
          modalAdd={
            <Modal
              maw="md"
              name="Урамшуулал нэмэх"
              title={form.watch("edit") ? "Урамшуулал засах" : "Урамшуулал нэмэх"}
              submit={() => form.handleSubmit(onSubmit as any, onInvalid)()}
              open={open}
              setOpen={(value) => {
                setOpen(value);
                if (!value) clear();
              }}
              loading={action === ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="space-y-4">
                  <FormItems control={form.control as any} name="user_id" label="Хэрэглэгч">
                    {(field) => (
                      <ComboBox
                        search={searchCustomers}
                        props={{ ...field }}
                        items={customerItems.map((item) => {
                          const [mobile, nickname] = item.value?.split("__") ?? ["", ""];
                          return {
                            value: item.id,
                            label: `${mobileFormatter(mobile)} ${firstLetterUpper(
                              nickname ?? "",
                            )}`,
                          };
                        })}
                      />
                    )}
                  </FormItems>
                  <FormItems control={form.control as any} name="name" label="Урамшууллын нэр">
                    {(field) => <TextField props={{ ...field }} />}
                  </FormItems>
                  <div className="double-col">
                    <FormItems control={form.control as any} name="type" label="Төрөл">
                      {(field) => (
                        <ComboBox
                          props={{ ...field }}
                          items={Object.entries(getVoucherTypeValue).map(([key, value]) => ({
                            value: key,
                            label: value,
                          }))}
                        />
                      )}
                    </FormItems>
                    <FormItems control={form.control as any} name="value" label="Дүн">
                      {(field) => (
                        <TextField type={INPUT_TYPE.MONEY} props={{ ...field }} />
                      )}
                    </FormItems>
                  </div>
                  <FormItems control={form.control as any} name="note" label="Тайлбар">
                    {(field) => (
                      <Textarea
                        value={(field.value as string) ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  </FormItems>
                </div>
              </FormProvider>
            </Modal>
          }
        />

        <Modal
          maw="2xl"
          open={configOpen}
          setOpen={setConfigOpen}
          title="Лояалти урамшууллын тохиргоо"
          submit={saveConfig}
          loading={action === ACTION.RUNNING}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Хэрэглэгч түвшин ахих үед автоматаар олгогдох урамшууллын нэр,
              төрөл, дүнг эндээс удирдана.
            </p>
            {CUSTOMER_USER_LEVELS.map((level) => {
              const item = rewardConfig.customer[level] ?? defaultRewardConfig.customer[level]!;
              return (
                <div key={level} className="rounded-xl border p-4">
                  <p className="mb-3 font-semibold">{getUserLevelValue[level].name}</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm">Нэр</label>
                      <TextField
                        props={{
                          name: `${level}_name`,
                          value: item.name,
                          onChange: (value: string) =>
                            setRewardConfig((prev) => ({
                              ...prev,
                              customer: {
                                ...prev.customer,
                                [level]: {
                                  ...(prev.customer[level] ?? item),
                                  name: value,
                                },
                              },
                            })),
                          onBlur: () => {},
                          ref: () => null,
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Төрөл</label>
                      <ComboBox
                        props={{
                          name: `${level}_type`,
                          value: item.type.toString(),
                          onChange: (value: string) =>
                            setRewardConfig((prev) => ({
                              ...prev,
                              customer: {
                                ...prev.customer,
                                [level]: {
                                  ...(prev.customer[level] ?? item),
                                  type: Number(value) as VOUCHER,
                                },
                              },
                            })),
                          onBlur: () => {},
                          ref: () => null,
                        }}
                        items={Object.entries(getVoucherTypeValue).map(([key, value]) => ({
                          value: key,
                          label: value,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Дүн</label>
                      <TextField
                        type={INPUT_TYPE.MONEY}
                        props={{
                          name: `${level}_value`,
                          value: item.value,
                          onChange: (value: string) =>
                            setRewardConfig((prev) => ({
                              ...prev,
                              customer: {
                                ...prev.customer,
                                [level]: {
                                  ...(prev.customer[level] ?? item),
                                  value: Number(value || 0),
                                },
                              },
                            })),
                          onBlur: () => {},
                          ref: () => null,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      </div>
    </div>
  );
};
