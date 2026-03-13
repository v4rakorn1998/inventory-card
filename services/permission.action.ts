'use server'

import { createClient } from '@/lib/supabase/server'

export async function getMyPermissions(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data: employee } = await supabase
    .from('employees')
    .select(`
      role_id,
      roles (
        role_permissions (
          permissions (
            action
          )
        )
      )
    `)
    .eq('auth_user_id', user.id)
    .single()

  if (!employee || !employee.roles) return []

  // @ts-ignore (Supabase nested relationships type can be complex)
  const permissions = employee.roles.role_permissions.map(
    (rp: any) => rp.permissions.action
  )

  return permissions
}

export async function checkPermission(requiredPermission: string): Promise<boolean> {
  const permissions = await getMyPermissions()
  return permissions.includes(requiredPermission)
}