"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { deleteJobLevelAction } from "@/services/job-level.action"

export function DeleteJobLevelButton({ id, name }: { id: number, name: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    setIsPending(true)
    const res = await deleteJobLevelAction(id)
    setIsPending(false)
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("ลบระดับตำแหน่งเรียบร้อยแล้ว")
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
        title="ยืนยันการลบระดับตำแหน่ง"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบระดับตำแหน่ง "${name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText={isPending ? "กำลังดำเนินการ..." : "ยืนยันการลบ"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}