import { ROLE } from "@/lib/enum";

export interface IUser {
  id?: string;
  firstname?: string;
  lastname?: string;
  role?: ROLE;
  nickname?: string;
  profile_img?: string;
  mobile?: string;
  birthday?: Date;
  added_by?: string;
  branch_id?: string;
  user_status?: number;
  description?: string;
  password?: string;
  experience?: number;
  percent?: number;
  created_at?: Date;
  level?: number;
}
export interface User {
  id: string;
  percent?: number;
  level?: number;
  color?: number;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  role: ROLE;
  mobile?: string;
  birthday?: Date;
  added_by: string;
  branch_id: string;
  branch_name?: string;
  user_status: number;
  experience?: number;
  profile_img?: string;
  description?: string;
  created_at?: Date;
}

export interface ILoginUser {
  mobile: string;
  password: string;
}
export interface IRegisterUser {
  mobile: string;
}
// AJiltan, users
