"use client"

import { useState, useEffect } from "react"
import { PlusIcon, CalendarIcon, InfoIcon, AlertCircleIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogClose, DialogDescription
} from "@/components/ui/dialog"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { submitLeaveRequest } from "@/services/leave-request.action"
import { LeaveType } from "@/types/leave-type"
import { cn } from "@/lib/utils"

interface Quota {
  id: number;
  name: string;
  total_quota: number;
  used_days: number;
  remaining_days: number;
}

interface LeaveRequestDialogProps {
  leaveTypes: LeaveType[];
  quotas: Quota[];
}

export function LeaveRequestDialog({ leaveTypes, quotas }: LeaveRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [leaveTypeId, setLeaveTypeId] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [totalDays, setTotalDays] = useState("")
  const [reason, setReason] = useState("")

  const selectedQuota = quotas?.find(q => q.id.toString() === leaveTypeId)

  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate)
      const e = new Date(endDate)
      
      s.setHours(0, 0, 0, 0)
      e.setHours(0, 0, 0, 0)

      if (e >= s) {
        const diffTime = Math.abs(e.getTime() - s.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        setTotalDays(diffDays.toString())
      } else {
        setTotalDays("0")
      }
    } else {
      setTotalDays("")
    }
  }, [startDate, endDate])

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    
    if (!leaveTypeId) {
      toast.error("กรุณาเลือกประเภทการลา")
      return
    }

    if (!startDate || !endDate) {
      toast.error("กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด")
      return
    }

    const days = Number(totalDays);
    if (days <= 0) {
        toast.error("จำนวนวันลาต้องมากกว่า 0")
        return
    }

    // ตรวจสอบว่าวันลาที่ขอ เกินโควตาที่เหลือหรือไม่
    if (selectedQuota && selectedQuota.total_quota > 0 && selectedQuota.remaining_days < days) {
        toast.error(`โควตาวันลาไม่เพียงพอ (คุณเหลือโควตา ${selectedQuota.remaining_days} วัน)`);
        return;
    }

    setIsLoading(true)

    try {
      const res = await submitLeaveRequest({
        leave_type_id: Number(leaveTypeId),
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        total_days: days,
        reason: reason
      })

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("ยื่นใบลาสำเร็จ รอการอนุมัติจากหัวหน้า")
        setOpen(false)
        // Reset form
        setLeaveTypeId("")
        setStartDate(undefined)
        setEndDate(undefined)
        setTotalDays("")
        setReason("")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาดของระบบ")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm"><PlusIcon className="mr-2 h-4 w-4" /> ยื่นใบลา</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-4 bg-muted/30 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="bg-primary/10 p-2 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              ยื่นคำขอลาหยุด
            </DialogTitle>
            <DialogDescription className="pt-2">
              กรอกรายละเอียดการลาของคุณ ระบบจะส่งคำขอไปยังหัวหน้างานเพื่อพิจารณา
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 px-6 py-6">
            <div className="grid gap-2">
              <Label className="text-foreground/80">ประเภทการลา <span className="text-destructive">*</span></Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId} disabled={isLoading} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="เลือกประเภทการลา" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} {type.is_paid ? "(แบบได้เงินเดือน)" : "(แบบไม่ได้เงินเดือน)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedQuota && (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border text-sm transition-colors",
                selectedQuota.remaining_days <= 0 && selectedQuota.total_quota > 0 ? "bg-destructive/5 border-destructive/20 text-destructive" :
                selectedQuota.remaining_days <= 2 && selectedQuota.total_quota > 0 ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/50 dark:border-orange-900" :
                "bg-muted/50 border-border"
              )}>
                <div className="flex items-center gap-2">
                  {selectedQuota.remaining_days <= 0 && selectedQuota.total_quota > 0 ? (
                    <AlertCircleIcon className="h-4 w-4" />
                  ) : (
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">โควตาคงเหลือ:</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold leading-none">{selectedQuota.remaining_days}</span>
                  <span className="text-xs">/ {selectedQuota.total_quota} วัน</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-foreground/80">วันที่เริ่มต้น <span className="text-destructive">*</span></Label>
                <DatePicker 
                  value={startDate} 
                  onChange={setStartDate} 
                  disabled={isLoading} 
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground/80">วันที่สิ้นสุด <span className="text-destructive">*</span></Label>
                <DatePicker 
                  value={endDate} 
                  onChange={setEndDate} 
                  disabled={isLoading} 
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-end">
                <Label htmlFor="totalDays" className="text-foreground/80">จำนวนวันลา <span className="text-destructive">*</span></Label>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">สามารถระบุทศนิยมได้ (เช่น 0.5)</span>
              </div>
              <Input 
                id="totalDays" 
                type="number" 
                step="0.5" 
                min="0.5"
                value={totalDays} 
                onChange={(e) => setTotalDays(e.target.value)} 
                required 
                className="h-10 font-medium"
                placeholder="เช่น 1, 1.5, 2"
                disabled={isLoading} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason" className="text-foreground/80">เหตุผลการลา</Label>
              <Textarea 
                id="reason" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                className="resize-none h-20"
                placeholder="ระบุเหตุผลการลา" 
                disabled={isLoading} 
              />
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t">
            <DialogClose asChild>
              <Button variant="ghost" type="button" disabled={isLoading}>ยกเลิก</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || (selectedQuota ? selectedQuota.remaining_days <= 0 && selectedQuota.total_quota > 0 : false)} className="px-6">
              {isLoading && <Spinner className="mr-2 h-4 w-4" />} ยืนยันการยื่นใบลา
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}