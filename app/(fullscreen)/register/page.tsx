"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/services/auth.action";
import { toast } from "sonner";
import { UserIcon, KeyRoundIcon, SmileIcon, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await register(username, password, displayName);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success('สมัครสมาชิกสำเร็จ! ลองเข้าสู่ระบบดูนะ');
      router.push("/login");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto pt-12">
      <form onSubmit={handleRegister}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">สมัครเป็นเศรษฐี</CardTitle>
            <CardDescription>สร้างบัญชีเพื่อเริ่มสะสมการ์ดของคุณ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อที่จะให้คนอื่นเห็น (Display Name)</Label>
              <div className="relative">
                <SmileIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="เศรษฐี พันล้าน" onChange={(e) => setDisplayName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="username" onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <KeyRoundIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" type="password" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "สมัครสมาชิก"}
            </Button>
            <p className="text-sm text-center">
              มีบัญชีอยู่แล้ว? <Link href="/login" className="text-primary underline">เข้าสู่ระบบ</Link>
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}