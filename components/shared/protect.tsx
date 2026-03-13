'use client'

import { usePermissions } from '@/components/providers/permission-provider'

interface ProtectProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Protect({ permission, children, fallback = null }: ProtectProps) {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) return null; // or Skeleton, or a loading spinner

  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}