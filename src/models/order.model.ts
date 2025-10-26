import { OrderStatus } from "@/lib/enum";
import { UserService } from "./user.service.model";

export interface IOrder {
  user_id?: string;
  customer_id?: string;
  customer_desc?: string;
  branch_id?: string;
  order_date?: string;
  start_time?: string;
  end_time?: string;
  // pre_amount: number;
  users?: Record<string, string>;
  user_desc?: string;
  details?: IOrderDetail[] | any[];
  duplicated?: boolean;
  id?: string;
  order_status?: OrderStatus | undefined;
  edit?: string;
  total_amount?: number;
  paid_amount?: number;
  pre_amount?: number;
  duration?: number;
  is_pre_amount_paid?: boolean;
  phone?: string;
  color?: number;
}
export interface Order {
  id: string;
  user_id: string;
  customer_id: string;
  branch_id?: string;
  duration: number;
  order_date: string;
  start_time: string;
  end_time: string;
  order_status: number;
  pre_amount: number;
  is_pre_amount_paid: boolean;
  total_amount: number;
  paid_amount: number;
  customer_desc: string;
  user_desc: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IOrderDetail {
  id?: string;
  order_id?: string;
  service_id: string;
  max_price?: number;
  min_price?: number;
  service_name?: string;
  user_id?: string;
  duration?: number;
  duplicated?: boolean;
  category?: number | null;
  created_at?: Date;
  pre?: number;
}

export interface DateTime {
  [index: number]: number[];
}
export interface UserDateTime extends UserService {
  slots: DateTime;
  services: string[];
}
