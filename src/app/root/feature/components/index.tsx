"use client";
import { DataTable } from "@/components/data-table";
import React, { useState } from "react";
import { ListType, ACTION, zStrOpt, zNumOpt, VALUES } from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { TextField } from "@/shared/components/text.field";
import { fetcher } from "@/hooks/fetcher";
import DynamicHeader from "@/components/dynamicHeader";
import { getColumns } from "./columns";
import { Feature, IFeature, IFeatures } from "@/models/home.model";
import { firstLetterUpper } from "@/lib/functions";
import { showToast } from "@/shared/components/showToast";
import { IconPicker } from "@/components/icons/picker";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: zStrOpt({
    label: "Нэр",
    allowNullable: false,
  }),
  description: zStrOpt({
    label: "Тайлбар",
  }),
  icon: zStrOpt({
    label: "Icon",
    allowNullable: false,
  }),
  index: zNumOpt({
    label: "Дараалал",
  }),
  edit: zStrOpt({}),
});
export type RootType = z.infer<typeof formSchema>;
type FormInput = z.input<typeof formSchema>; // optional тал
type FormOutput = z.output<typeof formSchema>;
const defaultValues = {
  title: "",
  description: "",

  index: null,
  icon: null,
  edit: null,
};
export const FeaturePage = ({ data }: { data: ListType<Feature> }) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [features, setFeatures] = useState<ListType<Feature>>(data);
  const deleteRoot = async (index: number, isHome: boolean) => {
    const id = features.items[index].id;
    const res = isHome
      ? await deleteOne(Api.home, id, "home")
      : await deleteOne(Api.home, id, "feature");
    refresh();
    return res.success;
  };
  const edit = async (e: IFeature) => {
    setOpen(true);
    // form.reset({ ...e, edit: e.id });
  };

  const columns = getColumns(edit, deleteRoot);

  const refresh = async () => {
    setAction(ACTION.RUNNING);
    await fetcher<Feature>(Api.home, {}, "web/feature").then((d) => {
      setFeatures(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    console.log(e);
    setAction(ACTION.RUNNING);
    const body = e as RootType;
    const { edit, ...payload } = body;
    let res;
    res = edit
      ? await updateOne<IFeature>(
          Api.home,
          edit as string,
          { ...payload, index: +(payload.index ?? "0") } as IFeature,
          "feature",
        )
      : await create<IFeature>(
          Api.home,
          { ...payload, index: +(payload.index ?? "0") } as IFeature,
          "feature",
        );

    if (res?.success) {
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
  const [search, setSearch] = useState("");

  return (
    <div className="">
      <DynamicHeader />

      <div className="admin-container">
        <DataTable
          columns={columns}
          count={features.count}
          data={features.items}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <div className="flex justify-end space-x-4">
              <Modal
                name="Feature"
                title="Feature форм"
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
                    <div className="grid grid-cols-1 gap-3 pt-5">
                      <FormItems control={form.control} name={`title`}>
                        {(field) => <TextField label="Нэр" props={field} />}
                      </FormItems>
                      <FormItems control={form.control} name={`index`}>
                        {(field) => (
                          <TextField label="Дараалал" props={field} />
                        )}
                      </FormItems>
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
                      <FormItems control={form.control} name={`icon`}>
                        {(field) => {
                          const value = field.value as any;
                          return (
                            <IconPicker
                              value={value ? value : undefined}
                              onChange={(e) => field.onChange(e)}
                            />
                          );
                        }}
                      </FormItems>
                    </div>
                  </div>
                </FormProvider>
              </Modal>
            </div>
          }
        />
      </div>
    </div>
  );
};
