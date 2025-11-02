import { zNumOpt, zStrOpt, ZValidator } from "@/lib/constants";
import { OrderStatus } from "@/lib/enum";
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
    }
  ) => {
    height: string;
    left: string;
    maxWidth: string;
    minWidth: string;
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
    year: number
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
  duration: z
    .preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z.number()
    )
    .nullable()
    .optional() as unknown as number,
  description: zStrOpt,
  price: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "string") return parseFloat(val);
    return val;
  }, z.number()) as unknown as number,
  user_id: zStrOpt,
});

export const eventSchema = z.object({
  branch_id: ZValidator.branch.optional(),

  customer_id: ZValidator.customer.optional(),
  details: z.array(detail),
  description: z.string().nullable().optional(),
  order_date: z.string(),
  start_time: z.string(),
  end_time: z.string().nullable().optional(),
  order_status: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.nativeEnum(OrderStatus).nullable()
    )
    .optional() as unknown as number,
  total_amount: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "string") return parseFloat(val);
    return val;
  }, z.number()) as unknown as number,
  pre_amount: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "string") return parseFloat(val);
    return val;
  }, z.number()) as unknown as number,
  paid_amount: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "string") return parseFloat(val);
    return val;
  }, z.number()) as unknown as number,
  edit: z.string().nullable().optional(),
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
