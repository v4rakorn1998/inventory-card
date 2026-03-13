'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentEmployee } from './leave-request.action'

export async function getMyNotifications() {
  const supabase = await createClient()
  const employee = await getCurrentEmployee()
  if (!employee) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  return data
}

export async function markAsReadAction(notificationId: number) {
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
}

export async function markAllAsReadAction() {
  const supabase = await createClient()
  const employee = await getCurrentEmployee()
  if (!employee) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('employee_id', employee.id)
    .eq('is_read', false)
}