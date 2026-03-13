// app/(inventory)/card-album/components/delete-card-button.tsx
"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { deleteCard } from "@/services/card.action"

export function DeleteCardButton({ id, cardCode }: { id: number, cardCode: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    setIsPending(true)
    const res = await deleteCard(id)
    setIsPending(false)
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("ลบการ์ดออกจากคลังเรียบร้อยแล้ว")
      setOpen(false)
    }
  }

  return (
    <>
      <DropdownMenuItem 
        className="text-destructive focus:text-destructive cursor-pointer"
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        <Trash2Icon className="mr-2 h-4 w-4" /> ลบการ์ด
      </DropdownMenuItem>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="ยืนยันการลบการ์ด"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบการ์ดรหัส "${cardCode}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText={isPending ? "กำลังดำเนินการ..." : "ยืนยันการลบ"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}