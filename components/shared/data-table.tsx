// components/shared/data-table.tsx
import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface DataTableProps {
  headers: string[]
  children: React.ReactNode
  isEmpty: boolean
  emptyMessage?: string
  currentPage?: number
  totalPages?: number
  basePath?: string
}

export function DataTable({
  headers,
  children,
  isEmpty,
  emptyMessage = "ไม่มีข้อมูล",
  currentPage = 1,
  totalPages = 1,
  basePath = "?",
}: DataTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className={`h-12 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap ${
                      header === "Actions" || header === "จัดการ" ? "text-right" : ""
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isEmpty ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="p-4 text-center text-muted-foreground h-24 align-middle"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                children
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination (จะแสดงก็ต่อเมื่อมีมากกว่า 1 หน้า) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            หน้า <span className="font-medium text-foreground">{currentPage}</span> จาก{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
            >
              {currentPage > 1 ? (
                <Link href={`${basePath}page=${currentPage - 1}`}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> ก่อนหน้า
                </Link>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-1" /> ก่อนหน้า
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
            >
              {currentPage < totalPages ? (
                <Link href={`${basePath}page=${currentPage + 1}`}>
                  ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <>
                  ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}