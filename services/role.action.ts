'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkPermission } from './permission.action'

export async function getRolesAndPermissions() {
  const supabase = await createClient()

  const { data: roles } = await supabase.from('roles').select('*').order('id')
  
  const { data: permissions } = await supabase.from('permissions').select('*').order('id')
  
  const { data: rolePermissions } = await supabase.from('role_permissions').select('*')

  return {
    roles: roles || [],
    permissions: permissions || [],
    rolePermissions: rolePermissions || []
  }
}

export async function toggleRolePermissionAction(roleId: number, permissionId: number, isGranted: boolean) {
  const hasAccess = await checkPermission('manage:settings')
  if (!hasAccess) return { error: 'คุณไม่มีสิทธิ์จัดการ Permission' }

  const supabase = await createClient()

  if (isGranted) {
    const { error } = await supabase
      .from('role_permissions')
      .insert([{ role_id: roleId, permission_id: permissionId }])
    
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .match({ role_id: roleId, permission_id: permissionId })
      
    if (error) return { error: error.message }
  }

  revalidatePath('/roles')
  return { success: true }
}