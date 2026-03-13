'use client'

import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [inputValue, setInputValue] = useState(defaultValue)

  useEffect(() => {
    // ใช้ Debounce หน่วงเวลา 500ms ป้องกันการยิง Request รัวๆ ตอนกำลังพิมพ์
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      params.set('page', '1') // พิมพ์ค้นหาใหม่ ให้กลับไปหน้า 1 เสมอ
      
      if (inputValue) {
        params.set('q', inputValue)
      } else {
        params.delete('q')
      }
      
      // อัปเดต URL ซึ่งจะทำให้ Server Component (page.tsx) ดึงข้อมูลใหม่ทันที
      router.replace(`${pathname}?${params.toString()}`)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [inputValue, pathname, router, searchParams])

  return (
    <div className="relative w-full md:w-[400px]">
      <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground/50" />
      <Input 
        placeholder="ค้นหาจาก Box/Case, Card No. หรือ รหัสอ้างอิง..." 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="h-12 pl-12 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 focus:ring-emerald-500 font-medium" 
      />
    </div>
  )
}