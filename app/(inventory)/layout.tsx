import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      {/* ปรับพื้นหลังหลักให้เป็นสี Slate อ่อนๆ และใช้ความกว้างเต็มพื้นที่ */}
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-foreground">
        <AppSidebar />
        <SidebarInset className="bg-transparent overflow-hidden">
          {/* Header แบบ Glassmorphism ที่กว้างเต็มขอบ */}
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-6 border-b border-emerald-100/50 dark:border-emerald-900/20 bg-background/60 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 text-emerald-600 hover:bg-emerald-50 transition-colors" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4 bg-emerald-200/50"
              />
              <AppBreadcrumb />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Wealth Mode On
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col relative h-[calc(100vh-64px)]">
            {/* เพิ่มรัศมีสีเขียวจางๆ (Soft Glow) ที่พื้นหลัง */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/20 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
            
            {/* จุดที่แก้ไข: 
                - นำ max-w-7xl ออกเพื่อให้กว้างเต็มที่ 
                - เพิ่ม w-full เพื่อยืดเนื้อหาให้เต็มจอ
            */}
            <div className="flex-1 p-4 md:p-8 pt-6 overflow-y-auto relative z-10 w-full">
              <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}