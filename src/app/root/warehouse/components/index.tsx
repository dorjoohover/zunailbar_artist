"use client";
import { DataTable } from "@/components/data-table";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  VALUES,
  ZValidator,
} from "@/lib/constants";
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
import { Warehouse, IWarehouse } from "@/models";
import DynamicHeader from "@/components/dynamicHeader";
import { firstLetterUpper } from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";

const formSchema = z.object({
  name: ZValidator.name,
  edit: z.string().nullable().optional(),
});
const defaultValues = {
  name: "",
  edit: undefined,
};
type WarehouseType = z.infer<typeof formSchema>;
export const ProductWarehousePage = ({
  data,
}: {
  data: ListType<Warehouse>;
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<WarehouseType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [categories, setCategories] = useState<ListType<Warehouse>>(data);

  const deleteLog = async (index: number) => {
    const id = categories!.items[index].id;
    const res = await deleteOne(Api.warehouse, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IWarehouse) => {
    setOpen(true);
    form.reset({ ...e, edit: e.id });
  };
  const columns = getColumns(edit, deleteLog);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort, filter: searchValue } = pg;
    await fetcher<Warehouse>(Api.warehouse, {
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
    const body = e as WarehouseType;
    const { edit, ...payload } = body;

    const res = edit
      ? await updateOne<Warehouse>(
          Api.warehouse,
          edit ?? "",
          payload as unknown as Warehouse
        )
      : await create<Warehouse>(Api.warehouse, e as Warehouse);
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
      <DynamicHeader count={categories?.count} />

      <div className="admin-container">
        <DataTable
          columns={columns}
          count={categories?.count}
          data={categories?.items ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              name={"Агуулах нэмэх"}
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
                      label={"Агуулахын нэр"}
                      control={form.control}
                      name={"name"}
                      className={"col-span-1"}
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
