import { Employee } from "./employee";
import { LeaveType } from "./leave-type";

export type LeaveStatus = 'pending' | 'pending_manager' | 'pending_hr' | 'approved' | 'rejected' | 'cancelled' | 'pending_cancellation' | 'pending_cancellation_hr';

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string | null;
  status: LeaveStatus;
  approver_id?: number | null;
  created_at?: string;
  updated_at?: string;
  
  employee?: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'department_id'> | null;
  leave_type?: Pick<LeaveType, 'id' | 'name' | 'is_paid'> | null;
  approver?: Pick<Employee, 'id' | 'first_name' | 'last_name'> | null;
}