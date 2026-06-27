/** Pure stock/inventory helpers — safe for client and server. */

export type StockedItem = { id: string; has_sizes: boolean; sizes: string[] | null };

export function stockKey(itemId: string, size: string | null): string {
  return `${itemId}|${size ?? ""}`;
}

function qty(stock: Map<string, number> | Record<string, number>, key: string) {
  return stock instanceof Map ? (stock.get(key) ?? 0) : (stock[key] ?? 0);
}

/** Total qty for an item. Sums size buckets plus any legacy null-size lines. */
export function totalStock(item: StockedItem, stock: Map<string, number> | Record<string, number>): number {
  const legacy = qty(stock, stockKey(item.id, null));
  if (item.has_sizes && item.sizes?.length) {
    return legacy + item.sizes.reduce((s, sz) => s + qty(stock, stockKey(item.id, sz)), 0);
  }
  return legacy;
}

/** Physical availability for one giveaway line (legacy null-size pool counts for sized items). */
export function lineAvail(
  item: StockedItem,
  size: string,
  stock: Map<string, number> | Record<string, number>
): number {
  const legacy = qty(stock, stockKey(item.id, null));
  if (!item.has_sizes) return legacy;
  return legacy + qty(stock, stockKey(item.id, size || null));
}

export function itemsInStock<T extends StockedItem>(
  items: T[],
  stock: Map<string, number> | Record<string, number>,
  alsoInclude: string[] = []
): T[] {
  const keep = new Set(alsoInclude);
  return items.filter((item) => keep.has(item.id) || totalStock(item, stock) > 0);
}

export function itemsAvailable<T extends StockedItem>(
  items: T[],
  stock: Map<string, number> | Record<string, number>,
  onOrder: Map<string, number> | Record<string, number>
): T[] {
  return items.filter(
    (item) => totalStock(item, stock) > 0 || totalStock(item, onOrder) > 0
  );
}

export type StockView = "stock" | "all";

export function orderPointsTotal(
  lines: { item_id: string; qty: number }[],
  pointsById: Map<string, number> | Record<string, number>
): number {
  const pts = (id: string) => (pointsById instanceof Map ? pointsById.get(id) : pointsById[id]) ?? 0;
  return lines.reduce((s, l) => s + pts(l.item_id) * l.qty, 0);
}

/** Max qty for one line without exceeding per-line stock (giveaway). */
export function maxLineQty(
  item: StockedItem,
  size: string,
  stock: Map<string, number> | Record<string, number>
): number {
  return Math.max(0, lineAvail(item, size, stock));
}

/** Qty already on other lines for this item (optionally excluding one line). */
export function itemQtyOnLines(
  itemId: string,
  lines: { key?: number; item_id: string; qty: number }[],
  excludeKey?: number
): number {
  return lines
    .filter((l) => l.item_id === itemId && (excludeKey === undefined || l.key !== excludeKey))
    .reduce((s, l) => s + l.qty, 0);
}

/** Max qty for one giveaway line — caps by total item stock shared across sizes/lines. */
export function maxGiveawayLineQty(
  item: StockedItem,
  size: string,
  stock: Map<string, number> | Record<string, number>,
  lines: { key?: number; item_id: string; qty: number }[],
  lineKey?: number
): number {
  const room = totalStock(item, stock) - itemQtyOnLines(item.id, lines, lineKey);
  if (room <= 0) return 0;
  return Math.min(room, maxLineQty(item, size, stock));
}

/** Size-specific bucket qty only (for display). */
export function sizeBucketQty(
  item: StockedItem,
  size: string,
  stock: Map<string, number> | Record<string, number>
): number {
  return qty(stock, stockKey(item.id, size || null));
}
