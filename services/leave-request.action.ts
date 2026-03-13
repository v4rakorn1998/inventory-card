'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { LeaveRequest } from '@/types/leave-request'
import { checkPermission } from './permission.action'

export async function getCurrentEmployee() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('employees')
    .select('id, department_id, first_name, last_name')
    .eq('auth_user_id', user.id)
    .single()
    
  return data
}

export async function submitLeaveRequest(payload: {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
}) {
  const supabase = await createClient()
  const employee = await getCurrentEmployee()
  
  if (!employee) return { error: "ไม่พบข้อมูลพนักงาน" }

  let approverId = null;

  if (employee.department_id) {
    const { data: currentDept } = await supabase
      .from('departments')
      .select('manager_id, parent_department_id')
      .eq('id', employee.department_id)
      .single()

    if (currentDept) {
      if (currentDept.manager_id && currentDept.manager_id !== employee.id) {
        approverId = currentDept.manager_id;
      } 
      else if (currentDept.parent_department_id) {
        const { data: parentDept } = await supabase
          .from('departments')
          .select('manager_id')
          .eq('id', currentDept.parent_department_id)
          .single()

        if (parentDept && parentDept.manager_id) {
          approverId = parentDept.manager_id;
        }
      }
    }
  }

  const initialStatus = approverId ? 'pending_manager' : 'pending_hr';

  const { error } = await supabase
    .from('leave_requests')
    .insert([{
      employee_id: employee.id,
      status: initialStatus,
      ...payload
    }])

  if (error) return { error: error.message }

  if (approverId) {
    await supabase.from('notifications').insert([{
      employee_id: approverId,
      title: 'คำขออนุมัติการลาใหม่',
      message: `${employee.first_name} ${employee.last_name} ได้ยื่นคำขออนุมัติการลา โปรดตรวจสอบ`,
      link: '/leave-approvals'
    }])
  } else if (initialStatus === 'pending_hr') {
    await notifyAllHR(supabase, 'คำขออนุมัติการลาใหม่ (ส่งตรงถึง HR)', `${employee.first_name} ${employee.last_name} ได้ยื่นคำขออนุมัติการลา โปรดตรวจสอบ`);
  }
  
  revalidatePath('/my-leaves')
  return { success: true }
}

export async function getMyLeaveRequests(page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  const employee = await getCurrentEmployee()
  
  if (!employee) throw new Error("Unauthorized")

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      leave_type:leave_types!leave_requests_leave_type_id_fkey(id, name, is_paid),
      approver:employees!leave_requests_approver_id_fkey(id, first_name, last_name)
    `, { count: 'exact' })
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return { 
    data: (data || []) as unknown as LeaveRequest[], 
    totalPages: count ? Math.ceil(count / limit) : 1, 
    currentPage: page 
  }
}

export async function getPendingApprovals(page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  const manager = await getCurrentEmployee()
  if (!manager) throw new Error("Unauthorized")

  const isCEO = await checkPermission('approve:all_leaves')
  const isHR = await checkPermission('approve:hr_final')

  const { data: managedDepts } = await supabase
    .from('departments')
    .select('id')
    .eq('manager_id', manager.id)

  const deptIds = managedDepts?.map(d => d.id) || []

  if (!isCEO && !isHR && deptIds.length === 0) {
     return { data: [], totalPages: 1, currentPage: page }
  }

  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees!leave_requests_employee_id_fkey!inner(id, first_name, last_name, department_id),
      leave_type:leave_types!leave_requests_leave_type_id_fkey(id, name, is_paid)
    `, { count: 'exact' })
    .in('status', ['pending', 'pending_manager', 'pending_hr', 'pending_cancellation', 'pending_cancellation_hr'])
    .order('created_at', { ascending: true })

  let { data, error } = await query

  if (error) throw new Error(error.message)
  let filteredData = (data || []) as any[];

  if (isCEO) {
     filteredData = filteredData.filter(r => ['pending', 'pending_manager', 'pending_hr', 'pending_cancellation', 'pending_cancellation_hr'].includes(r.status))
  } else {
    filteredData = filteredData.filter(r => {
      if (isHR && ['pending_hr', 'pending_cancellation_hr'].includes(r.status)) return true;
      if (deptIds.includes(r.employee.department_id) && ['pending', 'pending_manager', 'pending_cancellation'].includes(r.status)) return true;
      return false;
    })
  }

  const totalPages = Math.ceil(filteredData.length / limit) || 1
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit)

  return { 
    data: paginatedData as unknown as LeaveRequest[], 
    totalPages, 
    currentPage: page 
  }
}

export async function updateLeaveStatusAction(requestId: number, action: 'approve' | 'reject') {
  const supabase = await createClient()
  const manager = await getCurrentEmployee()
  if (!manager) return { error: "Unauthorized" }

  const isCEO = await checkPermission('approve:all_leaves')

  const { data: request } = await supabase
    .from('leave_requests')
    .select('status, employee_id, leave_type:leave_types(name), employee:employees(first_name, last_name)')
    .eq('id', requestId)
    .single()

  if (!request) return { error: "ไม่พบข้อมูลใบลา" }

  let newStatus = ''
  
  if (request.status === 'pending_manager' || request.status === 'pending') {
    if (action === 'approve') {
      newStatus = isCEO ? 'approved' : 'pending_hr'
    } else {
      newStatus = 'rejected'
    }
  } else if (request.status === 'pending_hr') {
    newStatus = action === 'approve' ? 'approved' : 'rejected'
  } else if (request.status === 'pending_cancellation') {
    if (action === 'approve') {
      newStatus = isCEO ? 'cancelled' : 'pending_cancellation_hr'
    } else {
      newStatus = 'approved'
    }
  } else if (request.status === 'pending_cancellation_hr') {
    newStatus = action === 'approve' ? 'cancelled' : 'approved' 
  } else {
    return { error: "สถานะใบลาไม่ถูกต้อง" }
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({ 
      status: newStatus, 
      approver_id: manager.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  let title = '';
  let message = '';
  
  const reqData = request as any;
  const leaveName = Array.isArray(reqData.leave_type) 
    ? reqData.leave_type[0]?.name 
    : (reqData.leave_type?.name || 'การลา');

  if (newStatus === 'pending_hr') {
    const empData = Array.isArray(reqData.employee) ? reqData.employee[0] : reqData.employee;
    const empName = empData ? `${empData.first_name} ${empData.last_name}` : 'พนักงาน';
    await notifyAllHR(supabase, 'รอ HR อนุมัติการลาขั้นสุดท้าย', `${empName} ได้รับการอนุมัติจากหัวหน้าแผนกแล้ว รอ HR อนุมัติ ${leaveName}`);
  } else {
    if (newStatus === 'approved') {
      title = 'อนุมัติการลาขั้นสุดท้ายแล้ว';
      message = `คำขอ${leaveName} ของคุณได้รับการอนุมัติแล้ว`;
    } else if (newStatus === 'rejected') {
      title = 'ปฏิเสธการลา';
      message = `คำขอ${leaveName} ของคุณถูกปฏิเสธ`;
    } else if (newStatus === 'cancelled') {
      title = 'อนุมัติการยกเลิกการลา';
      message = `คำขอยกเลิก${leaveName} ของคุณได้รับการอนุมัติแล้ว`;
    }
    else if (newStatus === 'pending_cancellation_hr') {
      const empData = Array.isArray(reqData.employee) ? reqData.employee[0] : reqData.employee;
      const empName = empData ? `${empData.first_name} ${empData.last_name}` : 'พนักงาน';
      await notifyAllHR(supabase, 'รอ HR อนุมัติยกเลิกการลา', `${empName} ได้รับการอนุมัติยกเลิกจากหัวหน้าแผนกแล้ว รอ HR ตรวจสอบ ${leaveName}`);
    }

    if (title) {
      await supabase.from('notifications').insert([{
        employee_id: request.employee_id,
        title: title,
        message: message,
        link: '/my-leaves'
      }])
    }
  }
  
  revalidatePath('/leave-approvals')
  revalidatePath('/my-leaves')
  return { success: true }
}

export async function getMyLeaveQuotas() {
  const supabase = await createClient()
  const employee = await getCurrentEmployee()
  
  if (!employee) throw new Error("Unauthorized")

  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('*')
    .eq('is_active', true)
    
  const { data: empData } = await supabase
    .from('employees')
    .select('job_level:job_levels(annual_leave_quota)')
    .eq('id', employee.id)
    .single()

  // @ts-ignore
  const annualLeaveQuota = empData?.job_level?.annual_leave_quota || 0

  const currentYear = new Date().getFullYear()
  const { data: requests } = await supabase
    .from('leave_requests')
    .select('leave_type_id, total_days, status')
    .eq('employee_id', employee.id)
    .gte('start_date', `${currentYear}-01-01`)
    .lte('end_date', `${currentYear}-12-31`)
    .in('status', ['approved', 'pending', 'pending_manager', 'pending_hr', 'pending_cancellation', 'pending_cancellation_hr'])

  const quotas = leaveTypes?.map(type => {
    let totalQuota = type.default_quota;
    if (type.name.includes('พักร้อน') && annualLeaveQuota > 0) {
       totalQuota = annualLeaveQuota;
    }

    const typeRequests = requests?.filter(r => r.leave_type_id === type.id) || [];
    
    const approvedDays = typeRequests.filter(r => ['approved', 'pending_cancellation', 'pending_cancellation_hr'].includes(r.status)).reduce((sum, r) => sum + Number(r.total_days), 0);
    const pendingDays = typeRequests.filter(r => ['pending', 'pending_manager', 'pending_hr'].includes(r.status)).reduce((sum, r) => sum + Number(r.total_days), 0);
    
    const usedDays = approvedDays + pendingDays;
    const remainingDays = totalQuota - usedDays;

    return {
      id: type.id,
      name: type.name,
      total_quota: totalQuota,
      approved_days: approvedDays,
      pending_days: pendingDays,
      used_days: usedDays,
      remaining_days: remainingDays
    }
  }) || []

  return quotas
}

export async function cancelLeaveRequestAction(requestId: number, currentStatus: string) {
  const supabase = await createClient()
  const employee = await getCurrentEmployee()
  if (!employee) return { error: "Unauthorized" }

  let newStatus = 'cancelled'
  let approverId = null;

  if (currentStatus === 'approved') {
    if (employee.department_id) {
      const { data: currentDept } = await supabase
        .from('departments')
        .select('manager_id, parent_department_id')
        .eq('id', employee.department_id)
        .single()

      if (currentDept) {
        if (currentDept.manager_id && currentDept.manager_id !== employee.id) {
          approverId = currentDept.manager_id;
        } else if (currentDept.parent_department_id) {
          const { data: parentDept } = await supabase
            .from('departments')
            .select('manager_id')
            .eq('id', currentDept.parent_department_id)
            .single()

          if (parentDept && parentDept.manager_id) {
            approverId = parentDept.manager_id;
          }
        }
      }
    }
    newStatus = approverId ? 'pending_cancellation' : 'pending_cancellation_hr'
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({ 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', requestId)
    .eq('employee_id', employee.id)

  if (error) return { error: error.message }
  
  if (newStatus === 'pending_cancellation' && approverId) {
    await supabase.from('notifications').insert([{
      employee_id: approverId,
      title: 'คำขอยกเลิกการลา',
      message: `${employee.first_name} ${employee.last_name} ขอยกเลิกการลาที่อนุมัติไปแล้ว โปรดตรวจสอบ`,
      link: '/leave-approvals'
    }])
  } else if (newStatus === 'pending_cancellation_hr') {
    await notifyAllHR(supabase, 'ขอยกเลิกการลา', `${employee.first_name} ${employee.last_name} ขอยกเลิกการลาที่อนุมัติไปแล้ว โปรดตรวจสอบ`);
  }

  revalidatePath('/my-leaves')
  revalidatePath('/leave-approvals')
  return { success: true }
}

export async function getApprovalHistory(page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  const manager = await getCurrentEmployee()
  
  if (!manager) throw new Error("Unauthorized")

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees!leave_requests_employee_id_fkey(id, first_name, last_name, department_id),
      leave_type:leave_types!leave_requests_leave_type_id_fkey(id, name, is_paid)
    `, { count: 'exact' })
    .eq('approver_id', manager.id)
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return { 
    data: (data || []) as unknown as LeaveRequest[], 
    totalPages: count ? Math.ceil(count / limit) : 1, 
    currentPage: page 
  }
}

async function notifyAllHR(supabase: any, title: string, message: string) {
  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('role_id, permissions!inner(action)')
    .eq('permissions.action', 'approve:hr_final');
    
  if (!rolePerms || rolePerms.length === 0) return;
  const hrRoleIds = rolePerms.map((rp: any) => rp.role_id);
  
  const { data: hrEmployees } = await supabase
    .from('employees')
    .select('id')
    .in('role_id', hrRoleIds)
    .eq('is_active', true);
    
  if (!hrEmployees || hrEmployees.length === 0) return;
  
  const notifications = hrEmployees.map((hr: any) => ({
    employee_id: hr.id,
    title,
    message,
    link: '/leave-approvals'
  }));
  
  await supabase.from('notifications').insert(notifications);
}