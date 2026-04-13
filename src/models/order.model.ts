import { OrderStatus, PaymentMethod, STATUS } from "@/lib/enum";
import { UserService } from "./user.service.model";
import { User } from "./user.model";
import { StringOrTemplateHeader } from "@tanstack/react-table";

export interface IOrder {
  user_id?: string;
  customer_id?: string;
  branch_id?: string;
  order_date?: string;
  start_time?: string;
  end_time?: string;
  // pre_amount: number;
  users?: Record<string, string>;
  description?: string;
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
  customer?: User;
  color?: number;
  created_by?: string | User;
  created_at?: Date;
  paid_at?: Date;
  transaction_type?: string;
  pre_method?: PaymentMethod;
  method?: PaymentMethod;
}
export interface Order {
  id: string;
  description?: string;
  created_by?: string | User;
  artist_name?: string;
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
  created_at?: Date;
  customer?: User;
  details?: IOrderDetail[];
  updated_at?: Date;
  paid_at?: Date;
  transaction_type?: string;
  method?: PaymentMethod;
  pre_method?: PaymentMethod;
}

export interface IOrderDetail {
  id?: string;
  order_id?: string;
  service_id: string;
  description?: string;
  price?: number;
  max_price?: number;
  min_price?: number;
  service_name?: string;
  user_id?: string;
  nickname?: string;
  order_date?: string;
  start_time?: string;
  end_time?: string;
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

export interface OrderLog {
  id: string;
  changed_by: string;
  changed_at: Date | string;
  order_id: string;
  old_status: STATUS;
  new_status: STATUS;
  old_order_status: OrderStatus;
  new_order_status: OrderStatus;
}
