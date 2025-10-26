import { User } from "./user.model";

export interface IUserService {
  id?: string;
  service_id?: string;
  user_id: string;
  service_name?: string;
  user_name?: string;
  updated_at?: Date;
  created_at?: Date;
  user: User;
}
export interface UserService {
  services: any;
  id: string;
  service_id: string;
  user_id: string;
  service_name?: string;
  user_name?: string;
  updated_at?: Date;
  created_at?: Date;
  user?: User
}

// ajiltnii service