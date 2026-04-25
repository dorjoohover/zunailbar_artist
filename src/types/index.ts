import { zNumOpt, zStrOpt, ZValidator } from "@/lib/constants";
import { OrderStatus, PaymentMethod, VOUCHER } from "@/lib/enum";
import { IOrder, Order } from "@/models";
import { Dispatch, SVGProps } from "react";
import { z } from "zod";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// SchedulerTypes.ts

// Define event type

// Define the state interface for the scheduler
export interface SchedulerState {
  events: Order[];
}

// Define actions for reducer
export type Action =
  | { type: "ADD_EVENT"; payload: IOrder }
  | { type: "REMOVE_EVENT"; payload: { id: string } }
  | { type: "UPDATE_EVENT"; payload: IOrder }
  | { type: "SET_EVENTS"; payload: IOrder[] };

// Define handlers interface
export interface Handlers {
  handleEventStyling: (
    event: Order,
    dayEvents: Order[],
    periodOptions?: {
      eventsInSamePeriod?: number;
      periodIndex?: number;
      adjustForPeriod?: boolean;
    },
  ) => {
    height: string;
    left: string;
    top: string;
    zIndex: number;
  };
  handleAddEvent: (event: IOrder) => void;
  handleUpdateEvent: (event: IOrder, id: string) => void;
  handleDeleteEvent: (id: string) => void;
}

// Define getters interface
export interface Getters {
  getDaysInMonth: (
    month: number,
    year: number,
  ) => { day: number; events: IOrder[] }[];
  getEventsForDay: (day: number, currentDate: Date) => Order[];
  getDaysInWeek: (week: number, year: number) => Date[];
  getWeekNumber: (date: Date) => number;
  getDayName: (day: number) => string;
}

// Define the context value interface
export interface SchedulerContextType {
  events: SchedulerState;
  dispatch: Dispatch<Action>;
  getters: Getters;
  handlers: Handlers;
  weekStartsOn: startOfWeek;
}

// Define the variant options
export const variants = [
  "success",
  "primary",
  "default",
  "warning",
  "danger",
] as const;

export type Variant = (typeof variants)[number];

// Define Zod schema for form validation
// branch_id: selected.branch_id,
// details: selected.details,
// order_date: selected.order_date,
// start_time: selected.start_time,
// customer_desc: selected.customer_desc,
// user_id: selected.user_id,
const detail = z.object({
  service_id: z.string(),
  service_name: z.string(),
  category_id: zStrOpt({
    label: "Ангилал",
  }),
  duration: zNumOpt({
    label: "Хугацаа",
    value: 0,
  }),
  description: zStrOpt({}),
  parallel: z.boolean().nullable().optional(),
  price: zNumOpt({
    value: 0,
    label: "Үнэ",
  }),
  min_price: zNumOpt({
    value: 0,
    label: "Доод үнэ",
    allowNullable: true,
  }),
  max_price: zNumOpt({
    value: 0,
    label: "Дээд үнэ",
    allowNullable: true,
  }),
  original_price: zNumOpt({
    value: 0,
    label: "Үндсэн үнэ",
    allowNullable: true,
  }),
  user_id: zStrOpt({
    allowNullable: false,
    label: "Артист",
  }),
  id: z.any(),
});

export const eventSchema = z.object({
  branch_id: zStrOpt({
    label: "Салбар",
    allowNullable: false,
  }),

  customer_id: zStrOpt({
    allowNullable: false,
    label: "Хэрэглэгч",
  }),
  duration: zNumOpt({
    allowNullable: true,
    label: "Хугацаа",
  }),
  details: z.array(detail),
  description: zStrOpt({
    label: "Тайлбар",
  }),
  order_date: zStrOpt({
    label: "Захиалгын огноо",
    allowNullable: false,
  }),
  start_time: zStrOpt({
    allowNullable: false,
    label: "Цаг",
  }),
  end_time: zStrOpt({
    label: "Дуусах цаг",
  }),
  order_status: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(OrderStatus).nullable(),
    )
    .optional() as unknown as number,
  method: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(PaymentMethod).nullable(),
    )
    .optional() as unknown as number,
  pre_method: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(PaymentMethod).nullable(),
    )
    .optional() as unknown as number,
  total_amount: zNumOpt({
    label: "Нийт үнэ",
    value: 0,
  }),
  pre_amount: zNumOpt({
    value: 0,
    label: "Урьдчилгаа",
  }),
  paid_amount: zNumOpt({
    value: 0,
    label: "Гүйцээж төлсөн төлбөр",
    allowNullable: true,
  }),
  voucher_id: z.string().nullable().optional(),
  voucher_name: z.string().nullable().optional(),
  voucher_value: zNumOpt({
    value: 0,
    label: "Урамшууллын дүн",
    allowNullable: true,
  }),
  discount: zNumOpt({
    value: 0,
    label: "Хөнгөлөлт",
    allowNullable: true,
  }),
  discount_type: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(VOUCHER).nullable(),
    )
    .optional() as unknown as number,
  parallel: z.boolean().nullable().optional(),
  edit: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  const preAmount = Number(data.pre_amount ?? 0);
  const paidAmount = Number(data.paid_amount ?? 0);

  if (preAmount > 0 && !data.pre_method) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pre_method"],
      message: "Урьдчилгааны төлбөрийн хэлбэр сонгоно уу",
    });
  }

  if (paidAmount > 0 && !data.method) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["method"],
      message: "Үлдэгдэл төлбөрийн хэлбэр сонгоно уу",
    });
  }
});

export type EventFormData = z.infer<typeof eventSchema>;

export type Views = {
  mobileViews?: string[];
  views?: string[];
};

export type startOfWeek = "sunday" | "monday";

export interface CustomEventModal {
  CustomAddEventModal?: {
    title?: string;
    CustomForm?: React.FC<{ register: any; errors: any }>;
  };
}

export interface CustomComponents {
  customButtons?: {
    CustomAddEventButton?: React.ReactNode;
    CustomPrevButton?: React.ReactNode;
    CustomNextButton?: React.ReactNode;
  };

  customTabs?: {
    CustomDayTab?: React.ReactNode;
    CustomWeekTab?: React.ReactNode;
    CustomMonthTab?: React.ReactNode;
  };
  CustomEventComponent?: React.FC<IOrder>; // Using custom event type
  CustomEventModal?: CustomEventModal;
}

export interface ButtonClassNames {
  prev?: string;
  next?: string;
  addEvent?: string;
}

export interface TabClassNames {
  view?: string;
}

export interface TabsClassNames {
  cursor?: string;
  panel?: string;
  tab?: string;
  tabContent?: string;
  tabList?: string;
  wrapper?: string;
}

export interface ViewClassNames {
  dayView?: string;
  weekView?: string;
  monthView?: string;
}

export interface ClassNames {
  event?: string;
  buttons?: ButtonClassNames;
  tabs?: TabsClassNames;
  views?: ViewClassNames;
}
