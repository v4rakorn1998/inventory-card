import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image"; 
import { Suspense } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  LayersIcon, 
  PlusCircleIcon, 
  ImageIcon,
  MoreHorizontalIcon,
  Edit2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowUpDown,
  TrendingUpIcon,
  CreditCardIcon,
  DatabaseIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteCardButton } from "./components/delete-card-button";
import { SearchInput } from "./components/search-input";

type CardItem = {
  id: number;
  user_id: number;
  card_code: string;
  image_path: string | null;
  box_case: string | null;
  card_no: string | null;
  card_type: string | null;
  buy_price: number;
  shipping_cost: number | null;
  sell_price: number | null;
  buy_date: string;
  sell_date: string | null;
  created_at: string;
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'boylnwza1234');

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export default async function CardAlbumPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) redirect('/login');

  let user: any = null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    user = payload;
  } catch (error) {
    redirect('/login');
  }

  const supabase = await createClient();
  const resolvedParams = await searchParams;

  const searchQuery = (resolvedParams?.q as string) || "";
  const orderBy = (resolvedParams?.sort as string) || "created_at";
  const orderDir = (resolvedParams?.dir as "asc" | "desc") || "desc";
  const page = Math.max(1, Number(resolvedParams?.page) || 1);
  const limit = Math.max(1, Number(resolvedParams?.limit) || 10);

  // คำนวณข้อมูลสรุป (Summary)
  const { data: summaryData } = await supabase
    .from('cards')
    .select('buy_price, shipping_cost, sell_price')
    .eq('user_id', user.id);

  const totalCards = summaryData?.length || 0;
  const totalCost = (summaryData || []).reduce((sum, card) => sum + Number(card.buy_price || 0) + Number(card.shipping_cost || 0), 0);
  const totalProfit = (summaryData || []).reduce((sum, card) => {
    if (card.sell_price) {
      const invest = Number(card.buy_price || 0) + Number(card.shipping_cost || 0);
      return sum + (Number(card.sell_price) - invest);
    }
    return sum;
  }, 0);

  // ดึงข้อมูลตาราง (Pagination)
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from('cards').select('*', { count: 'exact' }).eq('user_id', user.id);
  
  // ⚡ อัปเกรดระบบค้นหาให้รองรับแบบ Combined (Box-No)
  if (searchQuery) {
    let orQuery = `card_code.ilike.%${searchQuery}%,card_no.ilike.%${searchQuery}%,box_case.ilike.%${searchQuery}%`;
    
    // ถ้าผู้ใช้พิมพ์แบบมี - หรือ เว้นวรรค เช่น "test01-01" หรือ "test01 01"
    if (searchQuery.includes('-') || searchQuery.includes(' ')) {
      const parts = searchQuery.split(/[- ]+/).filter(Boolean);
      if (parts.length >= 2) {
        const boxMatch = parts[0]; // ตัวหน้า (เช่น test01)
        const noMatch = parts.slice(1).join('-'); // ตัวหลัง (เช่น 01)
        
        // เพิ่มเงื่อนไขว่า Box ต้องตรงกับตัวหน้า AND No ต้องตรงกับตัวหลัง
        orQuery += `,and(box_case.ilike.%${boxMatch}%,card_no.ilike.%${noMatch}%)`;
      }
    }
    
    query = query.or(orQuery);
  }

  const { data: cards, count } = await query
    .order(orderBy, { ascending: orderDir === 'asc' })
    .range(from, to);

  const cardList: CardItem[] = cards || [];
  const totalPages = count && count > 0 ? Math.ceil(count / limit) : 1;
  const pageSizeOptions = [10, 20, 50, 100];

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    if (!supabaseUrl) return null;
    return `${supabaseUrl}/storage/v1/object/public/card_images/${path}`;
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-emerald-100 dark:border-emerald-900 pb-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-emerald-950 dark:text-emerald-50 flex items-center gap-3">
            <DatabaseIcon className="text-emerald-600 h-8 w-8" />
            Card Inventory
          </h1>
          <p className="text-muted-foreground font-medium text-base">
            ระบบจัดการคลังการ์ดสะสม | ผู้ใช้งาน: <span className="text-emerald-700 font-bold">{user.display_name}</span>
          </p>
        </div>
        <Link href="/card-album/add">
          <Button className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 transition-all">
            <PlusCircleIcon className="mr-2 h-5 w-5" /> เพิ่มข้อมูลการ์ด
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden border-none shadow-xl bg-emerald-900 text-white p-1">
          <div className="absolute top-0 right-0 p-4 opacity-10"><LayersIcon size={120} /></div>
          <CardHeader className="pb-2"><CardTitle className="text-emerald-300/80 text-xs font-bold uppercase tracking-wider">จำนวนการ์ดทั้งหมด (Total Items)</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-black">{totalCards.toLocaleString()} <span className="text-lg font-normal opacity-60">รายการ</span></div></CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 p-1">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-900 dark:text-emerald-100"><CreditCardIcon size={120} /></div>
          <CardHeader className="pb-2"><CardTitle className="text-emerald-700/60 text-xs font-bold uppercase tracking-wider">มูลค่าการลงทุนรวม (Total Investment)</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-black text-emerald-950 dark:text-emerald-50">฿{totalCost.toLocaleString()}</div></CardContent>
        </Card>

        <Card className={`relative overflow-hidden border-none shadow-xl p-1 text-white ${totalProfit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUpIcon size={120} /></div>
          <CardHeader className="pb-2"><CardTitle className="text-white/80 text-xs font-bold uppercase tracking-wider">ประมาณการ กำไร/ขาดทุน (Est. Profit)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-black">
              {totalProfit >= 0 ? '+' : '-'}฿{Math.abs(totalProfit).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Table */}
      <Card className="border-none shadow-xl rounded-3xl bg-white/80 dark:bg-emerald-950/40 backdrop-blur-xl overflow-hidden border border-emerald-50 dark:border-emerald-900/50">
        <CardHeader className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-emerald-950 dark:text-emerald-50">รายการการ์ดในระบบ</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">ตรวจสอบและจัดการข้อมูลการ์ดสะสมของคุณ</p>
          </div>
          {/* เรียกใช้งาน Realtime Search Component */}
          <Suspense fallback={<div className="h-12 w-full md:w-[400px] bg-emerald-50 rounded-xl animate-pulse"></div>}>
            <SearchInput defaultValue={searchQuery} />
          </Suspense>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar">
            <TooltipProvider delayDuration={150}>
              <Table className="min-w-[1200px]">
                <TableHeader className="bg-emerald-50/60 dark:bg-emerald-900/20">
                  <TableRow className="h-14 border-none hover:bg-transparent">
                    <TableHead className="w-[80px] text-center font-bold text-xs uppercase tracking-wider text-emerald-900/70">Preview</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-emerald-900/70">Ref. Code</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-emerald-900/70">Box / Case & No.</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-emerald-900/70">Type / Rarity</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-emerald-900/70">
                      <Link href={`/card-album?page=1&limit=${limit}&q=${searchQuery}&sort=buy_price&dir=${orderBy === 'buy_price' && orderDir === 'desc' ? 'asc' : 'desc'}`} className="flex items-center justify-end gap-1 hover:text-emerald-700 transition-colors">
                        Buy Price <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </Link>
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-emerald-900/70">Shipping</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-emerald-900/70">Market Value</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-emerald-900/70">
                      <Link href={`/card-album?page=1&limit=${limit}&q=${searchQuery}&sort=buy_date&dir=${orderBy === 'buy_date' && orderDir === 'desc' ? 'asc' : 'desc'}`} className="flex items-center justify-center gap-1 hover:text-emerald-700 transition-colors">
                        Date Acquired <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </Link>
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-emerald-900/70">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground/60">
                          <ImageIcon size={64} className="mb-4 opacity-50" />
                          <p className="font-semibold text-lg">ไม่มีข้อมูลการ์ดในระบบ</p>
                          <p className="font-medium text-sm mt-1">กรุณากด "เพิ่มข้อมูลการ์ด" เพื่อเริ่มต้นการบันทึก</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cardList.map((card) => {
                      const imageUrl = getImageUrl(card.image_path);
                      
                      const boxCase = card.box_case?.trim() || "";
                      const cardNo = card.card_no?.trim() || "";
                      const combinedCode = boxCase && cardNo 
                        ? `${boxCase}-${cardNo}` 
                        : (boxCase || cardNo || "-");

                      return (
                        <TableRow key={card.id} className="h-20 hover:bg-emerald-50/40 transition-colors border-emerald-50/50">
                          <TableCell className="text-center">
                            {imageUrl ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="relative w-12 h-16 mx-auto rounded-lg overflow-hidden shadow-sm ring-1 ring-emerald-200/50 cursor-zoom-in bg-white">
                                    <Image src={imageUrl} alt={card.card_code} fill sizes="48px" className="object-cover" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={15} className="p-0 border-none bg-transparent shadow-none z-50">
                                  <div className="relative w-[300px] h-[420px] rounded-2xl overflow-hidden ring-4 ring-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
                                    <Image src={imageUrl} alt={card.card_code} fill sizes="300px" className="object-cover" />
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="w-12 h-16 mx-auto bg-emerald-50/50 flex items-center justify-center rounded-lg border border-dashed border-emerald-200 text-[9px] text-emerald-800/40 font-bold">NO IMAGE</div>
                            )}
                          </TableCell>
                          
                          <TableCell className="font-semibold text-sm text-emerald-900/80 uppercase">{card.card_code}</TableCell>
                          
                          <TableCell className="font-bold text-emerald-950 dark:text-emerald-100">{combinedCode}</TableCell>
                          
                          <TableCell>
                            {card.card_type ? (
                              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
                                {card.card_type}
                              </span>
                            ) : <span className="text-muted-foreground/40">-</span>}
                          </TableCell>
                          
                          <TableCell className="text-right font-bold text-emerald-700">฿{Number(card.buy_price).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium text-muted-foreground text-xs">฿{Number(card.shipping_cost || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-blue-700">
                            {card.sell_price ? `฿${Number(card.sell_price).toLocaleString()}` : <span className="text-muted-foreground/40 font-medium text-xs">ยังไม่ระบุ</span>}
                          </TableCell>
                          <TableCell className="text-center font-medium text-muted-foreground text-xs">{formatDate(card.buy_date)}</TableCell>
                          
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-lg hover:bg-emerald-100 text-emerald-700">
                                  <MoreHorizontalIcon size={20} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl border-emerald-100">
                                <DropdownMenuLabel className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-1">ตัวเลือกการจัดการ</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href={`/card-album/edit/${card.id}`}>
                                  <DropdownMenuItem className="h-10 rounded-lg font-semibold text-emerald-700 cursor-pointer focus:bg-emerald-50"><Edit2Icon className="mr-3 h-4 w-4" /> แก้ไขข้อมูล (Edit)</DropdownMenuItem>
                                </Link>
                                <DeleteCardButton id={card.id} cardCode={card.card_code} />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t border-emerald-100/50 flex flex-col sm:flex-row justify-between items-center gap-6 bg-emerald-50/30">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">หน้า</span>
                  <div className="h-8 w-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">{page}</div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">จาก {totalPages}</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">แสดงข้อมูล</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-9 px-3 border-emerald-200 rounded-lg font-semibold text-emerald-800 bg-white">{limit} รายการ <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl font-medium min-w-[120px]">
                      {pageSizeOptions.map(size => (
                        <Link key={size} href={`/card-album?page=1&limit=${size}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`}>
                          <DropdownMenuItem className="cursor-pointer justify-center hover:bg-emerald-50">{size} รายการ</DropdownMenuItem>
                        </Link>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>

            <div className="flex gap-3">
              <Button disabled={page <= 1} asChild={page > 1} variant="outline" className="h-10 px-4 rounded-lg font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white shadow-sm">
                <Link href={`/card-album?page=${page-1}&limit=${limit}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`}><ChevronLeftIcon className="mr-1.5 h-4 w-4" /> ย้อนกลับ</Link>
              </Button>
              <Button disabled={page >= totalPages} asChild={page < totalPages} variant="outline" className="h-10 px-4 rounded-lg font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white shadow-sm">
                <Link href={`/card-album?page=${page+1}&limit=${limit}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`}>หน้าถัดไป <ChevronRightIcon className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}