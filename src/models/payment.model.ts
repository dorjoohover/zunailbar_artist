import { PAYMENT_STATUS, PaymentMethod } from "@/lib/enum";

export interface Payment {
  id?: string;
  merchant_id: string;
  order_id: string;
  order_detail_id?: string;
  invoice_id?: string;
  payment_id?: string;
  qr_text?: string;
  qr_image?: string;

  amount: number;
  method: PaymentMethod;
  status: PAYMENT_STATUS;
  is_pre_amount: boolean; // урьдчилгаа эсэх
  paid_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
}
export interface IPayment {
  merchant_id?: string;
  order_id?: string;
  order_detail_id?: string;
  invoice_id?: string;
  payment_id?: string;
  qr_text?: string;
  qr_image?: string;

  amount?: number;
  method?: PaymentMethod;
  status?: PAYMENT_STATUS;
  is_pre_amount?: boolean; // урьдчилгаа эсэх
  paid_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
}
