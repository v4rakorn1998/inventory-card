"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { deleteLeaveTypeAction } from "@/services/leave-type.action"

export function DeleteLeaveTypeButton({ id, name }: { id: number, name: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    setIsPending(true)
    const res = await deleteLeaveTypeAction(id)
    setIsPending(false)
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("ลบประเภทการลาเรียบร้อยแล้ว")
      setOpen(false)
    }
  }

  return (
    <>
      <DropdownMenuItem 
        className="text-destructive focus:text-destructive"
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        <Trash2Icon className="mr-2 h-4 w-4" /> ลบข้อมูล
      </DropdownMenuItem>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="ยืนยันการลบประเภทวันลา"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทวันลา "${name}"? ข้อมูลจะถูกซ่อนไว้แต่ประวัติการลาของพนักงานจะไม่สูญหาย`}
        confirmText={isPending ? "กำลังดำเนินการ..." : "ยืนยันการลบ"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}