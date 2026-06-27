import "server-only";
import { supabase } from "./supabase";

export type StockRow = { item_id: string; size: string | null; qty: number };

export function stockKey(itemId: string, size: string | null): string {
  return `${itemId}|${size ?? ""}`;
}

export async function getStockMap(): Promise<Map<string, number>> {
  const { data } = await supabase.from("current_stock").select("*");
  const map = new Map<string, number>();
  for (const r of (data ?? []) as StockRow[]) {
    map.set(stockKey(r.item_id, r.size), r.qty);
  }
  return map;
}
