import { STATUS } from "@/lib/enum";

interface Discounted {
  discountedAmount: number;
  discount: number;
  discountValue: string;
  discountType: number;
}
export interface ServiceCategoryMeta {
  name: string;
}

export interface IService {
  id?: string;
  merchant_id?: string;
  category_id?: string;
  name?: string;
  max_price?: number;
  min_price?: number;
  duration?: number;
  image?: string;
  icon?: string;
  description?: string;
  pre?: number;
  status?: STATUS;
  created_by?: string;
  created_at?: Date;
  view?: number;
  index?: number;
  meta?: ServiceCategoryMeta;
  min: Discounted;
  max?: Discounted;
}
export interface Service {
  id: string;
  merchant_id: string;
  category_id?: string;
  name: string;
  max_price: number;
  min_price: number;
  duration: number;
  image: string;
  icon: string;
  description: string;
  pre?: number;
  status: STATUS;
  created_by: string;
  created_at: Date;
  view?: number;
  index?: number;
  meta?: ServiceCategoryMeta;
  min: Discounted;
  max?: Discounted;
}
