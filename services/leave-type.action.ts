'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { LeaveType } from '@/types/leave-type'

export async function getLeaveTypes(page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('leave_types')
    .select('*', { count: 'exact' })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw new Error(error.message)
  
  const totalPages = count ? Math.ceil(count / limit) : 1
  return { 
    data: (data || []) as LeaveType[], 
    totalPages, 
    currentPage: page 
  }
}

export async function createLeaveTypeAction(payload: {
  name: string;
  description: string;
  default_quota: number;
  is_paid: boolean;
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('leave_types')
    .insert([{
      name: payload.name,
      description: payload.description || null,
      default_quota: payload.default_quota,
      is_paid: payload.is_paid,
    }])

  if (error) return { error: error.message }
  
  revalidatePath('/leave-types')
  return { success: true }
}

export async function updateLeaveTypeAction(id: number, payload: {
  name: string;
  description: string;
  default_quota: number;
  is_paid: boolean;
  is_active: boolean;
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('leave_types')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/leave-types')
  return { success: true }
}

export async function deleteLeaveTypeAction(id: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('leave_types')
    .update({ 
      is_active: false,
      deleted_at: new Date().toISOString() 
    })
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/leave-types')
  return { success: true }
}