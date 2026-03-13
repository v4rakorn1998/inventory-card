import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | Inventory Card",
  description: "ระบบจัดการคลังการ์ดสำหรับนักสะสม",
};

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* พื้นหลังแบบ Soft Gradient เพื่อความทันสมัย */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-blue-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-indigo-200/20 rounded-full blur-[120px]" />
      </div>

      <main className="w-full flex justify-center items-center animate-in fade-in zoom-in duration-500">
        {children}
      </main>
    </div>
  );
}