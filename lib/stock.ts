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

type StockedItem = { id: string; has_sizes: boolean; sizes: string[] | null };

function qty(stock: Map<string, number> | Record<string, number>, key: string) {
  return stock instanceof Map ? (stock.get(key) ?? 0) : (stock[key] ?? 0);
}

/** Total units in stock for an item (sums sizes when applicable). */
export function totalStock(item: StockedItem, stock: Map<string, number> | Record<string, number>): number {
  if (item.has_sizes && item.sizes?.length)
    return item.sizes.reduce((s, sz) => s + qty(stock, stockKey(item.id, sz)), 0);
  return qty(stock, stockKey(item.id, null));
}

/** Active items with stock, plus any ids already on a giveaway being edited. */
export function itemsInStock<T extends StockedItem>(
  items: T[],
  stock: Map<string, number> | Record<string, number>,
  alsoInclude: string[] = []
): T[] {
  const keep = new Set(alsoInclude);
  return items.filter((item) => keep.has(item.id) || totalStock(item, stock) > 0);
}
