'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getMyPermissions } from '@/services/permission.action'

interface PermissionContextType {
  permissions: string[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  isLoading: true,
  hasPermission: () => false,
})

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const perms = await getMyPermissions()
        setPermissions(perms || [])
      } catch (error) {
        console.error("Failed to load permissions", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPermissions()
  }, [])

  const hasPermission = (permission: string) => permissions.includes(permission)

  return (
    <PermissionContext.Provider value={{ permissions, isLoading, hasPermission }}>
      {children}
    </PermissionContext.Provider>
  )
}

export const usePermissions = () => useContext(PermissionContext)