"use client"

import { useEffect, useState } from "react"
import { BellIcon, CheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getMyNotifications, markAsReadAction, markAllAsReadAction } from "@/services/notification.action"
import { getCurrentEmployee } from "@/services/leave-request.action"
import { createClient } from "@/lib/supabase/client"

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotifications = async () => {
    const data = await getMyNotifications()
    setNotifications(data)
  }

  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      await fetchNotifications()

      const employee = await getCurrentEmployee()
      if (!employee) return

      const supabase = createClient()
      
      channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `employee_id=eq.${employee.id}`,
          },
          (payload) => {
            const newNotification = payload.new
            setNotifications((prev) => [newNotification, ...prev])
            
            toast.info(newNotification.title, {
              description: newNotification.message,
              action: {
                label: "ดูรายละเอียด",
                onClick: () => {
                  if (newNotification.link) router.push(newNotification.link)
                }
              }
            })
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [router])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleNotificationClick = async (noti: any) => {
    if (!noti.is_read) {
      await markAsReadAction(noti.id)
      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n))
    }
    setIsOpen(false)
    if (noti.link) {
      router.push(noti.link)
    }
  }

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await markAllAsReadAction()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute:'2-digit', day: 'numeric', month: 'short' }).format(date)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2 border-b sticky top-0 bg-popover z-10">
          <span className="font-semibold text-sm">การแจ้งเตือน</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="xs" onClick={handleMarkAllRead} className="h-auto p-0 text-xs text-primary">
              <CheckIcon className="h-3 w-3 mr-1" />
              อ่านทั้งหมด
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            ไม่มีการแจ้งเตือนใหม่
          </div>
        ) : (
          notifications.map((noti) => (
            <DropdownMenuItem 
              key={noti.id} 
              className={`flex flex-col items-start p-4 cursor-pointer gap-1 border-b last:border-b-0 ${noti.is_read ? 'opacity-60' : 'bg-primary/5'}`}
              onClick={() => handleNotificationClick(noti)}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-sm ${noti.is_read ? 'font-medium' : 'font-bold text-primary'}`}>
                  {noti.title}
                </span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(noti.created_at)}</span>
              </div>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {noti.message}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}