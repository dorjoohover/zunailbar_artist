interface Discounted {
  discountedAmount: number;
  discount: number;
  discountValue: string;
  discountType: number;
}

export interface IService {
  id?: string;
  branch_id?: string;
  name?: string;
  max_price?: number;
  min_price?: number;
  duration?: number;
  description: string;
  created_by?: string;
  pre?: number;
  image?: string;
  icon?: string;
  created_at?: Date;
  min: Discounted;
  max?: Discounted;
}
export interface Service {
  id: string;
  branch_id: string;
  description: string;
  name: string;
  max_price: number;
  min_price: number;
  image: string;
  icon: string;
  duration: number;
  pre: number;
  created_by: string;
  created_at?: Date;
  min: Discounted;
  max?: Discounted;
}
