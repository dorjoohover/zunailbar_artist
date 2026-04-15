import {
  Award,
  Brush,
  BrushCleaning,
  Bubbles,
  Component,
  Crown,
  Eraser,
  Footprints,
  Hand,
  Medal,
  Scissors,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  User2,
} from "lucide-react";
import {
  CategoryType,
  CostStatus,
  DISCOUNT,
  EmployeeStatus,
  OrderStatus,
  PaymentMethod,
  PaymentType,
  ProductLogStatus,
  ProductTransactionStatus,
  ROLE,
  SalaryLogStatus,
  SalaryStatus,
  ScheduleStatus,
  STATUS,
  UserLevel,
  UserProductStatus,
  UserStatus,
} from "./enum";
import z, { nullable } from "zod";
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
export const zBoolOpt = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  return typeof val == "boolean" ? val : val === "true";
}, z.boolean().optional().nullable()) as unknown as boolean;

// export const zStrOpt = ({
//   allowNullable = true,
//   label,
//   length,
// }: {
//   label?: string;
//   allowNullable?: boolean;
//   length?: number;
// }): string => {
//   // console.log('asdf')
//   if (allowNullable)
//     return z.string().nullable().optional() as unknown as string;
//   if (length)
//     return z
//       .string({
//         error: `${length} оронтой байх ёстой`,
//       })
//       .length(length)
//       .nonoptional() as unknown as string;
//   return z
//     .string({
//       error: `${label} оруулна уу`,
//     })
//     .nonoptional() as unknown as string;
// };

export const zStrOpt = ({
  allowNullable = true,
  label,
  length,
}: {
  label?: string;
  allowNullable?: boolean;
  length?: number;
}) => {
  if (allowNullable) {
    return z.string().nullable().optional();
  }

  if (length) {
    return z
      .string({
        message: `${length} оронтой байх ёстой`,
      })
      .length(length);
  }

  return z.string({
    message: `${label ?? "Утга"} оруулна уу`,
  });
};
export const zNumOpt = ({
  allowNullable,
  label,
  value,
}: {
  label?: string;
  allowNullable?: boolean;
  value?: number;
} = {}) => {
  return z
    .preprocess(
      (val) => {
        if (val === "" || val === undefined || val === null)
          return allowNullable && (value ?? undefined);
        return typeof val === "string" ? parseFloat(val) : val;
      },
      z
        .number({ error: `${label} оруулна уу` })
        .refine((v) => allowNullable || v != undefined, {
          message: `${label} оруулна уу`,
        })
        .nonoptional(),
    )
    .optional() as unknown as number;
};
export const EmployeeStatusValue = {
  [EmployeeStatus.ACTIVE]: {
    name: "Идэвхтэй",
    color: "green-badge badge",
    bg: "oklch(92.5% 0.084 155.995)",
    text: "oklch(52.7% 0.154 150.069)",
  },
  [EmployeeStatus.FIRED]: {
    name: "Ажлаас гарсан",
    color: "slate-badge badge",
    bg: "oklch(92.9% 0.013 255.508)",
    text: "oklch(37.2% 0.044 257.287)",
  },
  [EmployeeStatus.DEKIRIT]: {
    name: "Декирит",
    color: "red-badge badge",
    bg: "oklch(88.5% 0.062 18.334)",
    text: "oklch(50.5% 0.213 27.518)",
  },
  [EmployeeStatus.VACATION]: {
    name: "Амарсан",
    color: "yellow-badge badge",
    bg: "oklch(92.4% 0.12 95.746)",
    text: "oklch(42.1% 0.095 57.708)",
  },
  [EmployeeStatus.BANNED]: {
    name: "Идэвхгүй",
    color: "red-badge badge",
    bg: "oklch(88.5% 0.062 18.334)",
    text: "oklch(50.5% 0.213 27.518)",
  },
};
export type Option<T = string | number> = {
  value: T;
  label: string;
};

export const UserStatusValue = {
  [UserStatus.ACTIVE]: { name: "Идэвхтэй", color: "green-badge badge" },
  [UserStatus.BANNED]: { name: "Идэвхгүй", color: "red-badge badge" },
};
export const SalaryStatusValue = {
  [SalaryStatus.ACTIVE]: { name: "Идэвхтэй", color: "green-badge badge" },
  [SalaryStatus.INACTIVE]: { name: "Идэвхгүй", color: "red-badge badge" },
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
  to?: string;
  from?: string;
  summary?: any;
}
export interface ScheduleDayData {
  times: string[];
  finish_time?: string | null;
}
export interface ScheduleData {
  [day: number]: ScheduleDayData;
}

export interface SearchType<T> {
  id: string;
  user_id?: string;
  value: string;
  item?: T | string;
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
  from: "",
  to: "",
  summary: undefined,
};

// export const PG = (dto: PgDto = {}): Required<PgDto> => ({
//   ...DEFAULT_PG,
//   ...dto,
// });

// patch put delete type
export type PPDT = { success: boolean; error?: string; data?: any };

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
  e: T,
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

export const getMethodValue = {
  [PaymentMethod.BANK]: "Bank",
  [PaymentMethod.CARD]: "Card",
  [PaymentMethod.CASH]: "Cash",
  [PaymentMethod.QPAY]: "Qpay",
};

export const getValuesStatus = {
  [STATUS.Active]: { name: "Идэвхтэй", color: "green-badge badge" },
  [STATUS.Hidden]: { name: "Цуцлах", color: "red-badge badge" },
  [STATUS.Pending]: { name: "Хүлээгдэж байна", color: "yellow-badge badge" },
};
export const getUserLevelValue = {
  [UserLevel.BRONZE]: {
    name: "Bronze",
    textColor: "#CD7F32",
    color: "bronze-badge badge",
    Icon: Medal, // хүрэн өнгө
  },
  [UserLevel.SILVER]: {
    name: "Silver",
    textColor: "#C0C0C0",
    color: "silver-badge badge",
    Icon: Star, // мөнгөлөг саарал
  },
  [UserLevel.GOLD]: {
    name: "Gold",
    textColor: "#FFD700",
    color: "gold-badge badge",
    Icon: Award, // алтлаг шар
  },
  [UserLevel.JUNIOR]: {
    name: "Junior",
    textColor: "#F97316",
    color: "orange-badge badge",
    Icon: Sparkles,
  },

  [UserLevel.SENIOR]: {
    name: "Senior",
    textColor: "#7C3AED",
    color: "purple-badge badge",
    Icon: Crown,
  },
};

export const getTransactionTypeValue = {
  QPAY: "Qpay",
  BANK: "Дансаар",
  CASH: "Бэлнээр",
  CARD: "Карт",
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
  [SalaryLogStatus.Paid]: {
    name: "Paid",
    color: "green-badge badge",
  },
  [SalaryLogStatus.Pending]: {
    name: "Pending",
    color: "yellow-badge badge",
  },
};

export const OrderStatusValues = {
  [OrderStatus.Active]: "Бэлэн",
  // [OrderStatus.Started]: "Эхэлсэн",
  [OrderStatus.Cancelled]: "Баталгаажуулаагүй",
  [OrderStatus.Finished]: "Дууссан",
  [OrderStatus.Pending]: "Хүлээгдэж",
  [OrderStatus.ABSENT]: "Цуцалсан",
  [OrderStatus.Friend]: "Танил",
};

export const StatusValues = {
  [STATUS.Active]: "Active",
  [STATUS.Hidden]: "Hidden",
  [STATUS.Pending]: "Pending",
};
export const PaymentTypeValues = {
  [PaymentType.Salary]: "Цалин",
  [PaymentType.Advance]: "Урьдчилгаа",
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
  user_id: "Артист",
  percent: "Цалингийн хувь",
  salary_day: "Цалин олгох огноо",
  new_status: "Шинэ төлөв",
  old_status: "Хуучин төлөв",
  new_order_status: "Шинэ захиалгын төлөв",
  old_order_status: "Хуучин захиалгын төлөв",
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

export const allTimes = Array.from({ length: 32 }, (_, i) => i * 0.5 + 7);
