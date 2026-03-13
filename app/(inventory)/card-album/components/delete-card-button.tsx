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
    try {
      const res = await deleteCard(id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("ลบการ์ดออกจากคลังเรียบร้อยแล้ว")
        setOpen(false)
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบ")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <DropdownMenuItem 
        className="text-destructive focus:text-destructive cursor-pointer rounded-xl h-10 font-bold focus:bg-destructive/10"
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        <Trash2Icon className="mr-3 h-4 w-4" /> Delete Card
      </DropdownMenuItem>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Confirm Deletion"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบการ์ดรหัส "${cardCode}"? ข้อมูลนี้จะหายไปจากคลังสมบัติของคุณทันที`}
        confirmText={isPending ? "Deleting..." : "Confirm Delete"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}