export interface ProductWarehouse {
  id: string;
  product_id: string;
  warehouse_id: string;
  warehouse_name: string;
  created_by: string;
  quantity: number;
  created_at?: Date;
  date?: Date;
  updated_at?: Date;
}
export interface IProductWarehouse {
  id: string;
  product_id?: string;
  product_name?: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IProductsWarehouse {
  warehouse_id: string;
  products: IProductWarehouse[];
}
