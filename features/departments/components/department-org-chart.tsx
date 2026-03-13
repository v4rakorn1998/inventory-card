"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { OrgChart } from "d3-org-chart";
import { Department } from "@/types/department";

type ChartNode = { data: any };
type MinimalOrgChart = {
  container: (el: HTMLDivElement) => MinimalOrgChart;
  data: (data: any[]) => MinimalOrgChart;
  nodeHeight: (fn: (d: ChartNode) => number) => MinimalOrgChart;
  nodeWidth: (fn: (d: ChartNode) => number) => MinimalOrgChart;
  childrenMargin: (fn: (d: ChartNode) => number) => MinimalOrgChart;
  compact: (v: boolean) => MinimalOrgChart;
  nodeContent: (fn: (d: ChartNode) => string) => MinimalOrgChart;
  render: () => MinimalOrgChart;
};

export function DepartmentOrgChart({
  departments,
}: {
  departments: Department[];
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<MinimalOrgChart | null>(null);
  const router = useRouter();

  const chartData = useMemo(() => {
    const activeDepts = departments.filter(
      (d) => (d as any).is_active !== false,
    );

    const formattedData = activeDepts.map((dept) => ({
      ...dept,
      id: String(dept.id),
      parentId: dept.parent_department_id
        ? String(dept.parent_department_id)
        : "org-root",
    }));

    formattedData.push({
      id: "org-root",
      parentId: "",
      name: "I Progress X",
      manager: null,
      isVirtualRoot: true,
    } as any);

    return formattedData;
  }, [departments]);

  useEffect(() => {
    if (chartRef.current && chartData.length > 0) {
      chartInstance.current ??= new OrgChart() as unknown as MinimalOrgChart;

      chartInstance.current
        .container(chartRef.current)
        .data(chartData)
        .nodeHeight(() => 110)
        .nodeWidth(() => 240)
        .childrenMargin(() => 40)
        .compact(false)
        .nodeContent((d: ChartNode) => {
          const dept = d.data;

          if (dept.isVirtualRoot) {
            return `
              <div class="font-sans w-60 h-25 flex items-center justify-center bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-xl shadow-lg border border-blue-400/30">
                🏢 ${dept.name}
              </div>
            `;
          }

          const managerName = dept.manager
            ? `${dept.manager.first_name} ${dept.manager.last_name}`
            : "<span class='italic opacity-50'>ยังไม่ระบุหัวหน้า</span>";

          return `
            <div 
              data-dept-id="${dept.id}"
              class="font-sans w-60 h-28 bg-card text-card-foreground border-2 border-blue-100 dark:border-blue-900/50 rounded-xl p-3 shadow-sm cursor-pointer flex flex-col justify-between transition-all duration-300 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 box-border relative overflow-hidden group"
              onclick="window.dispatchEvent(new CustomEvent('orgchart-node-click', { detail: '${dept.id}' }))"
            >
              
              <div class="font-bold text-[15px] text-blue-700 dark:text-blue-400 whitespace-nowrap overflow-hidden text-ellipsis mt-1 px-1">
                ${dept.name}
              </div>
              
              <div class="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border border-border/50">
                <div class="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border shrink-0 text-primary shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-[9px] tracking-wider uppercase text-muted-foreground font-bold leading-none mb-1">Manager</span>
                  <span class="text-[13px] font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis leading-none" title="${managerName.replace(/<[^>]*>?/gm, "")}">
                    ${managerName}
                  </span>
                </div>
              </div>
            </div>
          `;
        })
        .render();
    }
  }, [chartData, router]);

  if (departments.length === 0) {
    return (
      <div className="flex h-160 flex-col items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground bg-muted/5">
        <p>ไม่พบข้อมูลโครงสร้างองค์กร</p>
      </div>
    );
  }

  return (
    <div className="relative h-160 w-full rounded-xl border bg-slate-50/50 dark:bg-muted/10 overflow-hidden shadow-inner font-sans">
      <style jsx global>{`
        /* ปรับสไตล์ของเส้นเชื่อมสายบังคับบัญชา */
        .svg-chart-container path.link {
          stroke: #93c5fd !important; /* blue-300 */
          stroke-width: 2px !important;
          stroke-opacity: 0.8 !important;
        }
        .dark .svg-chart-container path.link {
          stroke: #1e3a8a !important; /* blue-900 */
        }
      `}</style>

      <div ref={chartRef} className="h-full w-full" />
    </div>
  );
}
