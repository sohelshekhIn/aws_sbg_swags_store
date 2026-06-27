"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Item } from "@/lib/supabase";
import { itemsAvailable, itemsInStock, stockKey, totalStock, type StockView } from "@/lib/inventory";
import { Button, Pill } from "@/components/ui";

const LOW = 5;

function level(qty: number) {
  if (qty <= 0) return "out";
  if (qty <= LOW) return "low";
  return "ok";
}
const qtyText = { out: "text-destructive", low: "text-yellow", ok: "text-success" } as const;
const chip = {
  out: "border-destructive/40 bg-destructive/10 text-destructive",
  low: "border-yellow/40 bg-yellow/10 text-yellow",
  ok: "border-border bg-muted text-foreground",
} as const;

export function StockGrid({
  items,
  stock,
  onOrder,
}: {
  items: Item[];
  stock: Record<string, number>;
  onOrder: Record<string, number>;
}) {
  const [view, setView] = useState<StockView>("stock");
  const unitsInStock = useMemo(() => Object.values(stock).reduce((s, n) => s + n, 0), [stock]);
  const list = useMemo(
    () => (view === "stock" ? itemsInStock(items, stock) : itemsAvailable(items, stock, onOrder)),
    [view, items, stock, onOrder]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Current stock</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} shown · {unitsInStock} units in stock
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders/new"><Button variant="outline">+ New order</Button></Link>
          <Link href="/giveaways/new"><Button>Give out</Button></Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView("stock")}
          className={
            view === "stock"
              ? "rounded-md bg-pink px-3 py-1.5 text-xs font-semibold text-[var(--background)]"
              : "rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          }
        >
          In stock
        </button>
        <button
          type="button"
          onClick={() => setView("all")}
          className={
            view === "all"
              ? "rounded-md bg-pink px-3 py-1.5 text-xs font-semibold text-[var(--background)]"
              : "rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          }
        >
          Received + on order
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {items.length === 0 ? (
            <>
              No items yet. Add some on the <Link className="text-pink underline" href="/items">Items</Link> page.
            </>
          ) : view === "stock" ? (
            "Nothing in stock right now."
          ) : (
            "Nothing in stock or on open orders right now."
          )}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {list.map((item) => {
            const sized = item.has_sizes && item.sizes?.length;
            const inStock = totalStock(item, stock);
            const pending = totalStock(item, onOrder);
            const legacy = stock[stockKey(item.id, null)] ?? 0;
            const sizes = sized
              ? item.sizes!.filter(
                  (sz) =>
                    (stock[stockKey(item.id, sz)] ?? 0) > 0 || (onOrder[stockKey(item.id, sz)] ?? 0) > 0
                )
              : [];
            return (
              <div key={item.id} className="flex flex-col rounded-lg border border-border bg-card p-2.5">
                <div className="mb-2 aspect-square overflow-hidden rounded-md">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="item-img h-full w-full" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">—</div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm leading-tight">{item.name}</span>
                  <Pill>{item.points}p</Pill>
                </div>
                <div className="mt-2 space-y-1">
                  {sized ? (
                    <div className="flex flex-wrap gap-1">
                      {legacy > 0 && (
                        <span className={`rounded border px-1.5 py-0.5 text-[11px] ${chip[level(legacy)]}`}>
                          — {legacy}
                        </span>
                      )}
                      {sizes.map((sz) => {
                        const q = stock[stockKey(item.id, sz)] ?? 0;
                        const o = onOrder[stockKey(item.id, sz)] ?? 0;
                        return (
                          <span key={sz} className={`rounded border px-1.5 py-0.5 text-[11px] ${chip[level(q)]}`}>
                            {sz} {q}
                            {view === "all" && o > 0 && q === 0 && (
                              <span className="text-yellow"> (+{o} ordered)</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      {inStock > 0 && (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-bold ${qtyText[level(inStock)]}`}>{inStock}</span>
                          <span className="text-xs text-muted-foreground">in stock</span>
                        </div>
                      )}
                      {view === "all" && pending > 0 && (
                        <div className="text-xs text-yellow">
                          {inStock > 0 ? "+" : ""}
                          {pending} on open order{pending !== 1 ? "s" : ""}
                          {inStock === 0 && " — receive to add to stock"}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
