"use client"

import * as React from "react"
import {
  HandCoinsIcon, // เปลี่ยนเป็นรูปเงินให้เข้าเซต
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
    name: "มหาเศรษฐี",
    email: "rich@example.com",
    avatar: "https://ui-avatars.com/api/?name=Rich&background=10b981&color=fff&bold=true",
  },
  navGroups: [
    {
      title: "Inventory",
      items: [
        { 
          title: "คลังเก็บการ์ด", 
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
    <Sidebar variant="inset" {...props} className="border-r-0">
      <SidebarHeader className="py-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent focus-visible:ring-0">
              <Link href="/card-album">
                <div className="bg-linear-to-br from-emerald-500 to-teal-700 text-white flex aspect-square size-10 items-center justify-center rounded-xl shadow-lg shadow-emerald-500/20">
                  <HandCoinsIcon className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                  <span className="truncate font-bold text-base tracking-tight text-emerald-950 dark:text-emerald-50">Inventory Card</span>
                  <span className="truncate text-xs text-emerald-600 dark:text-emerald-400 font-medium">คนจะรวยช่วยไม่ได้</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        {data.navGroups.map((group) => (
          <SidebarGroup key={group.title} className="py-2">
            <SidebarGroupLabel className="text-[10px] font-bold text-emerald-800/40 dark:text-emerald-400/40 uppercase tracking-[0.2em] px-2 mb-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        tooltip={item.title}
                        className={`
                          transition-all duration-200 h-11 px-3 rounded-lg mb-1
                          ${isActive 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold shadow-sm border border-emerald-100/50 dark:border-emerald-500/20" 
                            : "hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"}
                        `}
                      >
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon className={`size-5 ${isActive ? "text-emerald-600" : "opacity-70"}`} />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="px-3 py-6 border-t border-emerald-50 dark:border-emerald-900/20">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}