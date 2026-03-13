"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { getCardById, updateCard } from "@/services/card.action";
import { 
  ArrowLeftIcon, 
  Loader2, 
  SaveIcon, 
  ImageIcon, 
  BanknoteIcon, 
  CalendarIcon, 
  PackageIcon,
  TagIcon,
  LayersIcon
} from "lucide-react";

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ดึงข้อมูลการ์ดเดิมมาแสดงผล
  useEffect(() => {
    const fetchCard = async () => {
      try {
        const result = await getCardById(parseInt(id));
        if (result.error) {
          toast.error(result.error);
          router.push("/card-album");
          return;
        }
        setCardData(result.data);
        if (result.data.image_path) {
          setImagePreview(result.data.image_path);
        }
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลการ์ดได้");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCard();
  }, [id, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);

    const formData = new FormData(e.currentTarget);
    formData.append("id", id);

    try {
      const result = await updateCard(formData);
      
      if (result.error) {
        toast.error(result.error);
        setIsUpdating(false);
        return;
      }

      toast.success("อัปเดตข้อมูลสมบัติเรียบร้อยแล้ว!");
      router.push("/card-album");
      router.refresh(); 
      
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

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
              Edit Treasure
            </h1>
            <p className="text-muted-foreground font-medium text-sm">แก้ไขข้อมูลการ์ดรหัส: <span className="text-emerald-600 font-bold">{cardData?.card_code}</span></p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* ฝั่งซ้าย: รูปภาพ */}
          <div className="xl:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl rounded-3xl bg-white/70 dark:bg-emerald-950/40 backdrop-blur-xl overflow-hidden ring-1 ring-white/20">
              <CardHeader className="bg-emerald-600 text-white p-6">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" /> Card Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="relative group">
                  <div className="w-full aspect-[3/4] rounded-[2rem] flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 overflow-hidden relative shadow-inner ring-2 ring-emerald-500/10">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover animate-in zoom-in-95 duration-300" />
                    ) : (
                      <div className="flex flex-col items-center text-emerald-200 dark:text-emerald-800">
                        <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">No Image Found</span>
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
                  <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tighter">อัปโหลดรูปใหม่เพื่อเปลี่ยนรูปภาพเดิม</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ฝั่งขวา: ฟอร์มข้อมูล */}
          <div className="xl:col-span-8 space-y-8">
            <Card className="border-none shadow-2xl rounded-3xl bg-white/70 dark:bg-emerald-950/40 backdrop-blur-xl overflow-hidden border border-white/20">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-black text-emerald-950 dark:text-emerald-50 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><PackageIcon className="h-6 w-6" /></div>
                  Update Information
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="box_case" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <LayersIcon className="h-3 w-3" /> Origin (Box/Case)
                    </Label>
                    <Input id="box_case" name="box_case" defaultValue={cardData?.box_case || ""} placeholder="e.g. Case #12, Box A" className="h-12 rounded-2xl border-emerald-100 bg-white/50 focus-visible:ring-emerald-500 font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="card_no" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <TagIcon className="h-3 w-3" /> Card Number (No.)
                    </Label>
                    <Input id="card_no" name="card_no" defaultValue={cardData?.card_no || ""} placeholder="e.g. 001/150, #025" className="h-12 rounded-2xl border-emerald-100 bg-white/50 focus-visible:ring-emerald-500 font-bold" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Label htmlFor="card_type" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">Rarity / Type</Label>
                    <Input id="card_type" name="card_type" defaultValue={cardData?.card_type || ""} placeholder="e.g. SR, UR, Parallel Rare" className="h-12 rounded-2xl border-emerald-100 bg-white/50 focus-visible:ring-emerald-500 font-bold" />
                  </div>
                </div>

                {/* Financial Values */}
                <div className="space-y-6">
                   <Label className="text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <BanknoteIcon className="h-4 w-4 text-emerald-600" /> Financial Values
                   </Label>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-emerald-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
                    <div className="space-y-3 relative z-10">
                      <Label htmlFor="buy_price" className="text-rose-400 font-black uppercase text-[10px] tracking-[0.2em]">Buy Price (THB) *</Label>
                      <Input id="buy_price" name="buy_price" type="number" defaultValue={cardData?.buy_price} required className="h-14 rounded-2xl bg-white/10 border-white/10 focus:border-rose-500 focus:ring-rose-500 text-2xl font-black" />
                    </div>
                    <div className="space-y-3 relative z-10">
                      <Label htmlFor="shipping_cost" className="text-orange-400 font-black uppercase text-[10px] tracking-[0.2em]">Shipping Fee</Label>
                      <Input id="shipping_cost" name="shipping_cost" type="number" defaultValue={cardData?.shipping_cost || 0} className="h-14 rounded-2xl bg-white/10 border-white/10 focus:border-orange-500 focus:ring-orange-500 text-2xl font-black" />
                    </div>
                    <div className="space-y-3 relative z-10">
                      <Label htmlFor="sell_price" className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.2em]">Market Value</Label>
                      <Input id="sell_price" name="sell_price" type="number" defaultValue={cardData?.sell_price || ""} className="h-14 rounded-2xl bg-white/10 border-white/10 focus:border-emerald-500 focus:ring-emerald-500 text-2xl font-black" />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
                  <div className="space-y-3">
                    <Label htmlFor="buy_date" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-emerald-600" /> Acquisition Date *
                    </Label>
                    <Input id="buy_date" name="buy_date" type="date" defaultValue={cardData?.buy_date ? new Date(cardData.buy_date).toISOString().split('T')[0] : ""} required className="h-12 rounded-2xl border-emerald-100 bg-white focus-visible:ring-emerald-500 font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="sell_date" className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-emerald-600" /> Date of Sale
                    </Label>
                    <Input id="sell_date" name="sell_date" type="date" defaultValue={cardData?.sell_date ? new Date(cardData.sell_date).toISOString().split('T')[0] : ""} className="h-12 rounded-2xl border-emerald-100 bg-white focus-visible:ring-emerald-500 font-bold" />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-emerald-50/50 dark:bg-emerald-900/20 p-10 border-t border-emerald-100">
                <Button type="submit" className="w-full h-16 text-xl font-black uppercase tracking-widest rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 transition-all hover:-translate-y-1 active:scale-95" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="mr-3 h-6 w-6" /> Save Changes
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