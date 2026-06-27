import "server-only";
import { supabase } from "./supabase";
import { stockKey } from "./inventory";

export type StockRow = { item_id: string; size: string | null; qty: number };

export { stockKey, totalStock, itemsInStock, itemsAvailable, lineAvail } from "./inventory";
export type { StockedItem, StockView } from "./inventory";

function addQty(map: Map<string, number>, itemId: string, size: string | null, n: number) {
  if (n <= 0) return;
  const key = stockKey(itemId, size);
  map.set(key, (map.get(key) ?? 0) + n);
}

/** Physical stock: received order qty minus giveaways (current_stock view). */
export async function getStockMap(): Promise<Map<string, number>> {
  const { data } = await supabase.from("current_stock").select("*");
  const map = new Map<string, number>();
  for (const r of (data ?? []) as StockRow[]) {
    map.set(stockKey(r.item_id, r.size), r.qty);
  }
  return map;
}

/** Qty on open (finalized) orders not yet received into stock. */
export async function getOnOrderMap(): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("order_items")
    .select("item_id, size, qty_ordered, orders!inner(status)")
    .eq("orders.status", "open");
  const map = new Map<string, number>();
  for (const r of (data ?? []) as { item_id: string; size: string | null; qty_ordered: number }[]) {
    addQty(map, r.item_id, r.size, r.qty_ordered);
  }
  return map;
}
