'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Employee } from '@/types/employee'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getEmployees(page: number = 1, limit: number = 10, departmentId?: number) {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('employees')
    .select(`
      *,
      department:department_id(id, name),
      job_level:job_level_id(id, level_name)
    `, { count: 'exact' })
    .eq('is_active', true)

  if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  const { data, error, count } = await query
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw new Error(error.message)
  
  return { 
    data: (data || []) as unknown as Employee[], 
    totalPages: count ? Math.ceil(count / limit) : 1, 
    currentPage: page 
  }
}

export async function createEmployeeAction(payload: {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  department_id: number | null;
  job_level_id: number | null;
}) {
  let authUserId = null;

  if (payload.password) {
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    });

    if (authError) {
      return { error: `สร้างบัญชีผู้ใช้ไม่สำเร็จ: ${authError.message}` };
    }
    authUserId = authData.user.id;
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .insert([{
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      department_id: payload.department_id,
      job_level_id: payload.job_level_id,
      auth_user_id: authUserId,
    }])

  if (error) {
    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }
    return { error: error.message }
  }
  
  revalidatePath('/employees')
  return { success: true }
}
export async function updateEmployeeAction(id: number, payload: {
  first_name: string;
  last_name: string;
  department_id: number | null;
  job_level_id: number | null;
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .update({
      first_name: payload.first_name,
      last_name: payload.last_name,
      department_id: payload.department_id,
      job_level_id: payload.job_level_id,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/employees')
  return { success: true }
}

export async function deleteEmployeeAction(id: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('employees')
    .update({ 
      deleted_at: new Date().toISOString(),
      is_active: false
    })
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/employees')
  return { success: true }
}