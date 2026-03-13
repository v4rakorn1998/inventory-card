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
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"

import { createDepartmentAction, updateDepartmentAction } from "@/services/department.action"
import { Department } from "@/types/department"
import { Employee } from "@/types/employee"

interface DepartmentDialogProps {
  departments: Department[]
  employees: Pick<Employee, "id" | "first_name" | "last_name">[]
  initialData?: Department
}

export function DepartmentDialog({ departments, employees, initialData }: DepartmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isEdit = !!initialData
  
  const [name, setName] = useState(initialData?.name || "")
  const [parentId, setParentId] = useState<string>(initialData?.parent_department_id?.toString() || "none")
  const [managerId, setManagerId] = useState<string>(initialData?.manager_id?.toString() || "none")

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setParentId(initialData.parent_department_id?.toString() || "none")
      setManagerId(initialData.manager_id?.toString() || "none")
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      name,
      parent_department_id: parentId !== "none" ? Number(parentId) : null,
      manager_id: managerId !== "none" ? Number(managerId) : null
    }

    try {
      const res = isEdit 
        ? await updateDepartmentAction(initialData!.id, payload)
        : await createDepartmentAction(payload)

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isEdit ? "อัปเดตข้อมูลสำเร็จ" : "บันทึกแผนกสำเร็จ")
        setOpen(false)
        if (!isEdit) {
           setName(""); setParentId("none"); setManagerId("none");
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดของระบบ")
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
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> เพิ่มแผนก
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? `แก้ไขแผนก: ${initialData.name}` : "เพิ่มแผนกใหม่"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่อแผนก <span className="text-red-500">*</span></Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="เช่น IT, HR" disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label>แผนกแม่ (Parent Department)</Label>
              <Select value={parentId} onValueChange={setParentId} disabled={isLoading}>
                <SelectTrigger><SelectValue placeholder="เลือกแผนกแม่" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- ไม่มี --</SelectItem>
                  {departments?.filter(d => d.id !== initialData?.id).map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>หัวหน้าแผนก (Manager)</Label>
              <Select value={managerId} onValueChange={setManagerId} disabled={isLoading}>
                <SelectTrigger><SelectValue placeholder="เลือกหัวหน้าแผนก" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- ยังไม่ระบุ --</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>{emp.first_name} {emp.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" type="button">ยกเลิก</Button></DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2" />} บันทึกข้อมูล
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}