import { UserLevel, VoucherStatus, VOUCHER } from "@/lib/enum";

export interface IVoucher {
  id?: string;
  user_id: string;
  name: string;
  type: VOUCHER;
  value: number;
  level?: UserLevel | null;
  voucher_status?: VoucherStatus;
  used_order_id?: string | null;
  used_order_date?: string | null;
  used_at?: Date | string | null;
  user_name?: string;
  mobile?: string | null;
  note?: string | null;
  status?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Voucher extends IVoucher {
  id: string;
  voucher_status: VoucherStatus;
  status: number;
}
