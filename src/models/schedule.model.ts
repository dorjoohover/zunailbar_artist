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
  // Тухайн мөрийн бодит огноо (YYYY-MM-DD). 2026-07-26-ны шинэчлэлээс хойш
  // `date` нь үндсэн түлхүүр; `index` нь зөвхөн derive/legacy харагдацад ашиглагдана.
  date?: string;
  index?: number;
  is_generated?: boolean;
  start_time?: Date;
  end_time?: Date;
  finish_time?: Date | string | null;
  times?: string[] | null;
  schedule_status?: number;
  // NULL = амралтгүй. Утгатай бол EmployeeStatus enum (жишээ VACATION/DEKIRIT).
  leave_status?: number | null;
  leave_description?: string | null;
  created_at?: Date;
  updated_at?: Date;
  meta?: ScheduleUserMeta;
}
export interface Schedule {
  id: string;
  user_id: string;
  approved_by: string;
  branch_id: string;
  date?: string;
  index: number;
  is_generated?: boolean;
  start_time: Date;
  end_time: Date;
  finish_time?: Date | string | null;
  schedule_status: number;
  times: string;
  leave_status?: number | null;
  leave_description?: string | null;
  // "/schedule/leave" жагсаалтад л join хийж ирнэ.
  creator_nickname?: string | null;
  creator_firstname?: string | null;
  creator_lastname?: string | null;
  created_at?: Date;
  updated_at?: Date;
  meta?: ScheduleUserMeta;
}
export interface IBooking {
  id?: string;
  approved_by?: string;
  merchant_id?: string;
  branch_id: string;
  index?: number;
  // Тухайн мөрийн бодит огноо (YYYY-MM-DD). 2026-08-05-ны шинэчлэлээс хойш
  // `date` нь үндсэн түлхүүр; `index` нь зөвхөн derive/legacy харагдацад ашиглагдана.
  date?: string;
  is_generated?: boolean;
  start_time?: Date;
  end_time?: Date;
  finish_time?: Date | string | null;
  booking_status?: number;
  times?: string[];
  is_leave?: boolean;
  leave_description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}
export interface Booking {
  id: string;
  approved_by: string;
  merchant_id: string;
  branch_id: string;
  index: number;
  date?: string;
  is_generated?: boolean;
  start_time: Date;
  end_time: Date;
  finish_time?: Date | string | null;
  booking_status: number;
  times: string;
  is_leave?: boolean;
  leave_description?: string | null;
  branch_name?: string | null;
  creator_nickname?: string | null;
  creator_firstname?: string | null;
  creator_lastname?: string | null;
  created_at?: Date;
  updated_at?: Date;
}
