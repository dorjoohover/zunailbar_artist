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
import {
  CloudUpload,
  Lock,
  Pencil,
  Save,
  Trash,
  UploadCloud,
  X,
} from "lucide-react";
import { firstLetterUpper, numberArray, totalHours } from "@/lib/functions";
import { Button } from "@/components/ui/button";
import { imageUploader } from "@/app/(api)/base";
import { showToast } from "@/shared/components/showToast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";

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

export const TestHeroUploader = ({ data }: { data: ListType<Home> }) => {
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

      if (selectedIndex) {
        const h = homes[selectedIndex];
        if (h.artist_name == "" || !h.artist_name) {
          showToast("info", "Артистын нэрийг оруулна уу");
          return;
        }
        let url = typeof h.image === "string" ? h.image : "";

        if (h.file instanceof File) {
          const fd = new FormData();
          fd.append("files", h.file, h.file.name);
          const uploadResult = await imageUploader(fd);
          url = uploadResult?.[0] ?? url;
        }
        const payload = {
          artist_name: h.artist_name ?? "",
          name: h.name ?? "",
          image: url, // upload-оос ирсэн эсвэл өмнөх URL
          index: selectedIndex, // fallback
        };

        let res = await create<IHome>(Api.home, payload as IHome, "home");

        if (res?.success) {
          showToast('success', 'Хадгаллаа.')
          refresh();
        }
      }
    } catch (err) {
      console.error(err);
      // алдааны toast/alert хийх газар
    } finally {
      setAction(ACTION.DEFAULT);
    }
  };
  const onInvalid = async <T,>(e: T) => {
    const error =
      Object.keys(e as any)
        .map((er, i) => {
          const value = VALUES[er];
          return i == 0 ? firstLetterUpper(value) : value;
        })
        .join(", ") + " оруулна уу!";
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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const homes = form.getValues("homes");
    const filteredHomes = homes?.map((home, i) => {
      if (home.index == idx) {
        return {
          ...home,
          file,
        };
      }
      return home;
    });
    form.setValue("homes", filteredHomes);
  };
  // Bishu
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); //
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  const removeHeaderImage = () => {
    if (selectedIndex) {
      const homes = form.getValues("homes");
      const filteredHomes = homes?.map((home) => {
        if (home.index == selectedIndex) {
          return {
            ...home,
            image: null,
            file: null,
          };
        }
        return home;
      });
      form.setValue(`homes`, filteredHomes);
    }
  };

  const home = form.watch(`homes.${selectedIndex}` as Path<RootType>);

  const imageSrc = home?.image
    ? `/api/file/${home.image}`
    : home?.file
    ? URL.createObjectURL(home.file)
    : null;

  return (
    // Bishu
    <div className="">
      <DynamicHeader />
      <div className="admin-container">
        <div className="grid md:grid-cols-4 gap-2 relative">
          <div className="md:col-span-3 bg-white flex flex-col border-light border shadow-light rounded-t-2xl rounded-b-2xl overflow-hidden">
            {/* Web Preview хэсэг */}

            <div className=" pl-3 pr-12 h-14 flex justify-between border-b">
              <div className="flex items-center gap-1.5 h-full">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>{" "}
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>{" "}
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center grow">
                <div className="rounded-md font-medium text-xs leading-6 py-1 flex items-center ring-1 ring-inset ring-slate-900/5 px-2 ml-3 w-full">
                  <Lock
                    className="text-slate-300 size-3.5 mr-1.5"
                    strokeWidth={3}
                  />{" "}
                  zu-nailbar.mn
                </div>
              </div>
            </div>
            <div className="relative py-10">
              <div className="absolute size-full top-0 left-0 bg-[url(/bg/blue-gradient.png)] opacity-50 bg-cover bg-center"></div>

              {Array.from({ length: 3 }).map((_, groupIndex) => {
                const start = groupIndex * 5;
                const end = start + 5;
                return (
                  <div
                    key={groupIndex}
                    className={cn(
                      groupIndex == 1 ? "pl-20" : "pr-20",
                      "flex flex-col items-center space-y-0 py-3"
                    )}
                  >
                    {/* <h1 className="text-sm font-semibold text-left">
                      {groupIndex + 1 + "-р"} эгнээ: Зураг {start + 1}–{end}
                    </h1> */}
                    <ScrollArea className="w-[100%] pl-10">
                      <div className="flex w-full flex-col px-10">
                        <div className="flex justify-center space-x-8 py-4">
                          {numberArray(totalHours)
                            .slice(start, end)
                            .map((index) => {
                              const home = form.watch(
                                `homes.${index}` as Path<RootType>
                              );
                              const file = home?.file;
                              const image = home?.image
                                ? `/api/file/${home.image}`
                                : file
                                ? URL.createObjectURL(file)
                                : null;
                              return (
                                <div
                                  key={index}
                                  onClick={() => openModal(home.index)}
                                  className={cn(
                                    "h-52 aspect-[5/7] cursor-pointer rounded-md overflow-hidden relative flex flex-col justify-end p-4",
                                    selectedIndex === index &&
                                      "outline-2 outline-offset-4 outline-brand-purple"
                                  )}
                                >
                                  <div className="flex-1 rounded-xl absolute top-0 left-0 size-full">
                                    {image ? (
                                      <>
                                        <img
                                          src={image}
                                          alt={
                                            home.name || `Artist ${index + 1}`
                                          }
                                          className="size-full object-cover bg-gray-200"
                                        />
                                        <div className="size-full absolute top-0 left-0 bg-gradient-to-t from-black/90 to-transparent" />
                                      </>
                                    ) : (
                                      <label className="flex flex-col items-center justify-start h-full cursor-pointer border-dashed border-gray-400 border-2 text-white text-sm bg-white">
                                        <div className="absolute top-0 left-0 size-full flex flex-col items-center justify-center text-gray-400">
                                          {/* <Image src="/bg/nail-input.png" width={300} height={300} alt="no image" className="w-[100%] mx-auto opacity-70" /> */}
                                          <CloudUpload className="size-10" />
                                          <span className="text-[11px] font-semibold">
                                            Зураг оруулах
                                          </span>
                                        </div>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) =>
                                            handleFileChange(e, index)
                                          }
                                        />
                                      </label>
                                    )}
                                  </div>

                                  {/* Артист нэр ба үйлчилгээ нэр */}
                                  <div
                                    className={cn(
                                      "mt-2 text-center relative z-10",
                                      home?.image
                                        ? "text-white"
                                        : "text-primary"
                                    )}
                                  >
                                    <h1 className="text-[10px] truncate font-semibold">
                                      {home?.name || "хоосон"}
                                    </h1>
                                    <h1 className="text-[9px] truncate">
                                      {home?.artist_name || `хоосон`}
                                    </h1>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="sticky left-0 top-20 bg-white border-light shadow-light rounded-2xl p-6 space-y-4 z-30">
              {selectedIndex !== null ? (
                <>
                  <div className="border-2 border-slate-200 rounded-xl aspect-[5/7] overflow-hidden relative">
                    {imageSrc ? (
                      <>
                        <img
                          src={imageSrc}
                          alt="preview"
                          className="size-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 space-x-1">
                          {/* Edit */}
                          {/* <Button
                            variant={"outline"}
                            size={"icon"}
                            className="bg-white rounded cursor-pointer"
                          >
                            <Pencil
                              className="size-3.5 text-primary"
                              strokeWidth={2.5}
                            />
                          </Button> */}

                          {/* Remove */}
                          <Button
                            variant={"ghost"}
                            size={"icon"}
                            className="bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer"
                            onClick={removeHeaderImage}
                          >
                            <X
                              className="size-3.5 text-rose-500"
                              strokeWidth={2.5}
                            />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer bg-slate-200">
                        <span className="text-gray-500 text-sm mb-2">
                          No Image
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, selectedIndex)}
                        />
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded">
                          Upload
                        </span>
                      </label>
                    )}
                  </div>

                  <TextField
                    label="Үйлчилгээний нэр"
                    pl="Нэр..."
                    className="pr-0 h-9 text-sm! placeholder:text-gray-400"
                    props={{
                      name: `homes.${selectedIndex}.name` as Path<RootType>,
                      value: (form.watch(
                        `homes.${selectedIndex}.name` as Path<RootType>
                      ) ?? "") as string,
                      onChange: (evOrValue) => {
                        const nextVal =
                          typeof evOrValue === "string"
                            ? evOrValue
                            : evOrValue?.target?.value ?? "";

                        ensureHomeAt(selectedIndex);
                        form.setValue(
                          `homes.${selectedIndex}.name` as Path<RootType>,
                          nextVal,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        );
                      },
                      onBlur: () =>
                        form.trigger(
                          `homes.${selectedIndex}.name` as Path<RootType>
                        ),
                      ref: () => {},
                    }}
                  />

                  <TextField
                    label="Артист нэр"
                    pl="Артист нэр..."
                    className="pr-0 h-9 text-sm! placeholder:text-gray-400"
                    props={{
                      name: `homes.${selectedIndex}.artist_name` as Path<RootType>,
                      value: (form.watch(
                        `homes.${selectedIndex}.artist_name` as Path<RootType>
                      ) ?? "") as string,
                      onChange: (evOrValue) => {
                        const nextVal =
                          typeof evOrValue === "string"
                            ? evOrValue
                            : evOrValue?.target?.value ?? "";

                        ensureHomeAt(selectedIndex); // мөр байхгүй бол үүсгэнэ
                        form.setValue(
                          `homes.${selectedIndex}.artist_name` as Path<RootType>,
                          nextVal,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        );
                      },
                      onBlur: () =>
                        form.trigger(
                          `homes.${selectedIndex}.artist_name` as Path<RootType>
                        ),
                      ref: () => {},
                    }}
                  />

                  <Button onClick={() => onSubmit(form.getValues())}>
                    Хадгалах
                  </Button>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Кардаа сонгоно уу.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
