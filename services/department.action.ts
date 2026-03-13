'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Department } from '@/types/department'
import { checkPermission } from './permission.action'

export async function getDepartments(page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('departments')
    .select(`
      id, name, parent_department_id, manager_id,
      parent:parent_department_id(id, name),
      manager:manager_id(id, first_name, last_name)
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('id', { ascending: true })
    .range(from, to)
    
  if (error) throw new Error(error.message)
  
  const totalPages = count ? Math.ceil(count / limit) : 1
  return { data: (data || []) as unknown as Department[], totalPages, currentPage: page }
}

export async function getEmployeesForDropdown() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .order('first_name', { ascending: true })
    
  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }
  return data
}

export async function createDepartmentAction(payload: {
  name: string;
  parent_department_id: number | null;
  manager_id: number | null;
}) {
  
  const hasPermission = await checkPermission('manage:settings')
  if (!hasPermission) {
    return { error: 'คุณไม่มีสิทธิ์ในการสร้างแผนก (ต้องการสิทธิ์ manage:settings)' }
  }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('departments')
    .insert([payload])
    
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/departments') 
  return { success: true }
}

export async function updateDepartmentAction(id: number, payload: {
  name: string;
  parent_department_id: number | null;
  manager_id: number | null;
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('departments')
    .update(payload)
    .eq('id', id)
    
  if (error) return { error: error.message }
  
  revalidatePath('/departments')
  return { success: true }
}

export async function deleteDepartmentAction(id: number) {
  const supabase = await createClient()
  
  const { data: children } = await supabase
    .from('departments')
    .select('id')
    .eq('parent_department_id', id)
    .eq('is_active', true)
    .limit(1)

  if (children && children.length > 0) {
    return { error: "ไม่สามารถลบได้ เนื่องจากมีแผนกย่อยที่ยังใช้งานอยู่เชื่อมโยงกับแผนกนี้" }
  }

  const { error } = await supabase
    .from('departments')
    .update({ 
      is_active: false,
      parent_department_id: null ,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)
    
  if (error) return { error: error.message }
  
  revalidatePath('/departments')
  return { success: true }
}