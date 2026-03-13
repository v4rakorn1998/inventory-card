"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/auth.action"; // ตรวจสอบ path นี้ให้ถูกต้อง
import { toast } from "sonner";
import { KeyRoundIcon, UserIcon, CommandIcon, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(""); // เปลี่ยนจาก email เป็น username ตามตาราง DB
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // เรียกใช้ Server Action
      const result = await login(username, password);
      
      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
      
      toast.success('ยินดีต้อนรับท่านมหาเศรษฐี!');
      router.push("/card-album"); 
      router.refresh(); // บังคับให้ Middleware เช็คค่า cookie ใหม่ทันที
      
    } catch (err) {
      toast.error('ระบบขัดข้องนิดหน่อย ลองใหม่อีกครั้งนะครับ');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pt-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <CommandIcon className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Inventory Card</h1>
        <p className="text-sm text-muted-foreground">คนจะรวยช่วยไม่ได้</p>
      </div>

      <form onSubmit={handleLogin}>
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-semibold">ยินดีต้อนรับเศรษฐีหน้าใหม่</CardTitle>
            <CardDescription className="text-sm">
              กรุณากรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้งาน (Username)</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Username ของคุณ" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">รหัสผ่าน</Label>
              </div>
              <div className="relative">
                <KeyRoundIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button className="w-full text-md h-10" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังตรวจสอบ...
                </>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}