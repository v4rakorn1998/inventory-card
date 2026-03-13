export interface Department {
  id: number;
  name: string;
  parent_department_id?: number | null;
  manager_id?: number | null;
  parent?: {
    id: number;
    name: string;
  } | null;
  manager?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  created_at?: string;
}