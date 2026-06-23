"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import { useModal } from "@/providers/modal-context";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EventFormData, eventSchema } from "@/types/index";
import { useScheduler } from "@/providers/schedular-provider";
import { Branch, IOrder, Service, User, Voucher } from "@/models";
import { INPUT_TYPE, OrderStatus, PaymentMethod, ROLE, VOUCHER } from "@/lib/enum";
import { FormItems } from "@/shared/components/form.field";
import { ComboBox } from "@/shared/components/combobox";
import {
  allTimes,
  getEnumValues,
  getMethodValue,
  ListDefault,
  ListType,
  OrderStatusValues,
  SearchType,
  VALUES,
} from "@/lib/constants";
import {
  addMinutes,
  firstLetterUpper,
  mnDateFormat,
  mobileFormatter,
  money,
  toTimeString,
  toYMD,
  usernameFormatter,
} from "@/lib/functions";
import { TextField } from "@/shared/components/text.field";
import { showToast } from "@/shared/components/showToast";
import { API, Api } from "@/utils/api";
import { create, find, findOne, findRaw, search } from "@/app/(api)";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { LoaderMini } from "@/components/loader";
import { OrderSlot, Slot } from "@/models/slot.model";
import { isSameDay } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Phone, User as LUser, UserCircle } from "lucide-react";
const defaultValues = {
  branch_id: undefined,
  user_id: undefined,
  customer_desc: undefined,
  details: [],
  order_date: mnDateFormat(new Date()),
  start_time: undefined,
  edit: undefined,
  order_status: OrderStatus.Active,
  total_amount: 0,
  pre_amount: 0,
  paid_amount: 0,
  card_amount: 0,
  bank_amount: 0,
  cash_amount: 0,
  method: undefined,
  pre_method: undefined,
  voucher_id: null,
  voucher_name: undefined,
  voucher_value: 0,
  discount: 0,
  discount_type: undefined,
};
type ListFieldProps<T> = {
  api: keyof typeof API;
  value?: string;
  key?: string;
  edit?: boolean;
  route?: string;
  onChange: (data: ListType<T>) => void;
};
const calculateDuration = (details: any[], parallel?: boolean | null) => {
  if (!details?.length) return 0;
  const durations = details.map((d) => Number(d.duration || 0));

  if (parallel && details.length > 1) {
    return Math.max(...durations);
  }

  return durations.reduce((a, b) => a + b, 0);
};
const sumPrices = (details: any[]) =>
  details.reduce((sum, d) => sum + Number(d.price || 0), 0);

const normalizePriceValue = (value?: unknown) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) return 0;

  return Math.max(amount, 0);
};

const calculateVoucherDiscount = (
  subtotal: number,
  voucher?: Pick<Voucher, "type" | "value"> | null,
  details?: Array<{ price?: unknown }>,
) => {
  if (!voucher) return 0;

  const total = Number(subtotal ?? 0);
  const value = Number(voucher.value ?? 0);

  if (total <= 0 || value <= 0) return 0;

  if (Number(voucher.type) === VOUCHER.Percent) {
    // Хувийн хөнгөлөлт нь зөвхөн НЭГ үйлчилгээн дээр л үйлчилнэ.
    const prices = Array.isArray(details)
      ? details
          .map((d) => Number((d as any)?.price ?? 0))
          .filter((p) => Number.isFinite(p) && p > 0)
      : [];
    const base = prices.length > 0 ? Math.max(...prices) : total;
    return Math.min(base, Math.round((base * value) / 100));
  }

  return Math.min(total, value);
};

const normalizeOrderDetailPrices = <T extends { price?: unknown }>(
  details: T[],
  orderTotal?: number | null,
  orderDiscount?: number | null,
) => {
  if (!Array.isArray(details) || details.length === 0) return [];

  const normalizedDetails = details.map((detail) => ({
    ...detail,
    price: normalizePriceValue(detail?.price),
  }));
  const subtotal = normalizedDetails.reduce(
    (sum, detail) => sum + Number(detail.price ?? 0),
    0,
  );

  if (subtotal <= 0) return normalizedDetails;

  const expectedTotal = normalizePriceValue(orderTotal);
  const expectedDiscount = normalizePriceValue(orderDiscount);
  const hasExpectedTotal =
    orderTotal != null && Number.isFinite(Number(orderTotal));
  const discountToApply = Math.min(
    subtotal,
    Math.max(
      0,
      hasExpectedTotal && expectedTotal < subtotal
        ? subtotal - expectedTotal
        : expectedDiscount,
    ),
  );

  if (discountToApply <= 0) return normalizedDetails;

  const discountable = normalizedDetails
    .map((detail, index) => ({
      index,
      price: Number(detail.price ?? 0),
    }))
    .filter((detail) => detail.price > 0);

  if (!discountable.length) return normalizedDetails;

  let distributed = 0;
  const shares = new Map<number, number>();

  discountable.forEach((detail, index) => {
    const share =
      index === discountable.length - 1
        ? discountToApply - distributed
        : Math.min(
            detail.price,
            Math.round((detail.price / subtotal) * discountToApply),
          );

    distributed += share;
    shares.set(detail.index, share);
  });

  return normalizedDetails.map((detail, index) => ({
    ...detail,
    price: Math.max(Number(detail.price ?? 0) - (shares.get(index) ?? 0), 0),
  }));
};

const resolveEditBasePrices = ({
  details,
  services,
  orderDiscount,
}: {
  details: any[];
  services: Service[];
  orderDiscount?: number | null;
}) => {
  const totalDiscount = Math.max(0, Number(orderDiscount ?? 0));
  const discountedTotal = details.reduce(
    (sum, detail) => sum + Number(detail?.price ?? 0),
    0,
  );
  let distributed = 0;

  return details.map((detail, index) => {
    const explicitBase = Number(detail?.original_price ?? 0);
    if (explicitBase > 0) {
      return explicitBase;
    }

    const service = services.find((item) => item.id === detail?.service_id);
    const finalPrice = Number(detail?.price ?? 0);
    const fallback = Number(
      detail?.price ?? detail?.min_price ?? service?.min_price ?? 0,
    );

    if (totalDiscount <= 0 || discountedTotal <= 0 || finalPrice <= 0) {
      return finalPrice > 0 ? finalPrice : fallback;
    }

    const share =
      index === details.length - 1
        ? totalDiscount - distributed
        : Math.round((finalPrice / discountedTotal) * totalDiscount);

    distributed += share;
    return Math.max(fallback, finalPrice + share);
  });
};

type DetailType = {
  service_id: string;
  service_name: string;
  category_id?: string | null | undefined;
  duration: unknown;
  description?: string | null | undefined;
  price?: number | null | undefined;
  min_price?: number | null | undefined;
  max_price?: number | null | undefined;
  original_price?: number | null | undefined;
  user_id?: string | null | undefined;
};

const EMPTY_DETAILS: DetailType[] = [];

const hasSalaryProcessDate = (value?: string | Date | null) => {
  if (value == null) return false;

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  const normalized = `${value}`.trim().toLowerCase();
  if (!normalized || normalized === "null" || normalized === "undefined") {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
};

export default function AddEventModal({
  // CustomAddEventModal,
  items,
  send,
  values,
  loading = false,
}: {
  items: {
    branch: SearchType<Branch>[];
    customer: SearchType<User>[];
    artists: SearchType<User>[];
    user: SearchType<User>[];
    service: ListType<Service>;
  };
  loading?: boolean;
  send: (order: IOrder) => void | boolean | Promise<void | boolean>;
  values?: IOrder | any;
  // CustomAddEventModal?: React.FC<{ register: any; errors: any }>;
}) {
  const listField = async <T,>({
    api,
    value,
    key,
    edit = false,
    route,
    onChange,
  }: ListFieldProps<T>) => {
    try {
      setLoader((prev) => ({ ...prev, [api]: true }));
      const payload: Record<string, any> = {
        limit: -1,
        page: 0,
      };

      // 🔍 Хэрвээ key ба value өгөгдсөн бол filter нэмнэ
      if (key && value) {
        payload[key] = value;
      }

      // 🧩 Хэрвээ edit горим бол зөвхөн value-тай item-г татахыг оролдоно
      if (edit && value && key) {
        payload.limit = 1; // зөвхөн 1 item
      }

      const res = await find<T>(api, payload, route);

      // ✅ Response шалгах
      if (!res || !res.data) {
        console.warn(`[listField] ${String(api)} API-аас өгөгдөл олдсонгүй.`);
        onChange([] as unknown as ListType<T>);
        return;
      }

      onChange(res.data);
      setLoader((prev) => ({ ...prev, [api]: false }));
    } catch (error: any) {
      console.error(
        `[listField] ${String(api)} API дуудах үед алдаа гарлаа:`,
        error,
      );
      onChange([] as unknown as ListType<T>);
      setLoader((prev) => ({ ...prev, [api]: false }));
    }
  };
  const searchField = async (v: string, key: Api, edit?: boolean) => {
    if (edit && key === Api.customer) {
      form.setValue("customer_id", values?.customer_id);
    }
    const value = v;
    const details = form.watch("details") || [];

    let payload: Record<string, any> = {};
    if (key === Api.branch) {
      payload = { name: value };
    } else {
      payload = {
        role: key === Api.customer ? ROLE.CLIENT : ROLE.E_M,
        services: details.map((d) => d.service_id).join(","),
        branch_id: key === Api.customer ? undefined : branchId,
        ...(edit === undefined ? { id: value } : { value }),
      };
    }
    try {
      const res = await search(key === Api.customer ? Api.user : key, {
        ...payload,
        limit: 100,
        page: 0,
      });
      setValues((prev) => ({
        ...prev,
        [key]: res.data,
      }));
    } catch (error) {
      console.error(`Search failed for ${key}:`, error);
    }
  };

  const getSuitableArtists = (
    artists: SearchType<User>[],
    service_id?: string,
  ) => {
    let result = artists;
    // 🟢 Service чадвартай artist
    if (service_id) {
      const serviceArtistIds = new Set(userService[service_id]);
      result = result.filter((a) => serviceArtistIds.has(a.id));
    }

    // Queue үед дараагийн үйлчилгээнүүд өөр өөр эхлэх цагтай тул нэг start_time-аар
    // бүх artist-ийг шүүхгүй.
    const shouldFilterByStartSlot = parallel === true || details.length <= 1;
    if (
      shouldFilterByStartSlot &&
      order_date &&
      start_time &&
      slots?.[order_date]
    ) {
      const availableArtistIds = new Set(
        slots[order_date]
          .filter((s) => s.start_time.toString() === start_time)
          .map((s) => s.artist_id),
      );

      result = result.filter((a) => availableArtistIds.has(a.id));
    }

    return result;
  };
  const getSlots = async () => {
    const body = {
      branch_id: branchId,
      services: details?.map((s) => s.service_id),
      parallel: parallel,
      multi_artist_queue: parallel ? undefined : true,
    };
    const res = await find<Slot>(Api.order, body, "slots");
    const data: Record<string, Slot[]> = (res.data as unknown as Slot[]).reduce(
      (acc, item) => {
        const key = toYMD(new Date(item.date));

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push({ ...item, key });
        return acc;
      },
      {} as Record<string, Slot[]>,
    );

    setSlots(data);
  };
  const getArtists = async () => {
    const services = details?.map((d) => d.service_id) ?? [];
    if (!services || services.length == 0 || !branchId) return;

    const userServices = await create(
      Api.user_service,
      {
        branch_id: branchId,
        services: services,
      },
      "client",
    );
    // serviceId: artists
    const data: OrderSlot = userServices.data.payload;

    setUserService(data);
  };

  const { setClose, data } = useModal();
  const [allItems, setValues] = useState(items);
  const [artists, setArtists] = useState(allItems.user);
  const [services, setServices] = useState<ListType<Service>>({
    count: 0,
    items: [],
  });
  const [customerVisitCount, setCustomerVisitCount] = useState<number | null>(
    null,
  );
  const [isCustomerCountLoading, setIsCustomerCountLoading] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [orderDuration, setDuration] = useState(undefined);
  const [userService, setUserService] = useState<OrderSlot>({});
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  const isEdit = Boolean(values?.id);
  const isSalaryProcessed = Boolean(
    values?.id && hasSalaryProcessDate(values?.salary_date),
  );
  // Task #8: Хаагдсан захиалгыг артист өөрчлөх боломжгүй.
  const isFinishedOrder = values?.order_status === OrderStatus.Finished;
  const hasId = values?.id !== undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orderDateValue = form.getValues("order_date");
  const orderDate = orderDateValue ? new Date(orderDateValue) : null;

  if (orderDate) {
    orderDate.setHours(0, 0, 0, 0);
  }

  const isFuture = orderDate ? orderDate > today : false;

  const [isTimeSlotsEnabled, setTimeSlotsEnabled] = useState(() => {
    if (orderDate) {
      return isFuture;
    }
    if (isEdit || hasId) {
      return true;
    }
    return false;
  });

  const [loader, setLoader] = useState({
    [Api.service]: false,
  });

  const onSubmit: SubmitHandler<EventFormData> = async (formData) => {
    const normalizedDetails = (formData.details ?? []).map((detail) => ({
      ...detail,
      price: normalizePriceValue(detail?.price),
    }));
    // Артист сонгогдоогүй detail байвал backend FK алдаатай унадаг тул эндээс
    // эрт зогсооно.
    const missingArtist = normalizedDetails.some((d: any) => !d?.user_id);
    if (missingArtist) {
      showToast("info", "Артист сонгоно уу.");
      return;
    }
    const normalizedPreAmount = normalizePriceValue(formData.pre_amount ?? 0);
    const cardAmount = normalizePriceValue(formData.card_amount ?? 0);
    const bankAmount = normalizePriceValue(formData.bank_amount ?? 0);
    const cashAmount = normalizePriceValue(formData.cash_amount ?? 0);
    const normalizedPaidAmount = cardAmount + bankAmount + cashAmount;
    const normalizedTotalAmount = normalizedPreAmount + normalizedPaidAmount;
    const normalizedDiscount = 0;
    const newEvent = {
      branch_id: formData.branch_id,
      details: normalizedDetails,
      order_date: formData.order_date as string,
      start_time: formData.start_time,
      end_time: formData.end_time,
      duration: formData.duration,
      description: formData.description ?? undefined,
      customer_id: formData.customer_id,
      order_status: formData.order_status as OrderStatus | undefined,
      total_amount: normalizedTotalAmount,
      paid_amount: normalizedPaidAmount,
      pre_amount: normalizedPreAmount,
      card_amount: cardAmount || undefined,
      bank_amount: bankAmount || undefined,
      cash_amount: cashAmount || undefined,
      voucher_id: formData.voucher_id ?? null,
      voucher_name: formData.voucher_name ?? undefined,
      voucher_value: Number(formData.voucher_value ?? 0) || undefined,
      discount: normalizedDiscount,
      discount_type: formData.discount_type ?? undefined,
      method: formData.method
        ? +formData.method.toString().slice(0, 2)
        : undefined,
      pre_method: formData.pre_method
        ? +formData.pre_method.toString().slice(0, 2)
        : undefined,
      edit: formData.edit ?? undefined,
      parallel: formData.parallel,
    } as IOrder;
    const result = await send(newEvent);
    // Алдаа гарвал modal-ыг хааж, оруулсан мэдээллийг алдахгүй.
    if (result !== false) {
      setClose();
    }
  };

  const onInvalid = async <T,>(e: T) => {
    const error = Object.entries(e as any)
      .map(([er, v], i) => {
        if (er == "details")
          return Object.values(v as any).map((a: any) => {
            return Object.values(a).map((b: any) => b.message);
          });
        if ((v as any)?.message) {
          return (v as any)?.message;
        }
        let value = VALUES[er];

        return i == 0 ? firstLetterUpper(value ?? "") : value;
      })
      .join(", ");

    showToast("info", error);
  };
  const updateDetail = (index: number, value: any, key?: keyof DetailType) => {
    const current = form.getValues("details") || [];
    // Хэрвээ detail байхгүй бол шинэ item нэмнэ
    if (!current[index]) {
      form.setValue("details", [...current, value]);
      return;
    }

    if (!key) {
      const updated = details.filter((_, i) => i != index) as any;
      form.setValue("details", updated);
      return;
    }

    if (key === "price") {
      const normalizedPrice =
        value == null || value === "" ? undefined : normalizePriceValue(value);
      const updated = current.map((item, i) =>
        i === index
          ? {
              ...item,
              price: normalizedPrice,
              original_price: normalizedPrice,
            }
          : item,
      );

      form.setValue("details", updated);
      return;
    }

    const updated = current.map((item, i) =>
      i === index ? { ...item, [key]: value } : item,
    );

    form.setValue("details", updated);
  };
  const clearDetailArtists = () => {
    const current = form.getValues("details") || [];
    form.setValue(
      "details",
      current.map((item) => ({ ...item, user_id: undefined })),
    );
  };
  const watchedValues = useWatch<EventFormData>({ control: form.control });
  const {
    branch_id: branchId,
    customer_id: customerId,
    details: watchedDetails,
    parallel,
    paid_amount = 0,
    total_amount = 0,
    pre_amount = 0,
    card_amount = 0,
    bank_amount = 0,
    cash_amount = 0,
    order_date,
    start_time,
    duration,
    voucher_id,
    discount = 0,
  } = watchedValues;
  const details = watchedDetails ?? EMPTY_DETAILS;
  const setFormValueIfChanged = (
    name: keyof EventFormData,
    value: any,
    options?: any,
  ) => {
    if (form.getValues(name as any) === value) return;
    form.setValue(name as any, value, options);
  };
  const isDurationInitialized = useRef(false);

  useEffect(() => {
    if (!values || !values?.id || !services.items.length) return;

    const basePrices = resolveEditBasePrices({
      details: values?.details ?? [],
      services: services.items,
      orderDiscount: values?.discount,
    });

    const mappedDetails = values?.details?.map((v: any, index: number) => {
      const service = services.items.find((s) => s.id === v.service_id);
      const basePrice =
        basePrices[index] ??
        Number(v?.original_price ?? v?.price ?? service?.min_price ?? 0);
      return {
        id: v.id,
        service_id: service?.id ?? "",
        service_name: service?.name ?? "",
        duration: Number(v?.duration ?? service?.duration ?? 0),
        category_id: service?.category_id ?? "",
        description: v.description ?? "",
        price: basePrice,
        min_price: Number(v?.min_price ?? service?.min_price ?? basePrice ?? 0),
        max_price: Number(v?.max_price ?? service?.max_price ?? basePrice ?? 0),
        original_price: basePrice,
        user_id: v.user?.id ?? v.user_id ?? "",
      };
    });

    form.reset({
      ...values,
      details: mappedDetails,
      edit: values.id,
    });
  }, [values, services.items]);
  useEffect(() => {
    if (!details.length) return;

    // ✅ Edit mode: анхны утгыг 1 удаа л хадгална
    if (isEdit && !isDurationInitialized.current) {
      isDurationInitialized.current = true;
      return;
    }

    const calculated = calculateDuration(details, parallel);
    getArtists();
    const current = Number(duration ?? 0);
    if (orderDuration != undefined) {
      return;
    }
    if (current != calculated) {
      form.setValue("duration", calculated, {
        shouldDirty: true,
        shouldTouch: false,
      });
    }
  }, [details, parallel, isEdit]);

  useEffect(() => {
    let cancelled = false;
    async function syncCustomer() {
      if (!customerId) return;

      // 1. Хэрвээ items дотор байхгүй бол API-аар ганцаараа авч нэмнэ
      const exists = allItems.customer.some((v) => v.id == customerId);

      if (!exists) {
        try {
          searchField(customerId as string, Api.customer, true);
        } catch (_) {}
      }
    }

    syncCustomer();

    return () => {
      cancelled = true;
    };
  }, [customerId]);
  useEffect(() => {
    let cancelled = false;

    const loadVouchers = async () => {
      if (!customerId) {
        setAvailableVouchers([]);
        setVoucherLoading(false);
        setFormValueIfChanged("voucher_id", null, { shouldDirty: true });
        setFormValueIfChanged("voucher_name", undefined);
        setFormValueIfChanged("voucher_value", 0);
        setFormValueIfChanged("discount", 0);
        setFormValueIfChanged("discount_type", undefined);
        return;
      }

      setVoucherLoading(true);

      try {
        const res = await findRaw<Voucher[]>(
          Api.voucher,
          {
            order_id: values?.id,
          },
          `available/${customerId}`,
        );

        if (cancelled) return;

        setAvailableVouchers(Array.isArray(res.data) ? res.data : []);
      } catch (_error) {
        if (!cancelled) {
          setAvailableVouchers([]);
        }
      } finally {
        if (!cancelled) {
          setVoucherLoading(false);
        }
      }
    };

    loadVouchers();

    return () => {
      cancelled = true;
    };
  }, [customerId, form, values?.id]);
  useEffect(() => {
    if (voucherLoading) return;

    const selectedVoucher = availableVouchers.find((item) => item.id === voucher_id);
    if (!selectedVoucher) {
      if (voucher_id) {
        setFormValueIfChanged("voucher_id", null, { shouldDirty: true });
      }
      setFormValueIfChanged("voucher_name", undefined);
      setFormValueIfChanged("voucher_value", 0);
      setFormValueIfChanged("discount", 0);
      setFormValueIfChanged("discount_type", undefined);
      return;
    }

    setFormValueIfChanged("voucher_name", selectedVoucher.name ?? undefined);
    setFormValueIfChanged("voucher_value", Number(selectedVoucher.value ?? 0));
    const detailSubtotal = details.reduce(
      (sum, detail) => sum + Number(detail?.price ?? 0),
      0,
    );
    setFormValueIfChanged(
      "discount",
      calculateVoucherDiscount(detailSubtotal, selectedVoucher, details),
    );
    setFormValueIfChanged("discount_type", selectedVoucher.type);
  }, [availableVouchers, details, form, voucher_id, voucherLoading]);
  useEffect(() => {
    let cancelled = false;

    const loadCustomerVisitCount = async () => {
      if (!customerId) {
        setCustomerVisitCount(null);
        return;
      }

      setIsCustomerCountLoading(true);

      try {
        const res = await findOne(Api.order, customerId, "customer_count");
        if (!cancelled) {
          setCustomerVisitCount(Number(res?.payload?.count ?? 0));
        }
      } catch (error) {
        if (!cancelled) {
          setCustomerVisitCount(null);
        }
      } finally {
        if (!cancelled) {
          setIsCustomerCountLoading(false);
        }
      }
    };

    loadCustomerVisitCount();

    return () => {
      cancelled = true;
    };
  }, [customerId]);
  useEffect(() => {
    if (branchId) {
      listField<Service>({
        api: Api.service,
        onChange: (data) => {
          setServices(data);
        },
        key: "branch_id",
        value: branchId as string,
      });
      getSlots();
    } else {
      setServices(ListDefault);
      return;
    }
  }, [branchId]);
  useEffect(() => {
    if (values?.id) return;

    form.reset({
      ...defaultValues,
      ...values,
      details: values?.details ?? defaultValues.details,
      order_date: values?.order_date ?? defaultValues.order_date,
      start_time: values?.start_time ?? defaultValues.start_time,
      total_amount: values?.total_amount ?? defaultValues.total_amount,
      pre_amount: values?.pre_amount ?? defaultValues.pre_amount,
      paid_amount: values?.paid_amount ?? defaultValues.paid_amount,
    });
  }, [values, form]);

  useEffect(() => {
    if (!values?.id) return;
    isDurationInitialized.current = false;

    form.reset({
      ...values,
      edit: values.id,
    });
  }, [values, data]);

  useEffect(() => {
    if (isTimeSlotsEnabled) {
    } else {
      setArtists(allItems.user);
    }
  }, [isTimeSlotsEnabled]);

  useEffect(() => {
    const pre = normalizePriceValue(pre_amount);
    const card = normalizePriceValue(card_amount);
    const bank = normalizePriceValue(bank_amount);
    const cash = normalizePriceValue(cash_amount);
    const nextTotal = pre + card + bank + cash;
    const nextPaid = card + bank + cash;
    setFormValueIfChanged("total_amount", nextTotal, {
      shouldDirty: true,
      shouldTouch: false,
    });
    setFormValueIfChanged("paid_amount", nextPaid, {
      shouldDirty: true,
      shouldTouch: false,
    });
  }, [pre_amount, card_amount, bank_amount, cash_amount]);

  useEffect(() => {
    if (!start_time || !duration) return;

    const endTime = addMinutes(start_time, Number(duration));
    form.setValue("end_time", endTime, {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [start_time, duration]);
  return (
    <form
      className="space-y-4 "
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
    >
      {values.created_by && (
        <div className="flex items-center border rounded-md px-4 justify-between py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LUser className="w-4 h-4 text-rose-500" />
            <span>Үүсгэсэн</span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <UserCircle className="w-4 h-4 text-gray-400" />
              <span>{usernameFormatter(values.created_by)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="w-4 h-4" />
              <span>{mobileFormatter(values.created_by.mobile)}</span>
            </div>
          </div>
        </div>
      )}
      {isSalaryProcessed && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Энэ захиалга цалин бодолтод орсон тул артист талаас дүн, үйлчилгээ,
          артист, төлбөрийн мэдээлэл өөрчлөх боломжгүй.
        </div>
      )}
      {isFinishedOrder && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Хаагдсан захиалгыг артист талаас өөрчлөх боломжгүй.
        </div>
      )}
      <FormProvider {...form}>
        <div className="double-col">
          <div className="flex gap-4 items-start col-span-2">
            <div className="flex-1 space-y-2">
              <FormItems
                control={form.control}
                name="customer_id"
                label="Хэрэглэгч"
                className=" flex-1"
              >
                {(field) => {
                  return (
                    <ComboBox
                      search={(v) => {
                        if (v.length > 1) searchField(v, Api.customer);
                      }}
                      props={{ ...field }}
                      items={allItems.customer.map((item) => {
                        const [mobile, nickname] = item?.value?.split("__") ?? [
                          "",
                          "",
                          "",
                          "",
                        ];
                        const name = nickname == "null" ? "" : (nickname ?? "");
                        return {
                          value: item.id,
                          label: `${mobileFormatter(mobile)} ${name}`,
                        };
                      })}
                    />
                  );
                }}
              </FormItems>
              {customerId && (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {isCustomerCountLoading ? (
                    <span>Үйлчлүүлсэн тоог уншиж байна...</span>
                  ) : (
                    <span>
                      Нийт үйлчлүүлсэн:{" "}
                      <b>{customerVisitCount ?? 0} удаа</b>
                    </span>
                  )}
                </div>
              )}
            </div>
            <FormItems
              control={form.control}
              name="description"
              className="flex-1"
              label="Хэрэглэгчийн тайлбар"
            >
              {(field) => {
                let value = field.value;
                if (value == null) value = undefined;
                return (
                  <Textarea
                    onChange={field.onChange}
                    value={field.value as string}
                  />
                );
              }}
            </FormItems>
          </div>
          <FormItems control={form.control} name="branch_id" label="Салбар">
            {(field) => {
              return (
                <ComboBox
                  search={(e) => {
                    if (e.length > 1) searchField(e, Api.branch);
                  }}
                  props={{
                    ...field,
                  }}
                  items={allItems.branch.map((item) => {
                    const [name] = item.value?.split("__") ?? [""];
                    return {
                      value: item.id,
                      label: name,
                    };
                  })}
                />
              );
            }}
          </FormItems>
          <FormItems control={form.control} name="order_status" label="Статус">
            {(field) => {
              return (
                <div
                  className={
                    isSalaryProcessed ? "pointer-events-none opacity-60" : ""
                  }
                >
                  <ComboBox
                    props={{ ...field }}
                    items={getEnumValues(OrderStatus).map((item) => {
                      return {
                        value: item.toString(),
                        label: OrderStatusValues[item],
                      };
                    })}
                  />
                </div>
              );
            }}
          </FormItems>
        </div>
        <div className="border-t ">
          <p className="my-4">Төлбөр</p>
          {/* <div className="mb-4 rounded-xl border bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Урамшуулал ашиглуулах</p>
                <p className="text-sm text-muted-foreground">
                  Хэрэглэгчийн идэвхтэй урамшууллууд энд харагдана.
                </p>
              </div>
              {voucher_id && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSalaryProcessed}
                  onClick={() => {
                    form.setValue("voucher_id", null, { shouldDirty: true });
                    form.setValue("voucher_name", undefined);
                    form.setValue("voucher_value", 0);
                    form.setValue("discount", 0);
                    form.setValue("discount_type", undefined);
                  }}
                >
                  Цэвэрлэх
                </Button>
              )}
            </div>

            {!customerId ? (
              <p className="text-sm text-muted-foreground">
                Урамшуулал харахын тулд эхлээд хэрэглэгчээ сонгоно уу.
              </p>
            ) : voucherLoading ? (
              <p className="text-sm text-muted-foreground">
                Урамшууллын мэдээлэл уншиж байна...
              </p>
            ) : availableVouchers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Энэ хэрэглэгчид ашиглах боломжтой урамшуулал алга байна.
              </p>
            ) : (
              <div
                className={`grid gap-2 md:grid-cols-2 ${
                  isSalaryProcessed ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {availableVouchers.map((voucher) => {
                  const selected = voucher.id === voucher_id;
                  const subtotal = sumPrices(details);
                  const discount = calculateVoucherDiscount(
                    subtotal,
                    voucher,
                    details,
                  );
                  const valueLabel =
                    Number(voucher.type) === VOUCHER.Percent
                      ? `${voucher.value ?? 0}%`
                      : `${money(String(voucher.value ?? 0))}₮`;

                  return (
                    <button
                      key={voucher.id}
                      type="button"
                      className={`rounded-xl border px-3 py-3 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "bg-white hover:border-primary/40"
                      }`}
                      onClick={() => {
                        form.setValue("voucher_id", selected ? null : voucher.id, {
                          shouldDirty: true,
                        });
                        form.setValue(
                          "voucher_name",
                          selected ? undefined : voucher.name ?? undefined,
                        );
                        form.setValue(
                          "voucher_value",
                          selected ? 0 : Number(voucher.value ?? 0),
                        );
                        form.setValue("discount", selected ? 0 : discount);
                        form.setValue(
                          "discount_type",
                          selected ? undefined : voucher.type,
                        );
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{voucher.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {valueLabel}
                          </p>
                        </div>
                        {selected && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                            Сонгосон
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Захиалгын дүнгээс {money(String(discount))}₮ хасагдана.
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div> */}
          <div className="double-col">
            <FormItems
              control={form.control}
              name="total_amount"
              label="Нийт төлбөр"
            >
              {(field) => {
                return (
                  <TextField
                    disabled={true}
                    type={INPUT_TYPE.MONEY}
                    props={{ ...field }}
                  />
                );
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="pre_amount"
              label="Урьдчилгаа төлбөр"
            >
              {(field) => {
                return (
                  <TextField
                    type={INPUT_TYPE.MONEY}
                    disabled={true}
                    props={{ ...field }}
                  />
                );
              }}
            </FormItems>
            <FormItems
              control={form.control}
              name="pre_method"
              label="Урьдчилгааны хэлбэр"
            >
              {(field) => {
                field.value = field.value
                  ? +field.value?.toString().slice(0, 2)
                  : field.value;
                return (
                  <div
                    className={
                      isSalaryProcessed ? "pointer-events-none opacity-60" : ""
                    }
                  >
                    <ComboBox
                      props={{ ...field }}
                      items={[
                        PaymentMethod.QPAY,
                        PaymentMethod.BANK,
                        PaymentMethod.CARD,
                        PaymentMethod.CASH,
                      ].map((item) => {
                        return {
                          value: item.toString(),
                          label: getMethodValue[item],
                        };
                      })}
                    />
                  </div>
                );
              }}
            </FormItems>
            <div className="col-span-2">
              <p className="text-sm font-medium mb-1">Үлдэгдэл төлбөр (хэлбэрээр)</p>
              <div className="grid grid-cols-3 gap-2">
                <FormItems control={form.control} name="card_amount" label="Карт">
                  {(field) => (
                    <TextField
                      type={INPUT_TYPE.MONEY}
                      disabled={isSalaryProcessed}
                      props={{ ...field }}
                    />
                  )}
                </FormItems>
                <FormItems control={form.control} name="bank_amount" label="Данс">
                  {(field) => (
                    <TextField
                      type={INPUT_TYPE.MONEY}
                      disabled={isSalaryProcessed}
                      props={{ ...field }}
                    />
                  )}
                </FormItems>
                <FormItems control={form.control} name="cash_amount" label="Бэлэн">
                  {(field) => (
                    <TextField
                      type={INPUT_TYPE.MONEY}
                      disabled={isSalaryProcessed}
                      props={{ ...field }}
                    />
                  )}
                </FormItems>
              </div>
            </div>
          </div>
        </div>

        <div className="border p-2 rounded-md">
          <p className="my-2 font-bold">Үйлчилгээ</p>
          <div
            className={`grid grid-cols-2 gap-1 max-h-[220px] overflow-auto ${
              isSalaryProcessed ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {loader[Api.service] ? (
              <div className="flex col-span-2 py-4 items-center justify-center">
                <LoaderMini />
              </div>
            ) : (
              <>
                {services.count == 0 && (
                  <div className="flex justify-center col-span-2 py-4 m-2 rounded-md bg-primary/10 border border-primary/50">
                    <p className="text-sm">
                      Салбар сонгоогүй эсвэл салбарын үйлчилгээ байхгүй байна.
                    </p>
                  </div>
                )}
                {services.items
                  .sort((a, b) => {
                    if (a.index == null && b.index == null) return 0;
                    if (a.index == null) return 1; // a-г сүүлд
                    if (b.index == null) return -1; // b-г сүүлд
                    return a.index - b.index;
                  })
                  .map((service, i) => {
                    const selected = details?.findIndex(
                      (s) => s.service_id == service.id,
                    );

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between w-full cursor-pointer rounded-lg border p-3 transition-all
    ${
      selected !== undefined && selected != -1
        ? "bg-blue-50 border-blue-400"
        : "hover:bg-muted border-border"
    }`}
                        onClick={() => {
                          // Сонгогдсон үйлчилгээг дарвал хасна.
                          if (selected !== undefined && selected !== -1) {
                            updateDetail(selected, undefined);
                            return;
                          }

                          const sameCategoryIndex =
                            details?.findIndex(
                              (s) => s.category_id === service.category_id,
                            ) ?? -1;

                          // Ижил ангилалын үйлчилгээ байгаа бол одоо байгааг
                          // солих (id, артистыг хадгална).
                          if (sameCategoryIndex !== -1) {
                            const currentDetails =
                              form.getValues("details") || [];
                            const updated = currentDetails.map((item, i) =>
                              i === sameCategoryIndex
                                ? {
                                    ...item,
                                    service_id: service.id,
                                    service_name: service.name,
                                    duration: service.duration,
                                    category_id: service.category_id,
                                    min_price: Number(service.min_price ?? 0),
                                    max_price: Number(
                                      service.max_price ??
                                        service.min_price ??
                                        0,
                                    ),
                                    price: undefined,
                                    original_price: undefined,
                                  }
                                : item,
                            );
                            form.setValue("details", updated as any);
                            return;
                          }

                          if (details?.length === 2) {
                            showToast(
                              "info",
                              "2-с олон үйлчилгээ сонгох боломжгүй",
                            );
                            return;
                          }

                          updateDetail(selected, {
                            service_id: service.id,
                            service_name: service.name,
                            duration: service.duration,
                            category_id: service.category_id,
                            description: "",
                            price: undefined,
                            min_price: Number(service.min_price ?? 0),
                            max_price: Number(
                              service.max_price ?? service.min_price ?? 0,
                            ),
                            original_price: undefined,
                            user_id: "",
                          });
                        }}
                      >
                        <div>
                          <span className="block font-semibold block text-sm">
                            {service.index}.{service.name}
                          </span>
                        </div>

                        {service.meta?.name && (
                          <span className="text-xs  inline-flex py-0.5 px-2 bg-blue-100 text-muted-foreground px-1 rounded">
                            {service.meta.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>
        <div className="border-t ">
          <div className="flex justify-between items-center">
            <p className="my-4">Цагийн хуваарь</p>
            <div className="flex items-center justify-end gap-2 mt-2 max-w-lg w-full">
              <Switch
                checked={isTimeSlotsEnabled}
                onCheckedChange={(val) => setTimeSlotsEnabled(val)}
                id="compare-switch"
              />
              <label
                htmlFor="compare-switch"
                className="text-sm text-muted-foreground"
              >
                Цаг заавал мөрдөнө
              </label>
            </div>
          </div>
          <div className="double-col">
            <FormItems control={form.control} name="order_date" label="Огноо">
              {(field) => {
                // field.value = mnDateFormat((field.value as Date) ?? new Date());
                return (
                  <TextField type={INPUT_TYPE.DATE} props={{ ...field }} />
                );
              }}
            </FormItems>
            {details?.length > 0 && (
              <FormItems control={form.control} name="duration" label="Хугацаа">
                {(field) => <TextField props={{ ...field }} disabled={true} />}
              </FormItems>
            )}
            {((order_date && slots?.[order_date]) || !isTimeSlotsEnabled) && (
              <FormItems
                control={form.control}
                name="start_time"
                label="Эхлэх цаг"
              >
                {(field) => {
                  let slot =
                    isTimeSlotsEnabled && order_date ? slots?.[order_date] : [];
                  const artistIds = details
                    ?.map((d) => d.user_id)
                    .filter(Boolean);
                  if (artistIds?.length && isTimeSlotsEnabled) {
                    slot = slot.filter((s) => artistIds.includes(s.artist_id));
                  }

                  const availableSlots = isTimeSlotsEnabled
                    ? Array.from(new Set(slot.map((s) => s.start_time))).sort()
                    : allTimes.map((i) => toTimeString(i));
                  return (
                    <ComboBox
                      props={{ ...field }}
                      items={[...availableSlots].map((item) => {
                        return {
                          value: item?.toString(),
                          label: item.toString(),
                        };
                      })}
                    />
                  );
                }}
              </FormItems>
            )}

            {start_time && (
              <FormItems
                control={form.control}
                name="end_time"
                label="Дуусах цаг"
              >
                {(field) => <TextField props={{ ...field }} disabled={true} />}
              </FormItems>
            )}
          </div>
        </div>
        {(!order_date || !slots?.[order_date]) && isTimeSlotsEnabled && (
          <div className="flex justify-center col-span-2 py-4 m-2 rounded-md bg-primary/10 border border-primary/50">
            <p className="text-sm">Цаг байхгүй.</p>
          </div>
        )}
        {details?.length > 0 && (
          <div className="border-t">
            <div className="flex justify-between items-center">
              <p className="my-4">
                Үйлчилгээ{details.some((d) => d.category_id)}
              </p>

              {details.length == 2 &&
                details?.[0].category_id != details?.[1].category_id && (
                  <div
                    className={
                      isSalaryProcessed ? "pointer-events-none opacity-60" : ""
                    }
                  >
                    <FormItems control={form.control} name="parallel" label="">
                      {(field) => {
                        return (
                          <div className="col-span-1 flex gap-2 cursor-pointer items-center ">
                            <Checkbox
                              id="parallel"
                              checked={field.value as boolean}
                              onCheckedChange={(e) => {
                                form.setValue("parallel", e as boolean);
                                clearDetailArtists();
                              }}
                              className="w-5 h-5"
                              aria-label="Select row"
                            />
                            <label
                              htmlFor="parallel"
                              className="flex items-center gap-2 font-semibold text-lg"
                            >
                              Давхар эсэх
                            </label>
                          </div>
                        );
                      }}
                    </FormItems>
                  </div>
                )}
            </div>
            <div>
              {details.map((detail, i) => {
                return (
                  <div key={i} className="border rounded-md px-3 py-3">
                    <p className="mb-3">{detail.service_name}</p>
                    <div className="grid gap-3">
                      <div className="px-2 py-3 bg-gray-100 border rounded-md">
                        <p className="text-md mb-2">Artist {i + 1}</p>
                        <div className="double-col">
                          <FormItem>
                            <FormLabel>Артист</FormLabel>
                            <div
                              className={
                                isSalaryProcessed
                                  ? "pointer-events-none opacity-60"
                                  : ""
                              }
                            >
                              <ComboBox
                                className="max-w-xs"
                                items={(isTimeSlotsEnabled
                                  ? getSuitableArtists(
                                      artists,
                                      detail.service_id,
                                    )
                                  : artists
                                ).map((b, i) => {
                                  const [mobile, nickname, branch] =
                                    b?.value?.split("__") ?? ["", "", "", ""];
                                  return {
                                    label: `${firstLetterUpper(
                                      nickname,
                                    )} ${mobileFormatter(mobile)}`,
                                    value: b.id,
                                  };
                                })}
                                props={{
                                  onChange: (v: string) => {
                                    if (
                                      parallel &&
                                      details.some(
                                        (d, detailIndex) =>
                                          detailIndex !== i && d.user_id == v,
                                      )
                                    ) {
                                      toast.warning(
                                        "Дахин сонгох боломжгүй ",
                                      );
                                      return;
                                    }
                                    updateDetail(i, v, "user_id");
                                  },
                                  name: "",
                                  onBlur: () => {},
                                  ref: () => {},
                                  value: detail?.user_id,
                                }}
                              />
                            </div>
                            {/* {message && <FormMessage />} */}
                          </FormItem>
                          <FormItem>
                            <FormLabel>Төлбөр</FormLabel>
                            <TextField
                              type={INPUT_TYPE.MONEY}
                              disabled={isSalaryProcessed}
                              props={{
                                onChange: (v: string) => {
                                  const value = parseInt(v);
                                  updateDetail(
                                    i,
                                    isNaN(value) ? 0 : value,
                                    "price",
                                  );
                                },
                                name: "",
                                onBlur: () => {},
                                ref: () => {},
                                value: detail?.price ?? "",
                              }}
                            />
                          </FormItem>
                          <FormItem>
                            <FormLabel>Хугацаа</FormLabel>
                            <TextField
                              type={INPUT_TYPE.NUMBER}
                              props={{
                                onChange: (v: string) => {
                                  const value = parseInt(v);
                                  updateDetail(
                                    i,
                                    isNaN(value) ? 0 : value,
                                    "duration",
                                  );
                                },
                                name: "",
                                onBlur: () => {},
                                ref: () => {},
                                value: detail?.duration ?? "",
                              }}
                            />
                          </FormItem>
                        </div>
                        <FormItem className="mt-2">
                          <FormLabel>Тайлбар</FormLabel>
                          <Textarea
                            onChange={(e) => {
                              updateDetail(i, e.target.value, "description");
                            }}
                            value={(detail.description as string) ?? ""}
                          />
                        </FormItem>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4 pt-2">
          <Button variant="outline" type="button" onClick={() => setClose()}>
            Буцах
          </Button>
          <Button type="submit" loading={loading} disabled={isFinishedOrder}>
            Хадгалах
          </Button>
        </div>
      </FormProvider>
      {/* )} */}
    </form>
  );
}
