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
  ArrowUpDown,
  TrendingUpIcon,
  CreditCardIcon
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

  // --- รับค่า Search & Sort & Pagination จาก URL ---
  const searchQuery = (resolvedParams?.q as string) || "";
  const orderBy = (resolvedParams?.sort as string) || "created_at";
  const orderDir = (resolvedParams?.dir as "asc" | "desc") || "desc";
  const page = Math.max(1, Number(resolvedParams?.page) || 1);
  const limit = Math.max(1, Number(resolvedParams?.limit) || 10);

  // --- ส่วนที่ 1: Summary (คำนวณจากข้อมูลทั้งหมดของ User) ---
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

  // --- ส่วนที่ 2: ดึงข้อมูลแบบ Pagination & Search ---
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('cards')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  if (searchQuery) {
    query = query.or(`card_code.ilike.%${searchQuery}%,card_no.ilike.%${searchQuery}%,box_case.ilike.%${searchQuery}%`);
  }

  const { data: cards, count } = await query
    .order(orderBy, { ascending: orderDir === 'asc' })
    .range(from, to);

  const cardList: CardItem[] = cards || [];
  const totalPages = count && count > 0 ? Math.ceil(count / limit) : 1;
  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-emerald-950 dark:text-emerald-50 bg-clip-text text-transparent bg-linear-to-r from-emerald-800 to-emerald-500">
            Card Treasury
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            ยินดีต้อนรับท่านมหาเศรษฐี <span className="text-emerald-600 font-bold underline decoration-emerald-200 underline-offset-4">{user.display_name}</span>
          </p>
        </div>
        <Link href="/card-album/add">
          <Button className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/30 hover:-translate-y-1 transition-all">
            <PlusCircleIcon className="mr-2 h-5 w-5" /> เพิ่มการ์ดใบใหม่
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden border-none shadow-2xl bg-emerald-900 text-white group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <LayersIcon size={120} />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-emerald-100/70 text-sm font-bold uppercase tracking-widest">Total Collection</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black">{totalCards.toLocaleString()} <span className="text-xl font-normal text-emerald-300/80">ใบ</span></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-2xl bg-white dark:bg-emerald-950 group border border-emerald-100 dark:border-emerald-900">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-900 dark:text-emerald-100 group-hover:opacity-10 transition-opacity">
            <CreditCardIcon size={120} />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-emerald-800/50 dark:text-emerald-300/50 text-sm font-bold uppercase tracking-widest">Total Investment</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black text-emerald-900 dark:text-emerald-100">
              <span className="text-2xl text-emerald-600 mr-1 font-normal">฿</span>{totalCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden border-none shadow-2xl group ${totalProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUpIcon size={120} />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-white/70 text-sm font-bold uppercase tracking-widest">Total Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black">
              <span className="text-2xl mr-1 font-normal">{totalProfit >= 0 ? '+' : '-'}฿</span>
              {Math.abs(totalProfit).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Section */}
      <Card className="border-none shadow-2xl rounded-3xl bg-white/70 dark:bg-emerald-950/40 backdrop-blur-xl overflow-hidden border border-white/20">
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-emerald-950 dark:text-emerald-50">My Inventory</CardTitle>
              <p className="text-sm text-muted-foreground font-medium">จัดการและตรวจสอบรายการการ์ดทั้งหมดของคุณ</p>
            </div>
            
            <form className="relative w-full md:w-96 group">
              <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-emerald-600/40 group-focus-within:text-emerald-600 transition-colors" />
              <Input 
                name="q" 
                placeholder="ค้นหา Code, No, Box..." 
                defaultValue={searchQuery}
                className="h-12 pl-12 bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 rounded-2xl focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all font-medium" 
              />
              <input type="hidden" name="limit" value={limit} />
              <input type="hidden" name="sort" value={orderBy} />
              <input type="hidden" name="dir" value={orderDir} />
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar">
            <TooltipProvider delayDuration={150}>
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-emerald-50/50 dark:bg-emerald-900/10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-[100px] text-center text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter pt-6 pb-6">Preview</TableHead>
                    <TableHead className="text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">Code</TableHead>
                    <TableHead className="text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">No.</TableHead>
                    <TableHead className="text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">Box/Case</TableHead>
                    <TableHead className="text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">Type</TableHead>
                    <TableHead className="text-right text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">
                      <Link href={`/card-album?page=1&limit=${limit}&q=${searchQuery}&sort=buy_price&dir=${orderBy === 'buy_price' && orderDir === 'desc' ? 'asc' : 'desc'}`} className="flex items-center justify-end gap-1 hover:text-emerald-600 transition-colors group">
                        Cost <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                      </Link>
                    </TableHead>
                    <TableHead className="text-right text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">Shipping</TableHead>
                    <TableHead className="text-right text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">Sell Price</TableHead>
                    <TableHead className="text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">
                      <Link href={`/card-album?page=1&limit=${limit}&q=${searchQuery}&sort=buy_date&dir=${orderBy === 'buy_date' && orderDir === 'desc' ? 'asc' : 'desc'}`} className="flex items-center gap-1 hover:text-emerald-600 transition-colors group">
                        Date Acquired <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                      </Link>
                    </TableHead>
                    <TableHead className="text-center text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-tighter">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <ImageIcon size={64} className="mb-4" />
                          <p className="font-bold text-lg">{searchQuery ? "No matches found." : "Your treasury is empty."}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cardList.map((card) => (
                      <TableRow key={card.id} className="group border-none hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all">
                        <TableCell className="text-center py-4">
                          {card.image_path ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative w-14 h-20 mx-auto rounded-xl overflow-hidden ring-2 ring-emerald-500/10 group-hover:ring-emerald-500/50 group-hover:scale-110 transition-all duration-300 cursor-zoom-in shadow-lg shadow-emerald-500/5">
                                  <img src={card.image_path} alt={card.card_code} className="object-cover w-full h-full" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" sideOffset={15} className="p-0 bg-transparent border-none shadow-none z-[100]">
                                <div className="relative w-[280px] h-[392px] rounded-3xl overflow-hidden ring-8 ring-white/50 dark:ring-emerald-900/50 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in zoom-in-90 duration-300">
                                  <img src={card.image_path} alt={card.card_code} className="object-cover w-full h-full" />
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="w-14 h-20 mx-auto bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800 text-[8px] text-emerald-800/40 font-bold">NO PIC</div>
                          )}
                        </TableCell>
                        <TableCell className="font-black text-emerald-900 dark:text-emerald-100">{card.card_code}</TableCell>
                        <TableCell className="font-bold text-muted-foreground">{card.card_no || "-"}</TableCell>
                        <TableCell className="font-medium">{card.box_case || "-"}</TableCell>
                        <TableCell>
                          {card.card_type ? (
                            <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm">
                              {card.card_type}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-950 dark:text-emerald-50">฿{Number(card.buy_price).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground/60 font-medium text-xs">฿{Number(card.shipping_cost || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-black">
                          {card.sell_price ? `฿${Number(card.sell_price).toLocaleString()}` : <span className="opacity-20">-</span>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-bold uppercase">{formatDate(card.buy_date)}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-800 text-emerald-600">
                                <MoreHorizontalIcon className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-emerald-100 dark:border-emerald-900 shadow-2xl">
                              <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Management</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <Link href={`/card-album/edit/${card.id}`}>
                                <DropdownMenuItem className="cursor-pointer rounded-xl h-10 font-bold text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50 dark:focus:bg-emerald-900/50">
                                  <Edit2Icon className="mr-3 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                              </Link>
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

          {/* Footer: Pagination & Page Size Dropdown */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-emerald-50/20 dark:bg-emerald-900/5 gap-6">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800/40">Page</span>
                <span className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-emerald-600/20">{page}</span>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800/40">of {totalPages}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800/40">View</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 min-w-[60px] border-emerald-100 dark:border-emerald-800 rounded-lg font-bold text-emerald-700">
                      {limit} <ChevronDownIcon className="ml-2 h-3 w-3 opacity-40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl shadow-2xl">
                    {pageSizeOptions.map((size) => (
                      <Link key={size} href={`/card-album?page=1&limit=${size}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`} passHref>
                        <DropdownMenuItem className="cursor-pointer justify-center font-black text-emerald-700">{size}</DropdownMenuItem>
                      </Link>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="h-10 px-4 border-emerald-100 dark:border-emerald-800 rounded-xl font-bold text-emerald-700 hover:bg-emerald-50 transition-all" 
                disabled={page <= 1} 
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`/card-album?page=${page-1}&limit=${limit}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`}>
                    <ChevronLeftIcon className="mr-2 h-4 w-4" /> Prev
                  </Link>
                ) : (
                  <div className="flex items-center opacity-30"><ChevronLeftIcon className="mr-2 h-4 w-4" /> Prev</div>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-10 px-4 border-emerald-100 dark:border-emerald-800 rounded-xl font-bold text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm" 
                disabled={page >= totalPages} 
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`/card-album?page=${page+1}&limit=${limit}&q=${searchQuery}&sort=${orderBy}&dir=${orderDir}`}>
                    Next <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <div className="flex items-center opacity-30">Next <ChevronRightIcon className="ml-2 h-4 w-4" /></div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}