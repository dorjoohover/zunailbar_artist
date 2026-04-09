"use client";

import { DataTable } from "@/components/data-table";
import {
  Branch,
  Brand,
  Category,
  IProduct,
  IVoucher,
  Product,
  Service,
  User,
  Voucher,
} from "@/models";
import { useEffect, useMemo, useState } from "react";
import {
  ListType,
  ACTION,
  PG,
  DEFAULT_PG,
  getEnumValues,
  SearchType,
  VALUES,
  ZValidator,
} from "@/lib/constants";
import { Modal } from "@/shared/components/modal";
import z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, search, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import { TextField } from "@/shared/components/text.field";
import { fetcher } from "@/hooks/fetcher";
import { getColumns } from "./columns";
import {
  firstLetterUpper,
  searchFormatter,
  usernameFormatter,
} from "@/lib/functions";
import ContainerHeader from "@/components/containerHeader";
import DynamicHeader from "@/components/dynamicHeader";
import { showToast } from "@/shared/components/showToast";
import { INPUT_TYPE } from "@/lib/enum";

const formSchema = z.object({
  branch_id: ZValidator.branch,
  name: ZValidator.name,
  max_price: z
    .preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z.number()
    )
    .nullable()
    .optional() as unknown as number,
  min_price: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number()
  ) as unknown as number,
  duration: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number()
  ) as unknown as number,
  edit: z.string().nullable().optional(),
});
const defaultValues: VoucherType = {
  branch_id: "",
  name: "",
  max_price: null,
  min_price: 0,
  duration: 0,
  edit: undefined,
};
type VoucherType = z.infer<typeof formSchema>;
export const VoucherPage = ({
  data,
  services,
}: {
  data: ListType<Voucher>;
  services: SearchType<Service>[];
}) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const [open, setOpen] = useState<undefined | boolean>(false);
  const form = useForm<VoucherType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [vouchers, setVouchers] = useState<ListType<Voucher> | null>(null);
  const serviceMap = useMemo(
    () => new Map(services.map((b) => [b.id, b.value])),
    [services]
  );

  const voucherFormatter = (data: ListType<Voucher>) => {
    const items: Voucher[] = data.items.map((item) => {
      const service = serviceMap.get(item.service_id);

      return {
        ...item,
        service_name: searchFormatter(service ?? "") ?? "",
      };
    });

    setVouchers({ items, count: data.count });
  };
  useEffect(() => {
    voucherFormatter(data);
  }, [data]);
  const clear = () => {
    form.reset(defaultValues);
    console.log(form.getValues());
  };
  const deleteVoucher = async (index: number) => {
    const id = vouchers!.items[index].id;
    const res = await deleteOne(Api.voucher, id);
    refresh();
    return res.success;
  };
  const edit = async (e: IVoucher) => {
    setOpen(true);
    form.reset({ ...e, edit: e.id });
  };
  const columns = getColumns(edit, deleteVoucher);

  const refresh = async (pg: PG = DEFAULT_PG) => {
    setAction(ACTION.RUNNING);
    const { page, limit, sort, filter: searchValue } = pg;
    await fetcher<Voucher>(Api.voucher, {
      page,
      limit,
      sort,
      ...(searchValue && { name: searchValue }),
    }).then((d) => {
      voucherFormatter(d);
      console.log(d);
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async <T,>(e: T) => {
    setAction(ACTION.RUNNING);
    const body = e as VoucherType;
    const { edit, ...payload } = body;
    const res = edit
      ? await updateOne<Voucher>(
          Api.voucher,
          edit ?? "",
          payload as unknown as Voucher
        )
      : await create<Voucher>(Api.voucher, e as Voucher);
    console.log(res);
    if (res.success) {
      refresh();
      setOpen(false);
      clear();
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

  const [items, setItems] = useState({
    [Api.service]: services,
  });
  const searchField = async (v: string, key: Api, edit?: boolean) => {
    let value = "";
    if (v.length > 1) value = v;
    if (v.length == 1) return;

    const payload = { id: value };

    await search(key as any, {
      ...payload,
      limit: 20,
      page: 0,
    }).then((d) => {
      console.log(key, d.data);
      setItems((prev) => ({
        ...prev,
        [key]: d.data,
      }));
    });
  };

  return (
    <div className="">
      <DynamicHeader count={vouchers?.count} />

      <div className="admin-container">
        <DataTable
          columns={columns}
          count={vouchers?.count}
          data={vouchers?.items ?? []}
          refresh={refresh}
          loading={action == ACTION.RUNNING}
          modalAdd={
            <Modal
              name={"Хөнгөлөлт нэмэх"}
              submit={() => form.handleSubmit(onSubmit, onInvalid)()}
              open={open == true}
              setOpen={(v) => {
                setOpen(v);
                clear();
              }}
              loading={action == ACTION.RUNNING}
            >
              <FormProvider {...form}>
                <div className="space-y-4">
                  <FormItems control={form.control} name="branch_id">
                    {(field) => {
                      return (
                        <ComboBox
                          search={(e) => searchField(e, Api.service)}
                          props={{ ...field }}
                          items={items[Api.service].map((item) => {
                            return {
                              value: item.id ?? "",
                              label: searchFormatter(item.value ?? "") ?? "",
                            };
                          })}
                        />
                      );
                    }}
                  </FormItems>

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
                      key: "duration",
                      type: INPUT_TYPE.NUMBER,
                      label: "Хугацаа",
                    },
                  ].map((item, i) => {
                    const name = item.key as keyof VoucherType;
                    const label = item.label as keyof VoucherType;
                    return (
                      <FormItems
                        control={form.control}
                        name={name}
                        key={i}
                        className={item.key === "name" ? "col-span-2" : ""}
                      >
                        {(field) => {
                          return (
                            <TextField
                              props={{ ...field }}
                              type={item.type}
                              label={label}
                            />
                          );
                        }}
                      </FormItems>
                    );
                  })}
                </div>
              </FormProvider>
            </Modal>
          }
        />
      </div>
    </div>
  );
};
