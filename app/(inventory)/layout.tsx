import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { Separator } from "@/components/ui/separator"
import { NotificationBell } from "@/components/notification-bell"
import { PermissionProvider } from "@/components/providers/permission-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PermissionProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 h-4"
                />
                <AppBreadcrumb />
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
              </div>
          </header>
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 p-6 md:p-8 pt-6 overflow-y-auto">
              {children}
            </div>
          </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </PermissionProvider>
    
  )
}