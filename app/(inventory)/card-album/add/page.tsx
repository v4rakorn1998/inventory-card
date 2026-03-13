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
import { 
  ArrowLeftIcon, 
  Loader2, 
  UploadCloudIcon, 
  ImageIcon, 
  BanknoteIcon, 
  CalendarIcon, 
  PackageIcon,
  TagIcon,
  LayersIcon
} from "lucide-react";

export default function AddCardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      router.refresh(); 
      
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/card-album">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
              <ArrowLeftIcon className="h-6 w-6" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-emerald-950 dark:text-emerald-50 bg-clip-text text-transparent bg-linear-to-r from-emerald-800 to-emerald-500">
              New Acquisition
            </h1>
            <p className="text-muted-foreground font-medium text-sm">เพิ่มรายการสะสมใหม่เข้าสู่คลังสมบัติของคุณ</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* ฝั่งซ้าย: อัปโหลดรูปภาพ (Col-4) */}
          <div className="xl:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl rounded-3xl bg-white/70 dark:bg-emerald-950/40 backdrop-blur-xl overflow-hidden ring-1 ring-white/20">
              <CardHeader className="bg-emerald-600 text-white p-6">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" /> Card Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="relative group">
                  <div className="w-full aspect-[3/4] rounded-[2rem] flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 overflow-hidden relative shadow-inner ring-2 ring-emerald-500/10 transition-all group-hover:ring-emerald-500/30">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover animate-in zoom-in-95 duration-300" />
                    ) : (
                      <div className="flex flex-col items-center text-emerald-300 dark:text-emerald-800">
                        <UploadCloudIcon className="h-16 w-16 mb-4 opacity-20 animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Waiting for card art</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Input 
                    id="image" 
                    name="image" 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer bg-white h-12 rounded-xl border-emerald-100 file:bg-emerald-600 file:text-white file:font-black file:px-4 file:h-full file:mr-4 file:border-0 hover:border-emerald-400 transition-all shadow-sm"
                  />
                  <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tighter">
                    Supported: JPG, PNG, WEBP (Max 5MB)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ฝั่งขวา: ฟอร์มข้อมูล (Col-8) */}
          <div className="xl:col-span-8 space-y-8">
            <Card className="border-none shadow-2xl rounded-3xl bg-white/70 dark:bg-emerald-950/40 backdrop-blur-xl overflow-hidden border border-white/20">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-black text-emerald-950 dark:text-emerald-50 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><PackageIcon className="h-6 w-6" /></div>
                  General Information
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-8 space-y-10">
                {/* กลุ่มข้อมูลทั่วไป */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="box_case" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <LayersIcon className="h-3 w-3" /> Origin (Box/Case)
                    </Label>
                    <Input id="box_case" name="box_case" placeholder="e.g. Case #12, Box A" className="h-12 rounded-2xl border-emerald-100 bg-white/50 focus-visible:ring-emerald-500 font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="card_no" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <TagIcon className="h-3 w-3" /> Card Number (No.)
                    </Label>
                    <Input id="card_no" name="card_no" placeholder="e.g. 001/150, #025" className="h-12 rounded-2xl border-emerald-100 bg-white/50 focus-visible:ring-emerald-500 font-bold" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Label htmlFor="card_type" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">Rarity / Type</Label>
                    <Input id="card_type" name="card_type" placeholder="e.g. SR, UR, Parallel Rare, Manga Rare" className="h-12 rounded-2xl border-emerald-100 bg-white/50 focus-visible:ring-emerald-500 font-bold" />
                  </div>
                </div>

                {/* กลุ่มข้อมูลราคา */}
                <div className="space-y-6">
                   <Label className="text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <BanknoteIcon className="h-4 w-4 text-emerald-600" /> Financial Values
                   </Label>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-emerald-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
                    <div className="space-y-3 relative z-10">
                      <Label htmlFor="buy_price" className="text-rose-400 font-black uppercase text-[10px] tracking-[0.2em]">Buy Price (THB) *</Label>
                      <Input id="buy_price" name="buy_price" type="number" min="0" required placeholder="0" className="h-14 rounded-2xl bg-white/10 border-white/10 focus:border-rose-500 focus:ring-rose-500 text-2xl font-black placeholder:text-white/20" />
                    </div>
                    <div className="space-y-3 relative z-10">
                      <Label htmlFor="shipping_cost" className="text-orange-400 font-black uppercase text-[10px] tracking-[0.2em]">Shipping Fee</Label>
                      <Input id="shipping_cost" name="shipping_cost" type="number" min="0" placeholder="0" defaultValue="0" className="h-14 rounded-2xl bg-white/10 border-white/10 focus:border-orange-500 focus:ring-orange-500 text-2xl font-black placeholder:text-white/20" />
                    </div>
                    <div className="space-y-3 relative z-10">
                      <Label htmlFor="sell_price" className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.2em]">Market Value</Label>
                      <Input id="sell_price" name="sell_price" type="number" min="0" placeholder="-" className="h-14 rounded-2xl bg-white/10 border-white/10 focus:border-emerald-500 focus:ring-emerald-500 text-2xl font-black placeholder:text-white/20" />
                    </div>
                  </div>
                </div>

                {/* กลุ่มข้อมูลวันที่ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
                  <div className="space-y-3">
                    <Label htmlFor="buy_date" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-emerald-600" /> Acquisition Date *
                    </Label>
                    <Input id="buy_date" name="buy_date" type="date" required className="h-12 rounded-2xl border-emerald-100 bg-white focus-visible:ring-emerald-500 font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="sell_date" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-emerald-600" /> Date of Sale (Optional)
                    </Label>
                    <Input id="sell_date" name="sell_date" type="date" className="h-12 rounded-2xl border-emerald-100 bg-white focus-visible:ring-emerald-500 font-bold" />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-emerald-50/50 dark:bg-emerald-900/20 p-10 border-t border-emerald-100">
                <Button type="submit" className="w-full h-16 text-xl font-black uppercase tracking-widest rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 transition-all hover:-translate-y-1 active:scale-95" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <UploadCloudIcon className="mr-3 h-6 w-6" /> Secure Treasure
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}