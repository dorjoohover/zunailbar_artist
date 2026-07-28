export interface IDiscount {
  id: string;
  service_id: string;
  start_date: Date;
  end_date: Date;
  type: number;
  value: number;
  name: string;
  created_at?: Date;
}
export interface Discount {
  id: string;
  service_id: string;
  branch_id: string;
  start_date: Date;
  end_date: Date;
  type: number;
  value: number;
  name: string;
  created_at?: Date;
}
