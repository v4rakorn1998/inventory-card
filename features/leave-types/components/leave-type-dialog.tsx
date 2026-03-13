"use client"

import { useState, useEffect } from "react"
import { PlusIcon, Edit2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogClose 
} from "@/components/ui/dialog"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { createLeaveTypeAction, updateLeaveTypeAction } from "@/services/leave-type.action"
import { LeaveType } from "@/types/leave-type"

interface LeaveTypeDialogProps {
  initialData?: LeaveType;
}

export function LeaveTypeDialog({ initialData }: LeaveTypeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [defaultQuota, setDefaultQuota] = useState(initialData?.default_quota?.toString() || "")
  const [isPaid, setIsPaid] = useState(initialData?.is_paid !== false ? "true" : "false")
  const [isActive, setIsActive] = useState(initialData?.is_active !== false ? "true" : "false")

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setDescription(initialData.description || "")
      setDefaultQuota(initialData.default_quota.toString())
      setIsPaid(initialData.is_paid ? "true" : "false")
      setIsActive(initialData.is_active ? "true" : "false")
    }
  }, [initialData])

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      name,
      description,
      default_quota: Number(defaultQuota),
      is_paid: isPaid === "true",
      is_active: isActive === "true"
    }

    try {
      const res = isEdit 
        ? await updateLeaveTypeAction(initialData!.id, payload)
        : await createLeaveTypeAction(payload)

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isEdit ? "อัปเดตข้อมูลสำเร็จ" : "บันทึกประเภทวันลาสำเร็จ")
        setOpen(false)
        if (!isEdit) {
          setName("")
          setDescription("")
          setDefaultQuota("")
          setIsPaid("true")
          setIsActive("true")
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดของระบบ";
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="w-full justify-start px-2 py-1.5 h-auto font-normal">
            <Edit2Icon className="mr-2 h-4 w-4" /> แก้ไข
          </Button>
        ) : (
          <Button><PlusIcon className="mr-2 h-4 w-4" /> เพิ่มประเภทวันลา</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? `แก้ไขประเภทการลา: ${initialData.name}` : "เพิ่มประเภทวันลา"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่อประเภทการลา <span className="text-red-500">*</span></Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="เช่น ลาป่วย, ลากิจ" disabled={isLoading} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="เงื่อนไข หรือรายละเอียดเพิ่มเติม" 
                disabled={isLoading} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="defaultQuota">โควตาตั้งต้น (วัน/ปี) <span className="text-red-500">*</span></Label>
                <Input id="defaultQuota" type="number" min="0" value={defaultQuota} onChange={(e) => setDefaultQuota(e.target.value)} required placeholder="เช่น 30" disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label>การจ่ายเงินเดือน</Label>
                <Select value={isPaid} onValueChange={setIsPaid} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกรูปแบบ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">จ่าย (Paid)</SelectItem>
                    <SelectItem value="false">ไม่จ่าย (Unpaid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isEdit && (
              <div className="grid gap-2">
                <Label>สถานะการใช้งาน</Label>
                <Select value={isActive} onValueChange={setIsActive} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">เปิดใช้งาน</SelectItem>
                    <SelectItem value="false">ปิดใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isLoading}>ยกเลิก</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2" />} บันทึกข้อมูล
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}