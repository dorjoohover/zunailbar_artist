export interface ICost {
  id: string;
  category_id: string;
  branch_id: string;
  branch_name: string;
  product_id: string;
  product_name: string;
  date: Date;
  price: number;
  paid_amount: number;
  status: number;
  cost_status: number;
  created_at?: Date;
}
export interface Cost {
  id: string;
  category_id: string;
  branch_id: string;
  branch_name: string;
  product_id: string;
  product_name: string;
  date: Date;
  price: number;
  paid_amount: number;
  status: number;
  cost_status: number;
  created_at?: Date;
}
