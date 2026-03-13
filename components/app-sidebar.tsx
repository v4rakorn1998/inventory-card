"use client"

import * as React from "react"
import {
  Command,
  type LucideIcon,
  NotebookTabs,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSkeleton
} from "@/components/ui/sidebar"
import { usePermissions } from "@/components/providers/permission-provider"
import Link from "next/link"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  permission?: string
  items?: {
    title: string
    url: string
  }[]
}

type NavGroup = {
  title: string;
  items: NavItem[];
}

const data: {
  user: {
    id: string
    name: string
    email: string
    avatar: string
  }
  navGroups: NavGroup[]
} = {
  user: {
    id: "user-1",
    name: "User",
    email: "user@example.com",
    // ✅ แก้ไขลิงก์รูปโปรไฟล์ตรงนี้ เพื่อไม่ให้ติด Error 404
    avatar: "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&bold=true",
  },
  navGroups: [
    {
      title: "Inventory",
      items: [
        { title: "Card Album", url: "/card-album", icon: NotebookTabs, isActive: true ,permission: "view:employees"},
      ]
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { hasPermission, isLoading } = usePermissions()

  const allowedGroups = data.navGroups.map(group => {
    const filteredItems = group.items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    }).map((item) => {
      const isChildActive = item.items?.some((subItem) => 
        subItem.url !== "#" && pathname.startsWith(subItem.url)
      )
      return { ...item, isActive: isChildActive || pathname.startsWith(item.url) }
    });

    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link href="/dashboard">
                <div className="bg-linear-to-br from-blue-600 to-indigo-600 text-white flex aspect-square size-9 items-center justify-center rounded-xl shadow-sm">
                  <Command className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                  <span className="truncate font-bold text-base tracking-tight">HRX</span>
                  <span className="truncate text-xs text-muted-foreground font-medium">I Progress X</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {isLoading ? (
          <SidebarGroup>
            <SidebarMenu>
              {Array.from({ length: 5 }).map((_, index) => (
                <SidebarMenuItem key={index} className="py-1">
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          allowedGroups.map((group, index) => (
            <NavMain key={index} title={group.title} items={group.items} />
          ))
        )}
      </SidebarContent>
      
      <SidebarFooter className="px-2 py-4">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}