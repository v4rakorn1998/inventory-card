"use client"

import { useState } from "react"
import { CheckIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { updateLeaveStatusAction } from "@/services/leave-request.action"

export function LeaveApprovalActions({ requestId }: { requestId: number }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsLoading(true)
    try {
      const res = await updateLeaveStatusAction(requestId, action)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("ทำรายการสำเร็จ")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการทำรายการ")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
        onClick={() => handleAction('approve')}
        disabled={isLoading}
      >
        {isLoading ? <Spinner className="mr-2" /> : <CheckIcon className="w-4 h-4 mr-1" />}
        อนุมัติ
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        onClick={() => handleAction('reject')}
        disabled={isLoading}
      >
        {isLoading ? <Spinner className="mr-2" /> : <XIcon className="w-4 h-4 mr-1" />}
        ปฏิเสธ
      </Button>
    </div>
  )
}