'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getJobLevels(page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('job_levels')
    .select('*', { count: 'exact' })
    .order('level_tier', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  
  const totalPages = count ? Math.ceil(count / limit) : 1
  return { data: data || [], totalPages, currentPage: page }
}

export async function createJobLevelAction(payload: {
  level_name: string;
  level_tier: number;
  annual_leave_quota: number;
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('job_levels')
    .insert([payload])

  if (error) return { error: error.message }
  
  revalidatePath('/job-levels')
  return { success: true }
}

export async function updateJobLevelAction(id: number, payload: {
  level_name: string;
  level_tier: number;
  annual_leave_quota: number;
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('job_levels')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/job-levels')
  return { success: true }
}

export async function deleteJobLevelAction(id: number) {
  const supabase = await createClient()
  
  const { data: employees } = await supabase
    .from('employees')
    .select('id')
    .eq('job_level_id', id)
    .limit(1)

  if (employees && employees.length > 0) {
    return { error: "ไม่สามารถลบได้ เนื่องจากมีพนักงานใช้งานระดับตำแหน่งนี้อยู่" }
  }

  const { error } = await supabase
    .from('job_levels')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/job-levels')
  return { success: true }
}