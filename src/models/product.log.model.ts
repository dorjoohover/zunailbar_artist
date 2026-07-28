export interface ProductLog {
  id: string;
  product_id: string;
  merchant_id: string;
  quantity: number;
  price: number;
  total_amount: number;
  paid_amount: number;
  unit_price: number;
  currency: string;
  product_log_status: number;
  date: Date;
  created_by: string;
  cargo?: number;
  created_at?: Date;
}
export interface IProductLog {
  id: string;
  product_id: string;
  unit_price?: number;
  product_name: string;
  quantity: number;
  currency_amount?: number;
  cargo?: number;
  price: number;
  total_amount: number;
  paid_amount: number;
  product_log_status: number;
  currency?: string;
  date: Date;
  created_by?: string;
  created_at?: Date;
}
