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
import { WalletIcon, LayersIcon, PlusCircleIcon, ImageIcon } from "lucide-react";

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

export default async function CardAlbumPage() {
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
  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const cardList: CardItem[] = cards || [];

  const totalCards = cardList.length;
  
  const totalCost = cardList.reduce((sum: number, card: CardItem) => {
    const cost = Number(card.buy_price || 0) + Number(card.shipping_cost || 0);
    return sum + cost;
  }, 0);
  
  const totalProfit = cardList.reduce((sum: number, card: CardItem) => {
    if (card.sell_price) {
      const totalInvest = Number(card.buy_price || 0) + Number(card.shipping_cost || 0);
      return sum + (Number(card.sell_price) - totalInvest);
    }
    return sum;
  }, 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 pt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">คลังเก็บการ์ด (Inventory)</h1>
          <p className="text-muted-foreground mt-1">ยินดีต้อนรับท่านมหาเศรษฐี, {user.display_name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/card-album/add">
            <Button className="flex items-center gap-2">
              <PlusCircleIcon className="w-4 h-4" />
              เพิ่มการ์ดใหม่
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จำนวนการ์ดทั้งหมด</CardTitle>
            <LayersIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCards} ใบ</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ต้นทุนรวมทั้งหมด</CardTitle>
            <WalletIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{totalCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไร/ขาดทุน (หักทุน+ค่าส่ง)</CardTitle>
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
        <CardHeader>
          <CardTitle className="text-xl">รายการการ์ดของคุณ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px] text-center">รูปภาพ</TableHead>
                  <TableHead>Card Code</TableHead>
                  <TableHead>No.</TableHead>
                  <TableHead>Case / Box</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">ราคาซื้อ</TableHead>
                  <TableHead className="text-right">ค่าขนส่ง</TableHead>
                  <TableHead className="text-right">ราคาขาย</TableHead>
                  <TableHead>วันซื้อ</TableHead>
                  <TableHead>วันขาย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="h-8 w-8 text-muted/50" />
                        <p>ยังไม่มีข้อมูลการ์ดในระบบ กดเพิ่มการ์ดใหม่ได้เลย!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  cardList.map((card) => (
                    <TableRow key={card.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-center">
                        {card.image_path ? (
                          <div className="relative w-12 h-16 mx-auto rounded-md overflow-hidden border shadow-sm">
                            <img 
                              src={card.image_path} 
                              alt={card.card_code} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-16 mx-auto bg-muted flex items-center justify-center rounded-md border text-xs text-muted-foreground">
                            ไม่มีรูป
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">{card.card_code}</TableCell>
                      <TableCell className="font-medium">{card.card_no || "-"}</TableCell>
                      <TableCell>{card.box_case || "-"}</TableCell>
                      <TableCell>
                        {card.card_type ? (
                          <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-medium border">
                            {card.card_type}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        ฿{Number(card.buy_price).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-orange-500">
                        {card.shipping_cost ? `฿${Number(card.shipping_cost).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {card.sell_price ? `฿${Number(card.sell_price).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(card.buy_date)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(card.sell_date)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}