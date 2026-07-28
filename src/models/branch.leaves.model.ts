import { EmployeeStatus } from "@/lib/enum";

export interface IBranchLeave {
  id?: string;
  branch_id: string;
  date?: Date;
  start_time?: string;
  end_time?: string;
  description?: string;
  created_at?: Date;
  created_by?: string;
}
export interface BranchLeave {
  id?: string;
  branch_id: string;
  date?: Date;
  start_time?: string;
  end_time?: string;
  description?: string;
  created_at?: Date;
  created_by?: string;
}
