export interface ProductTransaction {
  id: string;
  product_id: string;
  user_id: string;
  branch_id: string;
  quantity: number;
  price: number;
  total_amount: number;
  product_transaction_status: number;
  created_by: string;
  created_at?: Date;
}
export interface IProductTransaction {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string;
  user_name: string;
  branch_id: string;
  branch_name: string;
  quantity: number;
  price: number;
  total_amount: number;
  product_transaction_status: number;
  created_by: string;
  created_at?: Date;
}
