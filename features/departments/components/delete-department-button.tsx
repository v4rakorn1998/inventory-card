"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { deleteDepartmentAction } from "@/services/department.action"

export function DeleteDepartmentButton({ id, name }: { id: number, name: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    setIsPending(true)
    const res = await deleteDepartmentAction(id)
    setIsPending(false)
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("ลบข้อมูลเรียบร้อยแล้ว")
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
        <Trash2Icon className="mr-2 h-4 w-4" /> ลบแผนก
      </DropdownMenuItem>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="ยืนยันการลบแผนก"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบแผนก "${name}"? ข้อมูลจะถูกซ่อนจากระบบแต่ยังคงอยู่ในฐานข้อมูลเพื่อการตรวจสอบย้อนหลัง`}
        confirmText={isPending ? "กำลังดำเนินการ..." : "ยืนยันการลบ"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}