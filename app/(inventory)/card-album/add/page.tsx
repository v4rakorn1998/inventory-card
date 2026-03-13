"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addCard } from "@/services/card.action";
import { ArrowLeftIcon, Loader2, UploadCloudIcon, ImageIcon } from "lucide-react";

export default function AddCardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ฟังก์ชันพรีวิวรูปภาพเมื่อเลือกไฟล์
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await addCard(formData);
      
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success("เพิ่มการ์ดใหม่เข้าคลังเรียบร้อยแล้ว!");
      router.push("/card-album");
      router.refresh(); // บังคับให้โหลดข้อมูลใหม่
      
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl pt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/card-album">
          <Button variant="outline" size="icon" className="h-10 w-10">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">เพิ่มการ์ดใหม่</h1>
          <p className="text-muted-foreground">บันทึกข้อมูลการ์ดใบใหม่เข้าสู่คลังของคุณ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>รายละเอียดการ์ด</CardTitle>
            <CardDescription>รหัสการ์ด (Card Code) จะถูกสร้างให้อัตโนมัติเมื่อบันทึก</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* ส่วนอัปโหลดรูปภาพ */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-dashed">
              <Label className="text-base font-semibold">รูปภาพการ์ด</Label>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-40 h-56 border-2 border-dashed rounded-lg flex items-center justify-center bg-background overflow-hidden relative shrink-0 shadow-sm">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-xs">ไม่มีรูปภาพ</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2 w-full pt-2">
                  <Input 
                    id="image" 
                    name="image" 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* ข้อมูลทั่วไป */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="box_case">Case / Box</Label>
                <Input id="box_case" name="box_case" placeholder="เช่น Case #12, Box A" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card_no">No. (ลำดับของการ์ด)</Label>
                <Input id="card_no" name="card_no" placeholder="เช่น 001/150, #025" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card_type">ประเภทการ์ด</Label>
              <Input id="card_type" name="card_type" placeholder="เช่น SR, UR, Secret Rare" />
            </div>

            {/* ข้อมูลราคา (รวมค่าขนส่งแล้ว) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/10 p-4 rounded-lg border">
              <div className="space-y-2">
                <Label htmlFor="buy_price" className="text-red-600 font-medium">ราคาซื้อ (บาท) *</Label>
                <Input id="buy_price" name="buy_price" type="number" min="0" required placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping_cost" className="text-orange-500 font-medium">ค่าขนส่ง (บาท)</Label>
                <Input id="shipping_cost" name="shipping_cost" type="number" min="0" placeholder="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell_price" className="text-green-600 font-medium">ราคาขาย (บาท)</Label>
                <Input id="sell_price" name="sell_price" type="number" min="0" placeholder="เว้นว่างถ้ายังไม่ขาย" />
              </div>
            </div>

            {/* ข้อมูลวันที่ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buy_date">วันที่ซื้อ *</Label>
                <Input id="buy_date" name="buy_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell_date">วันที่ขาย</Label>
                <Input id="sell_date" name="sell_date" type="date" />
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-muted/20 pt-6 border-t">
            <Button type="submit" className="w-full h-12 text-md font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังบันทึกข้อมูล...
                </>
              ) : (
                <>
                  <UploadCloudIcon className="mr-2 h-5 w-5" /> บันทึกการ์ดลงคลัง
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}