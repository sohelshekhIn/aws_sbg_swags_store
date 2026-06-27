import { supabase, type Item } from "@/lib/supabase";
import { getOnOrderMap, getStockMap } from "@/lib/stock";
import { StockGrid } from "@/components/stock-grid";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const { data: items } = await supabase.from("items").select("*").order("points", { ascending: false });
  const stock = Object.fromEntries(await getStockMap());
  const onOrder = Object.fromEntries(await getOnOrderMap());

  return <StockGrid items={(items ?? []) as Item[]} stock={stock} onOrder={onOrder} />;
}
