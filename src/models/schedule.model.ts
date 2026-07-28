export interface ScheduleUserMeta {
  mobile: string;
  nickname: string;
  color: number;
}
export interface ISchedule {
  id?: string;
  user_id: string;
  approved_by?: string;
  branch_id?: string;
  index: number;
  start_time?: Date;
  end_time?: Date;
  finish_time?: Date | string | null;
  times?: string[] | null;
  schedule_status?: number;
  created_at?: Date;
  updated_at?: Date;
  meta?: ScheduleUserMeta;
}
export interface Schedule {
  id: string;
  user_id: string;
  approved_by: string;
  branch_id: string;
  index: number;
  start_time: Date;
  end_time: Date;
  finish_time?: Date | string | null;
  schedule_status: number;
  times: string;
  created_at?: Date;
  updated_at?: Date;
  meta?: ScheduleUserMeta;
}
export interface IBooking {
  id?: string;
  approved_by?: string;
  merchant_id?: string;
  branch_id: string;
  index: number;
  start_time?: Date;
  end_time?: Date;
  finish_time?: Date | string | null;
  booking_status?: number;
  times?: string[];
  created_at?: Date;
  updated_at?: Date;
}
export interface Booking {
  id: string;
  approved_by: string;
  merchant_id: string;
  branch_id: string;
  index: number;
  start_time: Date;
  end_time: Date;
  finish_time?: Date | string | null;
  booking_status: number;
  times: string;
  created_at?: Date;
  updated_at?: Date;
}
