import {
  Brush,
  BrushCleaning,
  Bubbles,
  Component,
  Crown,
  Eraser,
  Footprints,
  Hand,
  Scissors,
  Shield,
  Smartphone,
  Sparkles,
  User2,
} from "lucide-react";
import {
  CategoryType,
  CostStatus,
  DISCOUNT,
  EmployeeStatus,
  OrderStatus,
  ProductLogStatus,
  ProductTransactionStatus,
  ROLE,
  SalaryLogStatus,
  ScheduleStatus,
  STATUS,
  UserProductStatus,
  UserStatus,
} from "./enum";
import z from "zod";
import { showToast } from "@/shared/components/showToast";
import { firstLetterUpper } from "./functions";

export const roleIconMap = {
  [ROLE.SYSTEM]: { icon: Crown, color: "yellow" },
  [ROLE.ADMIN]: { icon: Shield, color: "orange" },
  [ROLE.EMPLOYEE]: { icon: User2, color: "gray" },
  [ROLE.CLIENT]: { icon: User2, color: "gray" },
  [ROLE.MANAGER]: { icon: User2, color: "gray" },
  [ROLE.ANY]: { icon: User2, color: "gray" },
  [ROLE.E_M]: { icon: User2, color: "gray" },
};
export const RoleValue = {
  [ROLE.SYSTEM]: "SYSTEM",
  [ROLE.ADMIN]: "ADMIN",
  [ROLE.MANAGER]: "MANAGER",
  [ROLE.EMPLOYEE]: "EMPLOYEE",
  [ROLE.CLIENT]: "CLIENT",
  [ROLE.ANY]: "ANY",
  [ROLE.E_M]: "ANY",
};
export const zStrOpt = z.string().nullable().optional();
export const zNumOpt = z.number().nullable().optional();

export const EmployeeStatusValue = {
  [EmployeeStatus.ACTIVE]: { name: "Идэвхтэй", color: "green-badge badge" },
  [EmployeeStatus.FIRED]: { name: "Халагдсан", color: "slate-badge badge" },
  [EmployeeStatus.DEKIRIT]: { name: "Декирит", color: "red-badge badge" },
  [EmployeeStatus.VACATION]: { name: "Амарсан", color: "yellow-badge badge" },
  [EmployeeStatus.BANNED]: { name: "Бандуулсан", color: "red-badge badge" },
};
export type Option<T = string | number> = { value: T; label: string };

export const UserStatusValue = {
  [UserStatus.ACTIVE]: { name: "Идэвхтэй", color: "green-badge badge" },
  [UserStatus.BANNED]: { name: "Бандуулсан", color: "red-badge badge" },
};
export const ScheduleStatusValue = {
  [ScheduleStatus.Active]: { name: "Active", color: "green-badge badge" },
  [ScheduleStatus.Pending]: { name: "Pending", color: "text-gray-600 badge" },
  [ScheduleStatus.Absent]: { name: "Absent", color: "text-red-500 badge" },
  [ScheduleStatus.Hidden]: { name: "Hidden", color: "text-red-500 badge" },
};

export interface ListType<T> {
  count: number;
  items: T[];
}
export interface SearchType<T> {
  id: string;
  value: string;
  item?: T;
  quantity?: number;
}

export enum ACTION {
  DEFAULT = 10,
  PENDING = 20,
  RUNNING = 30,
}

export const DEFAULT_LIMIT = 20;
export const DEFAULT_PAGE = 0;
export const DEFAULT_SORT = true;

export type PG = {
  page?: number;
  limit?: number;
  sort?: boolean;
  filter?: any;
};

export const DEFAULT_PG: Required<PG> = {
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  sort: DEFAULT_SORT,
  filter: undefined,
};

export const ListDefault = {
  count: 0,
  items: [],
};

// export const PG = (dto: PgDto = {}): Required<PgDto> => ({
//   ...DEFAULT_PG,
//   ...dto,
// });

// patch put delete type
export type PPDT = { success: boolean; error?: string };

export const MODAL_ACTION = {
  add_emp: "add_emp",
  edit_emp: "edit_emp",
  give_product: "give_product",
  add_service_to_emp: "add_service_to_emp",
  add_product: "add_product",
  add_service: "add_service",
  add_discount: "add_discount",
  add_voucher_to_user: "add_voucher_to_user",
  add_schedule_to_emp: "add_schedule_to_emp",
  set_status_salary: "set_status_salary",
  add_salary: "add_salary",
};

export function getEnumValues<T extends Record<string, string | number>>(
  e: T
): T[keyof T][] {
  return Object.values(e).filter((v) => typeof v !== "string") as T[keyof T][];
}

export const getValuesUserProductStatus = {
  [UserProductStatus.Active]: { name: "Идэвхтэй", color: "green-badge badge" },
  [UserProductStatus.Damaged]: { name: "Гэмтсэн", color: "red-badge badge" },
  [UserProductStatus.Lost]: { name: "Гээгдсэн", color: "yellow-badge badge" },
  [UserProductStatus.Replaced]: {
    name: "Орлуулсан",
    color: "slate-badge badge",
  },
  [UserProductStatus.Returned]: {
    name: "Буцаасан",
    color: "neutral-badge badge",
  },
};

export const getValuesStatus = {
  [STATUS.Active]: { name: "Идэвхтэй", color: "green-badge badge" },
  [STATUS.Hidden]: { name: "Цуцлах", color: "red-badge badge" },
  [STATUS.Pending]: { name: "Хүлээгдэж байна", color: "yellow-badge badge" },
};

export const ErrorMessage = {
  STOCK_INSUFFICIENT: "Үлдэгдэл хүрэлцэхгүй байна.",
} as const;

export const ErrorToast = (err: keyof typeof ErrorMessage) => {
  const message = ErrorMessage[err];
  showToast("info", message);
};

export const getValuesCostStatus = {
  [CostStatus.Paid]: { name: "Төлсөн", color: "green-badge badge" },
  [CostStatus.Remainder]: { name: "Үлдэгдэлтэй", color: "yellow-badge badge" },
};

export type ScheduleEdit = {
  times: number[];
  day: number;
};
export const getValueDiscount = {
  [DISCOUNT.Percent]: "Хувиар",
  [DISCOUNT.Price]: "Үнээр",
};

export const getValuesProductTransactionStatus = {
  [ProductTransactionStatus.Used]: {
    name: "Хэрэглэсэн",
    color: "green-badge badge",
  },
  // [ProductTransactionStatus.Sold]:  {name: "Зарсан", color: "yellow-badge badge"},
  [ProductTransactionStatus.Damaged]: {
    name: "Эвдэрсэн",
    color: "red-badge badge",
  },
};

export const getValuesProductLogStatus = {
  [ProductLogStatus.Bought]: {
    name: "Худалдаж авсан",
    color: "green-badge badge",
  },
  [ProductLogStatus.Remainder]: {
    name: "Үлдэгдэлтэй",
    color: "yellow-badge badge",
  },
  // [ProductLogStatus.Damaged]: "Эвдэрсэн",
};

export const CategoryTypeValues = {
  [CategoryType.DEFAULT]: "Default",
  [CategoryType.COST]: "Хэрэглээний зардал",
  // [ProductLogStatus.Damaged]: "Эвдэрсэн",
};

export const SalaryLogValues = {
  [SalaryLogStatus.Paid]: "Paid",
  [SalaryLogStatus.Pending]: "Pending",
};

export const OrderStatusValues = {
  [OrderStatus.Active]: "Бэлэн",
  [OrderStatus.Started]: "Эхэлсэн",
  [OrderStatus.Cancelled]: "Цуцалсан",
  [OrderStatus.Finished]: "Дууссан",
  [OrderStatus.Pending]: "Хүлээгдэж байна",
  [OrderStatus.ABSENT]: "Ирээгүй",
  [OrderStatus.Friend]: "Танил",
};
export const icons = {
  [Brush.displayName ?? "Brush"]: Brush,
  [Bubbles.displayName ?? "Bubbles"]: Bubbles,
  [BrushCleaning.displayName ?? "BrushCleaning"]: BrushCleaning,
  [Component.displayName ?? "Component"]: Component,
  [Eraser.displayName ?? "Eraser"]: Eraser,
  [Footprints.displayName ?? "Footprints"]: Footprints,
  [Hand.displayName ?? "Hand"]: Hand,
  [Scissors.displayName ?? "Scissors"]: Scissors,
  [Smartphone.displayName ?? "Smartphone"]: Smartphone,
  [Sparkles.displayName ?? "Sparkles"]: Sparkles,
};

export enum ServiceView {
  SPECIAL = 10,
  DEFAULT = 0,
  FEATURED = 20,
}

export const getValueServiceView = {
  [ServiceView.SPECIAL]: { name: "Онцлох", color: "green-badge badge" },
  [ServiceView.DEFAULT]: { name: "Энгийн", color: "badge" },
  [ServiceView.FEATURED]: {
    name: "Хэрэглэгчдэд",
    color: "neutral-badge  badge",
  },
};

export const VALUES = {
  firstname: "нэр",
  lastname: "овог",
  branch_id: "салбар",
  mobile: "утасны дугаар",
  birthday: "төрсөн өдөр",
  experience: "туршлага",
  nickname: "хоч",
  color: "өнгө",
  quantity: "тоо ширхэг",
  price: "нэгжийн үнэ",
  currency: "валют",
  status: "төлөв",
  currency_amount: "валютын ханш",
  total_amount: "нийт үнэ",
  paid_amount: "төлсөн үнэ",
  pre_amount: "урьдчилгаа",
  cargo: "карго",
  date: "огноо",
  product_id: "бүтээгдэхүүн",
  role: "хэрэглэгчийн түвшин",
  percent: "Цалингийн хувь",
} as const as any;

export const ZValidator = {
  branch: z.string().min(1, "Салбар сонгоно уу"),
  category: z.string().min(1, "Ангилал сонгоно уу"),
  service: z.string().min(1, "Үйлчилгээ сонгоно уу"),
  category_name: z.string().min(1, "Ангилалын нэр оруулна уу"),
  brand_name: z.string().min(1, "Брендийн нэр оруулна уу"),
  user: z.string().min(1, "Артист сонгоно уу"),
  customer: z.string().min(1, "Хэрэглэгч сонгоно уу"),
  product: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
  currency: z.string().min(1, "Ханш оруулна уу"),
  name: z.string().min(1, "Нэр оруулна уу"),
  warehouse: z.string().min(1, "Агуулах сонгоно уу"),
};
