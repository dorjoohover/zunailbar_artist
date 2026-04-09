"use client";
import { DataTable } from "@/components/data-table";
import { useEffect, useMemo, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  getEnumValues,
  ListDefault,
  SalaryLogValues,
  VALUES,
  ZValidator,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, excel, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { TextField } from "@/shared/components/text.field";
import { fetcher } from "@/hooks/fetcher";
import { getColumns } from "./columns";
import DynamicHeader from "@/components/dynamicHeader";
import { INPUT_TYPE, SalaryLogStatus } from "@/lib/enum";
import { ISalaryLog, SalaryLog, User } from "@/models";
import {
  firstLetterUpper,
  mnDate,
  mnDateFormat,
  usernameFormatter,
} from "@/lib/functions";
import { DatePicker } from "@/shared/components/date.picker";
import { showToast } from "@/shared/components/showToast";

const formSchema = z.object({
  date: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date(),
  ) as unknown as Date,
  salary_status: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(SalaryLogStatus).nullable(),
    )
    .optional() as unknown as number,
  amount: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number(),
  ) as unknown as number,
  order_count: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number(),
  ) as unknown as number,
  artist_id: ZValidator.user,
  user_name: z.string(),
  edit: z.string().nullable().optional(),
});
const defaultValues = {
  date: new Date(),
  salary_status: undefined,
  amount: 0,
  order_count: 0,
  artist_id: "",
  user_name: "",
  edit: undefined,
};
type SalaryType = z.infer<typeof formSchema>;

const toFormDate = (value: Date | string) => {
  if (value instanceof Date) {
    return value;
  }

  if (!value) {
    return new Date();
  }

  return new Date(
    value.includes("T") ? value : `${value}T00:00:00`,
  );
};

export const SalaryPage = ({
  data,
  users,
}: {
  data: ListType<SalaryLog>;
  users: ListType<User>;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<SalaryType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [salaries, setSalaries] = useState<ListType<SalaryLog>>(ListDefault);
  const deleteLog = async (index: number) => {
    const id = salaries!.items[index].id;
    const res = await deleteOne(Api.integration, id);
    refresh();
    return res.success;
  };
  const edit = async (e: ISalaryLog) => {
    setOpen(true);
    form.reset({
      ...e,
      date: toFormDate(e.date),
      edit: e.id,
    });
  };
  const userMap = useMemo(
    () => new Map(users.items.map((b) => [b.id, b])),
    [users.items],
  );

  const userFormatter = (data: ListType<SalaryLog>) => {
    const items: SalaryLog[] = data.items.map((item) => {
      const user = userMap.get(item.artist_id);

      return {
        ...item,
        user_name: user ? usernameFormatter(user) : "",
      };
    });
    setSalaries({ items, count: data.count });
  };

  useEffect(() => {
    userFormatter(data);
  }, [data]);
  const columns = getColumns(edit, deleteLog);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    await fetcher<SalaryLog>(Api.integration, {
      page: page ?? DEFAULT_PG.page,
      limit: limit ?? DEFAULT_PG.limit,
      sort: sort ?? DEFAULT_PG.sort,
      ...pg,
    }).then((d) => {
      userFormatter(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as SalaryType;
    const { edit, user_name, ...payload } = body;
    const requestBody = {
      ...payload,
      date: mnDateFormat(body.date as Date),
    } as unknown as ISalaryLog;

    const res = edit
      ? await updateOne<ISalaryLog>(
          Api.integration,
          edit ?? "",
          requestBody,
        )
      : await create<ISalaryLog>(Api.integration, requestBody);
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
  const downloadExcel = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort } = pg;
    const res = await excel(Api.integration, {
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
        `salary_${mnDate().toISOString().slice(0, 10)}.xlsx`,
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
  return (
    <div className="">
      <DynamicHeader />

      <div className="admin-container">
        <DataTable
          columns={columns}
          count={salaries?.count}
          data={salaries?.items ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          excel={downloadExcel}
          modalAdd={
            <Modal
              maw="xl"
              name={"Цалин нэмэх"}
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
                  <div className="double-col">
                    <FormItems
                      label="Статус"
                      control={form.control}
                      name="salary_status"
                      className={"col-span-1"}
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            props={{ ...field }}
                            items={getEnumValues(SalaryLogStatus).map(
                              (item) => {
                                return {
                                  value: item.toString(),
                                  label: SalaryLogValues[item].name,
                                };
                              },
                            )}
                          />
                        );
                      }}
                    </FormItems>
                    <FormItems
                      label="Нэр"
                      control={form.control}
                      name="artist_id"
                      className={"col-span-1"}
                    >
                      {(field) => {
                        return (
                          <ComboBox
                            props={{ ...field }}
                            items={users.items.map((item) => {
                              return {
                                value: item.id,
                                label: usernameFormatter(item),
                              };
                            })}
                          />
                        );
                      }}
                    </FormItems>
                    <FormItems label="Огноо" control={form.control} name="date">
                      {(field) => {
                        return (
                          <DatePicker
                            name=""
                            pl="Огноо сонгох"
                            value={field.value as any}
                            onChange={(e) => field.onChange(e)}
                          />
                        );
                      }}
                    </FormItems>
                    <FormItems
                      control={form.control}
                      name="order_count"
                      label="Нийт хийсэн үйлчилгээ"
                    >
                      {(field) => {
                        return (
                          <TextField
                            props={{
                              name: "order_count",
                              onBlur: () => {},
                              onChange: () => {},
                              disabled: true,
                              ref: () => {},
                              value: form.getValues("order_count"),
                            }}
                            type={INPUT_TYPE.NUMBER}
                          />
                        );
                      }}
                    </FormItems>
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
