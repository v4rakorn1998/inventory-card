"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  CheckSquare,
  ShieldAlert,
  Settings2,
  SquareTerminal,
  NotebookTabs,
  HomeIcon,
  FolderIcon,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeMapping: Record<string, { label: string; parent?: string; icon?: React.ElementType }> = {
  "/card-album": { label: "", parent: "Card Album", icon: NotebookTabs },
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  
  let currentPathConfig = routeMapping[pathname]
  
  if (!currentPathConfig) {
     const mainPath = Object.keys(routeMapping).find(k => k !== "/" && pathname.startsWith(k))
     if (mainPath) {
        currentPathConfig = routeMapping[mainPath]
     }
  }

  if (!currentPathConfig) {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                            <HomeIcon className="h-4 w-4" />
                            <span>หน้าหลัก</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )
  }

  const Icon = currentPathConfig.icon

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <HomeIcon className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {currentPathConfig.parent && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <span className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                <FolderIcon className="h-3.5 w-3.5" />
                {currentPathConfig.parent}
              </span>
            </BreadcrumbItem>
          </>
        )}
        
        <BreadcrumbSeparator className="hidden md:block" />

        <BreadcrumbItem>
          <BreadcrumbPage className="flex items-center gap-1.5 font-semibold text-foreground">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            {currentPathConfig.label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}