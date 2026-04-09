export interface ISalaryLog {
  id: string;
  artist_id: string;
  approved_by: string;
  date: Date | string;
  amount: number;
  salary_status: number;
  order_count: number;
  created_at?: Date;
  approved_at?: Date;
}

export interface SalaryLog {
  id: string;
  artist_id: string;
  approved_by: string;
  date: Date | string;
  amount: number;
  salary_status: number;
  status: number;
  order_count: number;
  created_at?: Date;
  approved_at?: Date;
}
