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

import { createEmployeeAction, updateEmployeeAction } from "@/services/employee.action"
import { Department } from "@/types/department"
import { JobLevel } from "@/types/job-level"
import { Employee } from "@/types/employee"

export function EmployeeDialog({ 
  departments, 
  jobLevels,
  initialData
}: { 
  departments: Department[], 
  jobLevels: JobLevel[],
  initialData?: Employee
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const isEdit = !!initialData

  const [email, setEmail] = useState(initialData?.email || "")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState(initialData?.first_name || "")
  const [lastName, setLastName] = useState(initialData?.last_name || "")
  const [departmentId, setDepartmentId] = useState<string>(initialData?.department_id?.toString() || "none")
  const [jobLevelId, setJobLevelId] = useState<string>(initialData?.job_level_id?.toString() || "none")

  useEffect(() => {
    if (initialData) {
      setEmail(initialData.email)
      setFirstName(initialData.first_name)
      setLastName(initialData.last_name)
      setDepartmentId(initialData.department_id?.toString() || "none")
      setJobLevelId(initialData.job_level_id?.toString() || "none")
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isEdit && password.length < 6) {
      toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
      return;
    }

    setIsLoading(true)

    try {
      if (isEdit) {
        const res = await updateEmployeeAction(initialData.id, {
          first_name: firstName,
          last_name: lastName,
          department_id: departmentId !== "none" ? Number(departmentId) : null,
          job_level_id: jobLevelId !== "none" ? Number(jobLevelId) : null,
        })
        if (res?.error) throw new Error(res.error)
        toast.success("อัปเดตข้อมูลพนักงานสำเร็จ")
      } else {
        const res = await createEmployeeAction({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          department_id: departmentId !== "none" ? Number(departmentId) : null,
          job_level_id: jobLevelId !== "none" ? Number(jobLevelId) : null,
        })
        if (res?.error) throw new Error(res.error)
        toast.success("สร้างบัญชีและเพิ่มพนักงานสำเร็จ")
      }
      
      setOpen(false)
      if (!isEdit) {
        setEmail(""); setPassword(""); setFirstName(""); setLastName("");
        setDepartmentId("none"); setJobLevelId("none");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาดของระบบ")
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
            <PlusIcon className="mr-2 h-4 w-4" /> เพิ่มพนักงาน
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? `แก้ไขข้อมูล: ${initialData.first_name}` : "เพิ่มพนักงานและสร้างบัญชีใหม่"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">ชื่อ <span className="text-red-500">*</span></Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">นามสกุล <span className="text-red-500">*</span></Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">อีเมลเข้าสู่ระบบ {!isEdit && <span className="text-red-500">*</span>}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={!isEdit} disabled={isLoading || isEdit} className={isEdit ? "bg-muted" : ""} />
            </div>

            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="password">รหัสผ่านเริ่มต้น <span className="text-red-500">*</span></Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} placeholder="อย่างน้อย 6 ตัวอักษร" />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label>แผนก (Department)</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- ไม่ระบุ --</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>ระดับตำแหน่ง (Job Level)</Label>
              <Select value={jobLevelId} onValueChange={setJobLevelId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกระดับตำแหน่ง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- ไม่ระบุ --</SelectItem>
                  {jobLevels?.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>{level.level_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isLoading}>ยกเลิก</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null} บันทึกข้อมูล
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}