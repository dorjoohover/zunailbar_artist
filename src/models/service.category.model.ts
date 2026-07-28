export interface IServiceCategory {
  id?: string;
  merchant_id?: string;
  status?: number;
  created_at?: Date;
}
export interface ServiceCategory {
  id: string;
  merchant_id: string;
  name: string;
  status: number;
  created_at?: Date;
}
