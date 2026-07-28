"use client";
import { useEffect, useState } from "react";
import { ListType, ACTION, VALUES } from "@/lib/constants";
import z from "zod";
import { FormProvider, Path, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Api } from "@/utils/api";
import { create, deleteOne, updateOne } from "@/app/(api)";
import { FormItems } from "@/shared/components/form.field";
import { TextField } from "@/shared/components/text.field";
import { fetcher } from "@/hooks/fetcher";

import DynamicHeader from "@/components/dynamicHeader";
import { Home, IHome, IHomes } from "@/models/home.model";
import { Pencil, Save, UploadCloud, X } from "lucide-react";
import { firstLetterUpper, numberArray } from "@/lib/functions";
import { Button } from "@/components/ui/button";
import { imageUploader } from "@/app/(api)/base";
import { showToast } from "@/shared/components/showToast";
import { ImagePreview } from "@/components/image_preview";

const homeSchema = z.object({
  image: z.string().nullable().optional(),
  artist_name: z.string().nullable().optional(),
  file: z.any().nullable().optional(),
  name: z.string().nullable().optional(),
  index: z.number().nullable().optional(),
});

const HOME_FIELDS: Array<{ key: keyof Home; label: string }> = [
  { key: "artist_name", label: "Артист нэр" },
  { key: "name", label: "Нэр" },
];

const formSchema = z.object({
  homes: z.array(homeSchema).nullable().optional(),
  edit: z.string().nullable().optional(),
});
export type RootType = z.infer<typeof formSchema>;
export type HomeType = z.infer<typeof homeSchema>;
type FormInput = z.input<typeof formSchema>; // optional тал
type FormOutput = z.output<typeof formSchema>;

export const HomePage = ({ data }: { data: ListType<Home> }) => {
  const [action, setAction] = useState(ACTION.DEFAULT);
  const makeEmptyHome = (idx1: number): HomeType => ({
    artist_name: "",
    name: "",
    index: idx1, // 1-based хадгалъя
  });
  const normalizeHomes = (items: Home[] | undefined) => {
    const base: HomeType[] = Array.from({ length: 12 }, (_, i) =>
      makeEmptyHome(i + 1)
    );

    if (!items?.length) return base;

    for (const it of items) {
      const pos = (it.index ?? 1) - 1; // 1-based → 0-based
      if (pos < 0) continue;

      base[pos] = {
        ...base[pos],
        artist_name: it.artist_name ?? "",
        name: it.name ?? "",
        image: it.image ?? null, // хүсвэл энд бүрэн URL болгож болно
        index: it.index ?? pos + 1,
      };
    }

    return [{}, ...base];
  };

  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(formSchema),
  });
  useEffect(() => {
    const homes = normalizeHomes(data?.items);
    form.reset(
      { ...form.getValues(), homes },
      { keepDirtyValues: true } // хүсвэл false болгоод бүрэн шинэчилж болно
    );
  }, [data?.items]);

  const [homes, setHome] = useState<ListType<Home>>(data);
  const deleteRoot = async (index: number) => {
    const id = homes.items[index].id;
    const res = await deleteOne(Api.home, id, "home");
    refresh();
    return res.success;
  };

  const refresh = async () => {
    setAction(ACTION.RUNNING);
    await fetcher<Home>(Api.home, {}, "web/home").then((d) => {
      setHome(d);
      form.reset({
        homes: normalizeHomes(d.items),
      });
    });
    setAction(ACTION.DEFAULT);
  };
  const onSubmit = async (data: RootType) => {
    setAction(ACTION.RUNNING);
    try {
      const homes = data.homes ?? [];
      const payload: IHome[] = [];

      // index==0-г алгасах логик байвал хадгаллаа
      for (let i = 0; i < homes.length; i++) {
        const h = homes[i];
        if (!h) continue;
        if (h.artist_name == "" || !h.artist_name) continue;
        // 0-ийг алгасах бол:
        const idx = h.index ?? i;
        if (idx === 0) continue;

        let url = typeof h.image === "string" ? h.image : "";

        // Шинэ зураг байвал эхлээд upload
        if (h.file instanceof File) {
          const fd = new FormData();
          fd.append("files", h.file, h.file.name);
          const uploadResult = await imageUploader(fd); // ← энэ нь массив гэж үзэв
          url = uploadResult?.[0] ?? url;
        }

        // Payload-д нэмэх
        payload.push({
          artist_name: h.artist_name ?? "",
          name: h.name ?? "",
          image: url, // upload-оос ирсэн эсвэл өмнөх URL
          index: idx || 1, // fallback
        });
      }

      let res;
      if (data.homes) {
        if (data.edit) {
          // Засварын үед аль item-ыг явуулах нь бизнесийн дүрмээс хамаарна
          // Жишээ нь index==1-ийг илгээе, олдохгүй бол эхнийх
          const target = payload.find((p) => p.index === 1) ?? payload[0];
          res = await updateOne<IHome>(
            Api.home,
            data.edit as string,
            target,
            "home"
          );
        } else {
          res = await create<IHomes>(Api.home, { items: payload }, "home");
        }
      }

      if (res?.success) {
        refresh();
      }
    } catch (err) {
      console.error(err);
      // алдааны toast/alert хийх газар
    } finally {
      setAction(ACTION.DEFAULT);
    }
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
  const { fields, insert, update } = useFieldArray({
    control: form.control,
    name: "homes",
  });
  const ensureHomeAt = (i: number) => {
    const homes = form.getValues("homes") ?? [];
    if (homes[i] !== undefined) return;

    const next = homes.slice();
    // index хүрэх хүртэл хоосон мөрүүдээр сунгана
    while (next.length <= i) next.push({} as Home);
    form.setValue("homes", next, { shouldDirty: true });
  };

  const handleFileChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      ensureHomeAt(idx);
      const next = (form.getValues("homes") ?? []).slice();
      next[idx] = { ...(next[idx] ?? {}), file, index: idx };

      form.setValue("homes", next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    };
  const handleRemove = (idx: number) => () => {
    ensureHomeAt(idx);
    console.log(idx);
    const next = (form.getValues("homes") ?? []).slice();
    next[idx] = { ...(next[idx] ?? {}), file: null, image: null };
    form.setValue("homes", next, { shouldDirty: true, shouldValidate: true });
  };
  return (
    <div className="">
      <DynamicHeader />
      <div className="admin-container">
        <FormProvider {...form}>
          <div className="grid grid-cols-12 gap-2">
            {numberArray(30).map((index) => {
              return (
                <div key={index} className="col-span-3 gap-3 p-2 border-b">
                  <FormItems
                    control={form.control}
                    name="homes"
                    message={false}
                    label={`Зураг ${index}`}
                  >
                    {(field) => {
                      const values = (field.value ?? []) as HomeType[];
                      const value = values[index];

                      // UNIQUE input id per card
                      const inputId = `file-upload-${index}`;

                      return (
                        <div className="flex gap-4">
                          <div className="relative h-36 aspect-[5/7]">
                            {value?.file || value?.image ? (
                              <>
                                <ImagePreview
                                  file={value?.file}
                                  image={
                                    typeof value?.image === "string"
                                      ? value.image
                                      : null
                                  }
                                />
                                <label
                                  htmlFor={inputId}
                                  className="absolute top-1 right-7 bg-primary p-1 rounded cursor-pointer"
                                >
                                  <Pencil className="size-3 text-white" />
                                </label>
                                <button
                                  type="button"
                                  onClick={handleRemove(index)}
                                  className="absolute top-1 right-1 bg-primary p-1 rounded"
                                >
                                  <X className="size-3 text-white" />
                                </button>
                              </>
                            ) : (
                              <label
                                htmlFor={inputId}
                                className="flex flex-col items-center justify-center w-full h-full bg-white border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                <UploadCloud className="w-6 h-6 text-gray-500" />
                                <span className="mt-1 text-xs text-gray-500">
                                  Browse
                                </span>
                              </label>
                            )}

                            <input
                              id={inputId}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange(index)} // ✅ index “түгжсэн”
                            />
                            {/* Hidden input (unique id) */}
                            <input
                              id={inputId}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                if (index < fields.length) {
                                  update(index, {
                                    ...(fields[index] as any),
                                    file,
                                    index,
                                  });
                                } else {
                                  // хоорондын index-үүдийг бөглөөд тухайн index дээр оруулна
                                  for (let i = fields.length; i < index; i++)
                                    insert(i, { index: i } as any);
                                  insert(index, { file, index } as any);
                                }
                              }}
                            />
                          </div>

                          <div className="flex-1 w-full space-y-4">
                            {HOME_FIELDS.map(({ key, label }) => {
                              // ✅ watch/setValue/trigger-д зориулсан зөв төрөл
                              const path =
                                `homes.${index}.${key}` as Path<RootType>;
                              const v = (form.watch(path) ?? "") as string;
                              return (
                                <TextField
                                  key={`${index}-${key}`}
                                  label={label}
                                  pl={label + "..."}
                                  className="pr-0 h-9 text-sm! placeholder:text-gray-400"
                                  props={{
                                    name: path, // path = `homes.${index}.${key}` as Path<RootType>
                                    value: v, // const v = form.watch(path) ?? ''
                                    onChange: (evOrValue) => {
                                      // TextField чинь string эсвэл event өгч болно гэж үзээд хамгаална
                                      const nextVal =
                                        typeof evOrValue === "string"
                                          ? evOrValue
                                          : evOrValue?.target?.value ?? "";

                                      ensureHomeAt(index); // ← байхгүй бол мөрийг үүсгэнэ
                                      form.setValue(path, nextVal, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      });
                                    },
                                    onBlur: () => form.trigger(path),
                                    ref: () => {},
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
                  </FormItems>
                  {/* <Modal
                    name=""
                    title=""
                    btn="Нэмэх"
                    submit={() => {}}
                    open={change}
                    reset={() => {
                      setChange(false);
                      form.reset({});
                    }}
                    setOpen={(v) => {
                      if (!v) {
                        setChange(false);
                      }
                    }}
                    loading={action == ACTION.RUNNING}
                  >
                    <div className="col-span-1 grid grid-cols-1 gap-3 pt-3">
                     
                    </div>
                  </Modal> */}
                </div>
              );
            })}
          </div>
          <div className="fixed bottom-6 right-6 z-40">
            <Button onClick={() => form.handleSubmit(onSubmit, onInvalid)()}>
              <Save />
              Хадгалах
            </Button>
          </div>
        </FormProvider>
      </div>
    </div>
  );
};
