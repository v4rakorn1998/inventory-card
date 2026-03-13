import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { 
  WalletIcon, 
  LayersIcon, 
  PlusCircleIcon, 
  ImageIcon,
  MoreHorizontalIcon,
  Edit2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SearchIcon,
  ArrowUpDown
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

  if (!token) {
    redirect('/login');
  }

  let user: any = null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    user = payload;
  } catch (error) {
    redirect('/login');
  }

  const supabase = await createClient();
  const resolvedParams = await searchParams;

  // --- รับค่า Search & Order จาก URL ---
  const searchQuery = (resolvedParams?.q as string) || "";
  const orderBy = (resolvedParams?.sort as string) || "created_at";
  const orderDir = (resolvedParams?.dir as "asc" | "desc") || "desc";

  // --- ส่วนที่ 1: Summary (ดึงทั้งหมดของ User เพื่อคำนวณสถิติ) ---
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

  // --- ส่วนที่ 2: Pagination & Data Fetching ---
  const page = Math.max(1, Number(resolvedParams?.page) || 1);
  const limit = Math.max(1, Number(resolvedParams?.limit) || 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('cards')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  // ใส่ Filter ค้นหา (ถ้ามี)
  if (searchQuery) {
    query = query.or(`card_code.ilike.%${searchQuery}%,card_no.ilike.%${searchQuery}%,box_case.ilike.%${searchQuery}%`);
  }

  // ใส่ลำดับการเรียง
  const { data: cards, count } = await query
    .order(orderBy, { ascending: orderDir === 'asc' })
    .range(from, to);

  const cardList: CardItem[] = cards || [];
  const totalPages = count && count > 0 ? Math.ceil(count / limit) : 1;
  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 pt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">คลังเก็บการ์ด (Inventory)</h1>
          <p className="text-muted-foreground mt-1">ยินดีต้อนรับท่านมหาเศรษฐี, {user.display_name}</p>
        </div>
        <Link href="/card-album/add">
          <Button className="flex items-center gap-2">
            <PlusCircleIcon className="w-4 h-4" /> เพิ่มการ์ดใหม่
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จำนวนการ์ดทั้งหมด</CardTitle>
            <LayersIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalCards} ใบ</div></CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ต้นทุนรวมทั้งหมด</CardTitle>
            <WalletIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">฿{totalCost.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไร/ขาดทุน</CardTitle>
            <WalletIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {totalProfit > 0 ? '+' : ''}{totalProfit === 0 ? '-' : `฿${totalProfit.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl">รายการการ์ดของคุณ</CardTitle>
            
            {/* --- Search Form --- */}
            <form className="relative w-full md:w-72">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                name="q" 
                placeholder="ค้นหา Code, No, Box..." 
                defaultValue={searchQuery}
                className="pl-9" 
              />
              {/* ส่งค่าเดิมไปด้วยกันหลุด */}
              <input type="hidden" name="limit" value={limit} />
              <input type="hidden" name="sort" value={orderBy} />
              <input type="hidden" name="dir" value={orderDir} />
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <TooltipProvider delayDuration={150}>
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[80px] text-center">รูปภาพ</TableHead>
                    <TableHead>Card Code</TableHead>
                    <TableHead>No.</TableHead>
                    <TableHead>Case / Box</TableHead>
                    <TableHead>ประเภท</TableHead>
                    
                    {/* --- Sortable Headers --- */}
                    <TableHead className="text-right">
                      <Link href={`/card-album?page=1&limit=${limit}&q=${searchQuery}&sort=buy_price&dir=${orderBy === 'buy_price' && orderDir === 'desc' ? 'asc' : 'desc'}`} className="flex items-center justify-end gap-1 hover:text-primary transition-colors">
                        ราคาซื้อ <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </TableHead>
                    <TableHead className="text-right">ค่าขนส่ง</TableHead>
                    <TableHead className="text-right">ราคาขาย</TableHead>
                    <TableHead>
                      <Link href={`/card-album?page=1&limit=${limit}&q=${searchQuery}&sort=buy_date&dir=${orderBy === 'buy_date' && orderDir === 'desc' ? 'asc' : 'desc'}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        วันซื้อ <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </TableHead>
                    <TableHead>วันขาย</TableHead>
                    <TableHead className="text-center w-[80px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                        <p>{searchQuery ? "ไม่พบข้อมูลที่ตรงกับการค้นหา" : "ยังไม่มีข้อมูลการ์ดในระบบ"}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cardList.map((card) => (
                      <TableRow key={card.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-center">
                          {card.image_path ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative w-12 h-16 mx-auto rounded-md overflow-hidden border shadow-sm cursor-zoom-in hover:scale-105 transition-transform duration-200">
                                  <img src={card.image_path} alt={card.card_code} className="object-cover w-full h-full" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" sideOffset={12} className="p-1.5 bg-background border shadow-2xl rounded-xl z-[100]">
                                <div className="relative w-[240px] h-[336px] md:w-[280px] md:h-[392px] rounded-lg overflow-hidden shadow-sm">
                                  <img src={card.image_path} alt={card.card_code} className="object-cover w-full h-full" />
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : <div className="w-12 h-16 mx-auto bg-muted flex items-center justify-center rounded-md border text-xs text-muted-foreground">ไม่มีรูป</div>}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">{card.card_code}</TableCell>
                        <TableCell className="font-medium">{card.card_no || "-"}</TableCell>
                        <TableCell>{card.box_case || "-"}</TableCell>
                        <TableCell>{card.card_type ? <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-medium border">{card.card_type}</span> : "-"}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">฿{Number(card.buy_price).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-orange-500">{card.shipping_cost ? `฿${Number(card.shipping_cost).toLocaleString()}` : "-"}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">{card.sell_price ? `฿${Number(card.sell_price).toLocaleString()}` : "-"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(card.buy_date)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(card.sell_date)}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontalIcon className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <Link href={`/card-album/edit/${card.id}`}><DropdownMenuItem className="cursor-pointer"><Edit2Icon className="mr-2 h-4 w-4" /> แก้ไขข้อมูล</DropdownMenuItem></Link>
                              <DeleteCardButton id={card.id} cardCode={card.card_code} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>

          {/* Footer: Pagination & Page Size */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-2 pt-4 border-t gap-4">
            <div className="flex items-center gap-6">
              <div className="text-sm text-muted-foreground">
                หน้า <span className="font-medium text-foreground">{page}</span> จาก <span className="font-medium text-foreground">{totalPages}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>แสดงหน้าละ:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">{limit} <ChevronDownIcon className="h-3 w-3 opacity-50" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[80px]">
                    {pageSizeOptions.map((size) => (
                      <Link key={size} href={`/card-album?page=1&limit=${size}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`} passHref>
                        <DropdownMenuItem className="cursor-pointer justify-center">{size}</DropdownMenuItem>
                      </Link>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? <Link href={`/card-album?page=${page-1}&limit=${limit}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`}><ChevronLeftIcon className="w-4 h-4 mr-1" /> ก่อนหน้า</Link> : <div className="flex items-center opacity-50"><ChevronLeftIcon className="w-4 h-4 mr-1" /> ก่อนหน้า</div>}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? <Link href={`/card-album?page=${page+1}&limit=${limit}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`}>ถัดไป <ChevronRightIcon className="w-4 h-4 ml-1" /></Link> : <div className="flex items-center opacity-50">ถัดไป <ChevronRightIcon className="w-4 h-4 ml-1" /></div>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}