"use client";

import { useMemo } from "react";
import { itemQtyOnLines, maxGiveawayLineQty, orderPointsTotal, stockKey, totalStock } from "@/lib/inventory";

export type PickerItem = {
  id: string;
  name: string;
  points: number;
  has_sizes: boolean;
  sizes: string[] | null;
  image_url: string | null;
};

export type PickerLine = { key: number; item_id: string; size: string; qty: number };

/** Tap an item tile to add it; pick size with pills and qty with steppers below. */
export function ItemPicker({
  items,
  lines,
  setLines,
  stock,
  onOrder,
  budget,
  mode = "order",
}: {
  items: PickerItem[];
  lines: PickerLine[];
  setLines: React.Dispatch<React.SetStateAction<PickerLine[]>>;
  stock?: Record<string, number>;
  onOrder?: Record<string, number>;
  budget?: number;
  mode?: "order" | "giveaway";
}) {
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const pointsById = useMemo(() => new Map(items.map((i) => [i.id, i.points])), [items]);
  const showStock = mode === "giveaway" && stock;

  const pointsUsed = (ls: PickerLine[]) => orderPointsTotal(ls, pointsById);

  function maxQtyForLine(l: PickerLine, ls: PickerLine[]): number {
    const it = byId.get(l.item_id);
    if (!it) return 1;
    if (mode === "giveaway" && stock) return maxGiveawayLineQty(it, l.size, stock, ls, l.key);
    if (mode === "order" && budget !== undefined && budget >= 0) {
      const others = pointsUsed(ls.filter((x) => x.key !== l.key));
      const room = budget - others;
      if (room < it.points) return 0;
      return Math.floor(room / it.points);
    }
    return Infinity;
  }

  function canAddItem(it: PickerItem, ls: PickerLine[]): boolean {
    if (mode === "giveaway" && stock) {
      if (itemQtyOnLines(it.id, ls) >= totalStock(it, stock)) return false;
      if (it.has_sizes) return (it.sizes ?? []).some((s) => maxGiveawayLineQty(it, s, stock, ls) > 0);
      return maxGiveawayLineQty(it, "", stock, ls) > 0;
    }
    if (mode === "order" && budget !== undefined) {
      return pointsUsed(ls) + it.points <= budget;
    }
    return true;
  }

  function firstInStockSize(it: PickerItem, ls: PickerLine[]): string {
    if (!it.has_sizes || !stock) return "";
    for (const s of it.sizes ?? []) {
      if (maxGiveawayLineQty(it, s, stock, ls) > 0) return s;
    }
    return it.sizes?.[0] ?? "";
  }

  function addItem(it: PickerItem) {
    setLines((ls) => {
      if (!canAddItem(it, ls)) return ls;
      if (!it.has_sizes) {
        const ex = ls.find((l) => l.item_id === it.id);
        if (ex) {
          const max = maxQtyForLine(ex, ls);
          if (ex.qty >= max) return ls;
          return ls.map((l) => (l === ex ? { ...l, qty: l.qty + 1 } : l));
        }
      }
      const size = it.has_sizes ? firstInStockSize(it, ls) : "";
      const draft = { key: Date.now() + Math.random(), item_id: it.id, size, qty: 1 };
      const max = maxQtyForLine(draft, [...ls, draft]);
      if (mode === "giveaway" && stock && max <= 0) return ls;
      return [...ls, draft];
    });
  }

  const patch = (key: number, p: Partial<PickerLine>) =>
    setLines((ls) =>
      ls.map((l) => {
        if (l.key !== key) return l;
        let next = { ...l, ...p };
        const it = byId.get(next.item_id);
        if (!it) return next;
        if (p.size !== undefined && p.size !== l.size && p.qty === undefined) next.qty = 1;
        const updated = ls.map((x) => (x.key === key ? next : x));
        const max = maxQtyForLine(next, updated);
        if (Number.isFinite(max) && max > 0) {
          next.qty = Math.min(Math.max(1, p.qty ?? next.qty), max);
        }
        return next;
      })
    );

  const remove = (key: number) => setLines((ls) => ls.filter((l) => l.key !== key));

  const availOf = (l: PickerLine) => {
    const it = byId.get(l.item_id);
    if (!it || !stock) return null;
    return totalStock(it, stock) - itemQtyOnLines(it.id, lines, l.key);
  };

  const sizeQty = (it: PickerItem, size: string | null) => (stock ? (stock[stockKey(it.id, size)] ?? 0) : 0);

  const giveawayTileStock = (it: PickerItem) => {
    if (!stock) return null;
    if (it.has_sizes && it.sizes?.length) {
      const legacy = sizeQty(it, null);
      return (
        <div className="mt-0.5 flex flex-wrap gap-0.5">
          {legacy > 0 && (
            <span className="rounded border border-border px-1 py-px text-[10px] font-semibold text-success">— {legacy}</span>
          )}
          {it.sizes.map((s) => {
            const q = sizeQty(it, s);
            return (
              <span
                key={s}
                className={`rounded border px-1 py-px text-[10px] font-semibold ${
                  q > 0 ? "border-border text-success" : "border-border/60 text-muted-foreground"
                }`}
              >
                {s} {q}
              </span>
            );
          })}
        </div>
      );
    }
    const n = totalStock(it, stock);
    return (
      <div className={`mt-0.5 text-xs font-semibold ${n > 0 ? "text-success" : "text-destructive"}`}>{n} in stock</div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((it) => {
          const count = lines.filter((l) => l.item_id === it.id).reduce((s, l) => s + l.qty, 0);
          const blocked = !canAddItem(it, lines);
          return (
            <button
              type="button"
              key={it.id}
              onClick={() => addItem(it)}
              disabled={blocked}
              className={`relative rounded-lg border border-border bg-card p-2 text-left transition hover:border-pink disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {count > 0 && (
                <span className="absolute right-1.5 top-1.5 z-10 grid h-5 min-w-5 place-items-center rounded-full bg-pink px-1 text-xs font-bold text-[var(--background)]">
                  {count}
                </span>
              )}
              <div className="mb-2 aspect-square overflow-hidden rounded-md">
                {it.image_url ? (
                  <img src={it.image_url} alt={it.name} className="item-img h-full w-full" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">—</div>
                )}
              </div>
              <div className="line-clamp-2 text-xs leading-tight">{it.name}</div>
              {showStock ? (
                giveawayTileStock(it)
              ) : (
                <div className="mt-0.5 text-xs font-semibold text-yellow">{it.points} pts</div>
              )}
            </button>
          );
        })}
      </div>

      {lines.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border p-2">
          {lines.map((l) => {
            const it = byId.get(l.item_id);
            if (!it) return null;
            const a = availOf(l);
            const maxQ = maxQtyForLine(l, lines);
            const atMax = maxQ <= 0 || l.qty >= maxQ;
            const short = Number.isFinite(maxQ) && l.qty > maxQ;
            return (
              <div key={l.key} className="flex items-center gap-3 rounded-md bg-card p-2">
                {it.image_url ? (
                  <img src={it.image_url} alt="" className="item-img h-11 w-11 shrink-0 rounded" />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{it.name}</div>
                  {it.has_sizes && it.sizes && mode === "giveaway" && stock && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {it.sizes.map((s) => {
                        const bucket = sizeQty(it, s);
                        const maxForSize = maxGiveawayLineQty(it, s, stock, lines, l.key);
                        const active = l.size === s;
                        return (
                          <button
                            type="button"
                            key={s}
                            disabled={maxForSize <= 0}
                            onClick={() => patch(l.key, { size: s })}
                            className={
                              active
                                ? "rounded bg-pink px-2 py-0.5 text-xs font-semibold text-[var(--background)]"
                                : maxForSize <= 0
                                  ? "cursor-not-allowed rounded border border-border px-2 py-0.5 text-xs text-muted-foreground opacity-40"
                                  : "rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                            }
                          >
                            {s} <span className={active ? "opacity-90" : "text-success"}>({bucket})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {it.has_sizes && it.sizes && mode !== "giveaway" && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {it.sizes.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => patch(l.key, { size: s })}
                          className={
                            l.size === s
                              ? "rounded bg-pink px-2 py-0.5 text-xs font-semibold text-[var(--background)]"
                              : "rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {mode === "giveaway" && a !== null && (
                    <div className={`mt-0.5 text-xs ${short ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                      {a} left for this item{short ? " — not enough" : ""}
                    </div>
                  )}
                  {mode === "order" && budget !== undefined && (
                    <div className="mt-0.5 text-xs text-muted-foreground">max {maxQ} at {it.points} pts each</div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={maxQ <= 0}
                    onClick={() => patch(l.key, { qty: Math.max(1, l.qty - 1) })}
                    className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    key={`${l.key}-${l.size}`}
                    type="number"
                    min={1}
                    max={maxQ > 0 ? maxQ : undefined}
                    disabled={maxQ <= 0}
                    value={l.qty}
                    onChange={(e) => patch(l.key, { qty: Math.max(1, Number(e.target.value) || 1) })}
                    className="h-7 w-12 rounded border border-border bg-[var(--input)] text-center text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <button
                    type="button"
                    disabled={atMax}
                    onClick={() => patch(l.key, { qty: l.qty + 1 })}
                    className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button type="button" onClick={() => remove(l.key)} className="px-1 text-muted-foreground hover:text-destructive">✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
