export interface LeaveType {
  id: number;
  name: string;
  description?: string | null;
  default_quota: number;
  is_paid: boolean;
  is_active: boolean;
  created_at?: string;
}