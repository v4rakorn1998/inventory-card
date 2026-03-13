"use client"

import { useState, useEffect } from "react"
import { PlusIcon, Edit2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogClose 
} from "@/components/ui/dialog"
import { createJobLevelAction, updateJobLevelAction } from "@/services/job-level.action"
import { JobLevel } from "@/types/job-level"

interface JobLevelDialogProps {
  initialData?: JobLevel;
}

export function JobLevelDialog({ initialData }: JobLevelDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const isEdit = !!initialData

  const [levelName, setLevelName] = useState(initialData?.level_name || "")
  const [levelTier, setLevelTier] = useState(initialData?.level_tier?.toString() || "")
  const [leaveQuota, setLeaveQuota] = useState(initialData?.annual_leave_quota?.toString() || "")

  useEffect(() => {
    if (initialData) {
      setLevelName(initialData.level_name)
      setLevelTier(initialData.level_tier.toString())
      setLeaveQuota(initialData.annual_leave_quota.toString())
    }
  }, [initialData])

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      level_name: levelName,
      level_tier: Number(levelTier),
      annual_leave_quota: Number(leaveQuota)
    }

    try {
      const res = isEdit 
        ? await updateJobLevelAction(initialData!.id, payload)
        : await createJobLevelAction(payload)

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isEdit ? "อัปเดตข้อมูลสำเร็จ" : "บันทึกระดับตำแหน่งสำเร็จ")
        setOpen(false)
        if (!isEdit) {
          setLevelName("")
          setLevelTier("")
          setLeaveQuota("")
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
          <Button><PlusIcon className="mr-2 h-4 w-4" /> เพิ่มระดับตำแหน่ง</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? `แก้ไขระดับตำแหน่ง: ${initialData.level_name}` : "เพิ่มระดับตำแหน่งใหม่"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="levelName">ชื่อระดับตำแหน่ง <span className="text-red-500">*</span></Label>
              <Input id="levelName" value={levelName} onChange={(e) => setLevelName(e.target.value)} required placeholder="เช่น Junior, Manager, CEO" disabled={isLoading} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="levelTier">ลำดับขั้น (Tier) <span className="text-red-500">*</span></Label>
                <Input id="levelTier" type="number" value={levelTier} onChange={(e) => setLevelTier(e.target.value)} required placeholder="เช่น 1, 2, 10" disabled={isLoading} />
                <span className="text-xs text-muted-foreground">ยิ่งเยอะยิ่งตำแหน่งสูง</span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leaveQuota">วันลาพักร้อน (วัน) <span className="text-red-500">*</span></Label>
                <Input id="leaveQuota" type="number" value={leaveQuota} onChange={(e) => setLeaveQuota(e.target.value)} required placeholder="เช่น 10, 15" disabled={isLoading} />
              </div>
            </div>
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