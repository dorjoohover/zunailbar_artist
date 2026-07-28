"use client";
import { DataTable } from "@/components/data-table";
import { ListType, ACTION, PG, DEFAULT_PG, VALUES } from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { TextField } from "@/shared/components/text.field";
import { fetcher } from "@/hooks/fetcher";
import { getColumns } from "./columns";
import { useState } from "react";
import { Branch, IBranch } from "@/models";
import DynamicHeader from "@/components/dynamicHeader";
import { firstLetterUpper } from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";
import { INPUT_TYPE } from "@/lib/enum";

const formSchema = z.object({
  name: z.string().refine((data) => data.length > 0, {
    message: "Нэр оруулна уу",
  }),
  address: z.string().refine((data) => data.length > 0, {
    message: "Хаяг оруулна уу",
  }),
  url: z.string().refine((data) => data.length > 0, {
    message: "Байршил оруулна уу",
  }),
  order_days: z
    .preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z.number()
    )
    .refine((data) => data != null, {
      message: "Захиалга авах хоног оруулна уу",
    }) as unknown as number,
  edit: z.string().nullable().optional(),
});
const defaultValues = {
  name: "",
  order_days: 7,
  edit: undefined,
};
type BranchType = z.infer<typeof formSchema>;
export const BranchPage = ({ data }: { data: ListType<Branch> }) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<BranchType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [categories, setCategories] = useState<ListType<Branch>>(data);

  const deleteLog = async (index: number) => {
    const id = categories!.items[index].id;
    const res = await deleteOne(Api.branch, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IBranch) => {
    setOpen(true);
    form.reset({ ...e, edit: e.id });
  };
  const columns = getColumns(edit, deleteLog);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort, filter: searchValue } = pg;
    await fetcher<Branch>(Api.branch, {
      page,
      limit,
      sort,
      ...(searchValue && { name: searchValue }),
    }).then((d) => {
      setCategories(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as BranchType;
    const { edit, ...payload } = body;

    const res = edit
      ? await updateOne<Branch>(
          Api.branch,
          edit ?? "",
          payload as unknown as Branch
        )
      : await create<Branch>(Api.branch, e as Branch);
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

  return (
    <div className="">
      <DynamicHeader count={categories.count} />

      <div className="admin-container">
        <DataTable
          columns={columns}
          count={categories?.count}
          data={categories?.items ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              name={"Салбар нэмэх"}
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
                  <div className="">
                    <FormItems
                      label={"Салбарын нэр"}
                      control={form.control}
                      name={"name"}
                      className={"col-span-1 mb-4"}
                    >
                      {(field) => {
                        return <TextField props={{ ...field }} />;
                      }}
                    </FormItems>
                    <FormItems
                      label={"Захиалга авах хоног"}
                      control={form.control}
                      name={"order_days"}
                      className={"col-span-1 mb-4"}
                    >
                      {(field) => {
                        return (
                          <TextField
                            props={{ ...field }}
                            type={INPUT_TYPE.NUMBER}
                          />
                        );
                      }}
                    </FormItems>
                    <FormItems
                      label={"Салбарын хаяг"}
                      control={form.control}
                      name={"address"}
                      className={"col-span-1 mb-4"}
                    >
                      {(field) => {
                        return <TextField props={{ ...field }} />;
                      }}
                    </FormItems>
                    <FormItems
                      label={"Салбарын байршлын линк"}
                      control={form.control}
                      name={"url"}
                      className={"col-span-1 "}
                    >
                      {(field) => {
                        return <TextField props={{ ...field }} />;
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
