export interface Employee {
  id: number;
  auth_user_id?: string | null;
  email: string;
  first_name: string;
  last_name: string;
  department_id?: number | null;
  job_level_id?: number | null;
  role_id?: number | null;
  created_at?: string;
  department?: {
    id: number;
    name: string;
  } | null;
  job_level?: {
    id: number;
    level_name: string;
  } | null;
  role?: {
    id: number;
    name: string;
  } | null;
}