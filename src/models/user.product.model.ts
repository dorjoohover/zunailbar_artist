export interface IUserProduct {
  id?: string;
  user_id?: string;
  branch_id?: string;
  product_id?: string;
  product_name?: string;
  user_name?: string;
  created_at?: Date;
  updated_at?: Date;
  quantity?: number;
  user_product_status?: number;
  brand_name?: string;
}
export interface UserProduct {
  id: string;
  user_id: string;
  branch_id: string;
  product_id: string;
  product_name?: string;
  user_name?: string;
  quantity: number;
  user_product_status: number;
  brand_name?: string;
  created_at?: Date;
  updated_at?: Date;
}
