"use client"

import * as React from "react"
import {
  Command,
  type LucideIcon,
  NotebookTabs,
} from "lucide-react"
import { usePathname } from "next/navigation"

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
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import Link from "next/link"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
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
    avatar: "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&bold=true",
  },
  navGroups: [
    {
      title: "Inventory",
      items: [
        { 
          title: "Card Album", 
          url: "/card-album", 
          icon: NotebookTabs, 
        },
      ]
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link href="/card-album">
                <div className="bg-linear-to-br from-blue-600 to-indigo-600 text-white flex aspect-square size-9 items-center justify-center rounded-xl shadow-sm">
                  <Command className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                  <span className="truncate font-bold text-base tracking-tight">Inventory Card</span>
                  <span className="truncate text-xs text-muted-foreground font-medium">คนจะรวยช่วยไม่ได้</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {data.navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-semibold text-primary/70 uppercase tracking-wider">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname.startsWith(item.url)}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="px-2 py-4">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}