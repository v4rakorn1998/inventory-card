"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/auth.action";
import { toast } from "sonner";
import { KeyRoundIcon, UserIcon, HandCoinsIcon, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
      
      toast.success('ยินดีต้อนรับท่านมหาเศรษฐี!');
      router.push("/card-album"); 
      router.refresh();
      
    } catch (err) {
      toast.error('ระบบขัดข้องนิดหน่อย ลองใหม่อีกครั้งนะครับ');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-[1000px] overflow-hidden rounded-2xl bg-card shadow-2xl border border-border/50">
      {/* ฝั่งซ้าย: Branding & Visual - โทนเขียวเหนี่ยวทรัพย์ */}
      <div className="hidden md:flex w-1/2 flex-col justify-between bg-emerald-600 p-12 text-white relative overflow-hidden">
        {/* Background Decoration - Soft Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-inner">
            <HandCoinsIcon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Inventory Card</span>
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-extrabold leading-tight">
            Manage your collection <br /> Like a Billionaire.
          </h2>
          <p className="text-emerald-50/80 text-lg">
            ระบบจัดการคลังการ์ดที่ช่วยให้คุณติดตามมูลค่าและกำไร <br />
            ได้อย่างแม่นยำ "คนจะรวยช่วยไม่ได้"
          </p>
        </div>

        <div className="relative z-10 text-sm font-medium text-emerald-100/60">
          © 2026 Inventory Card System. All rights reserved.
        </div>
      </div>

      {/* ฝั่งขวา: Login Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 bg-card">
        <div className="mb-10 text-center md:text-left">
          <div className="md:hidden flex justify-center mb-6">
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
                <HandCoinsIcon className="h-7 w-7" />
             </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">เข้าสู่ระบบ</h1>
          <p className="text-muted-foreground">กรอกข้อมูลเพื่อเข้าถึงคลังเก็บสมบัติของคุณ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้งาน (Username)</Label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                <Input 
                  id="username" 
                  placeholder="Username ของคุณ" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">รหัสผ่าน</Label>
              </div>
              <div className="relative group">
                <KeyRoundIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all focus-visible:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <Button className="w-full h-11 text-md font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all group" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังตรวจสอบ...
              </>
            ) : (
              <span className="flex items-center justify-center gap-2">
                เข้าสู่ระบบ <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ยังไม่มีบัญชี?</span>
            </div>
          </div>

          {/* ตัวอย่างในหน้า Login: Comment ส่วนนี้ออก */}
          {/* <Link href="/register" className="block">
            <Button variant="outline" className="w-full h-11 ...">
              สมัครสมาชิกใหม่
            </Button>
          </Link> 
          */}
        </form>
      </div>
    </div>
  );
}