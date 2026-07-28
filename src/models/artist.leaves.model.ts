import { EmployeeStatus } from "@/lib/enum";

export interface IArtistLeave {
  id?: string;
  artist_id: string;
  status?: EmployeeStatus;
  date?: Date;
  dates?: string[];
  start_time?: string;
  end_time?: string;
  description?: string;
  created_at?: Date;
  created_by?: string;
}
export interface ArtistLeave {
  id?: string;
  artist_id: string;
  status?: EmployeeStatus;
  date?: Date;
  start_time?: string;
  end_time?: string;
  description?: string;
  created_at?: Date;
  created_by?: string;
  creater_name?: string;
}
