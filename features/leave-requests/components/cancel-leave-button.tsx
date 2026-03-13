"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { cancelLeaveRequestAction } from "@/services/leave-request.action"
import { XCircleIcon } from "lucide-react"

export function CancelLeaveButton({ requestId, currentStatus }: { requestId: number, currentStatus: string }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const res = await cancelLeaveRequestAction(requestId, currentStatus)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(currentStatus === 'approved' ? "ส่งคำขอยกเลิกให้หัวหน้าตรวจสอบแล้ว" : "ยกเลิกใบลาสำเร็จ")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการยกเลิก")
    } finally {
      setIsLoading(false)
      setOpen(false)
    }
  }

  if (currentStatus === 'cancelled' || currentStatus === 'rejected' || currentStatus === 'pending_cancellation') {
    return null;
  }

  const isApproved = currentStatus === 'approved'

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        onClick={() => setOpen(true)}
        title={isApproved ? "ขอยกเลิกการลา" : "ยกเลิกการลา"}
      >
        <XCircleIcon className="size-4" />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={isApproved ? "ขอยกเลิกวันลา (รออนุมัติ)" : "ยืนยันการยกเลิกวันลา"}
        description={
          isApproved 
            ? "ใบลาของคุณถูกอนุมัติไปแล้ว การยกเลิกจะต้องรอให้หัวหน้างานอนุมัติการยกเลิกอีกครั้ง คุณต้องการดำเนินการต่อหรือไม่?" 
            : "คุณต้องการยกเลิกใบลานี้ใช่หรือไม่? (ใบลาที่ยังไม่อนุมัติสามารถยกเลิกได้ทันที)"
        }
        onConfirm={handleCancel}
        confirmText={isApproved ? "ส่งคำขอยกเลิก" : "ยืนยันยกเลิกทันที"}
        variant="destructive"
      />
    </>
  )
}