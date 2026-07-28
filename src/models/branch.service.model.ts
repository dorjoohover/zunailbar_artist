export interface BranchServiceMeta {
  parallel?: boolean;
  serviceName?: string;
  branchName?: string;
  description?: string;
  categoryName?: string;
}

export interface IBranchService {
  id?: string;
  branch_id?: string;
  service_count?: number;
  service_id?: string;
  max_price?: number;
  min_price?: number;
  pre?: number;
  duration?: number;
  custom_name?: string;
  custom_description?: string;
  index?: number;
  status?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  meta?: BranchServiceMeta;
}
export interface BranchService {
  id: string;
  branch_id: string;
  service_id: string;
  max_price: number;
  min_price: number;
  pre: number;
  service_count?: number;
  duration: number;
  custom_name?: string;
  custom_description?: string;
  index?: number;
  status: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  meta?: BranchServiceMeta;
}
