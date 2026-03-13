// features/roles/components/permission-matrix.tsx
'use client'

import { useState } from "react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toggleRolePermissionAction } from "@/services/role.action"

interface PermissionMatrixProps {
  roles: any[]
  permissions: any[]
  rolePermissions: any[]
}

export function PermissionMatrix({ roles, permissions, rolePermissions }: PermissionMatrixProps) {
  const [activePermissions, setActivePermissions] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    rolePermissions.forEach(rp => {
      initialState[`${rp.role_id}-${rp.permission_id}`] = true
    })
    return initialState
  })

  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({})

  const handleToggle = async (roleId: number, permissionId: number, currentStatus: boolean) => {
    const key = `${roleId}-${permissionId}`
    const newStatus = !currentStatus

    setLoadingKeys(prev => ({ ...prev, [key]: true }))
    
    setActivePermissions(prev => ({ ...prev, [key]: newStatus }))

    try {
      const res = await toggleRolePermissionAction(roleId, permissionId, newStatus)
      if (res?.error) {
        setActivePermissions(prev => ({ ...prev, [key]: currentStatus }))
        toast.error(res.error)
      } else {
        toast.success(newStatus ? 'เพิ่มสิทธิ์สำเร็จ' : 'เพิกถอนสิทธิ์สำเร็จ')
      }
    } catch (error) {
      setActivePermissions(prev => ({ ...prev, [key]: currentStatus }))
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoadingKeys(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">การอนุญาต (Permissions)</TableHead>
            {roles.map(role => (
              <TableHead key={role.id} className="text-center min-w-[120px]">
                <div className="font-semibold text-foreground">{role.name}</div>
                <div className="text-xs text-muted-foreground font-normal mt-1">{role.description}</div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map(permission => (
            <TableRow key={permission.id}>
              <TableCell>
                <div className="font-medium">{permission.action}</div>
                <div className="text-xs text-muted-foreground mt-1">{permission.description}</div>
              </TableCell>
              
              {roles.map(role => {
                const key = `${role.id}-${permission.id}`
                const isGranted = !!activePermissions[key]
                const isLoading = !!loadingKeys[key]
                
                const isAdmin = role.name === 'Admin'

                return (
                  <TableCell key={key} className="text-center">
                    <Switch
                      checked={isAdmin ? true : isGranted}
                      disabled={isAdmin || isLoading}
                      onCheckedChange={() => handleToggle(role.id, permission.id, isGranted)}
                      className={isAdmin ? 'opacity-50' : ''}
                    />
                    {isAdmin && <Badge variant="secondary" className="block w-fit mx-auto mt-2 text-[10px]">ถาวร</Badge>}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
          {permissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={roles.length + 1} className="h-24 text-center">ไม่มีข้อมูล Permission</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}