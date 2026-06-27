"use client";

import { useMemo } from "react";

export type PickerItem = {
  id: string;
  name: string;
  points: number;
  has_sizes: boolean;
  sizes: string[] | null;
  image_url: string | null;
};

export type PickerLine = { key: number; item_id: string; size: string; qty: number };

/** Tap an item tile to add it; pick size with pills and qty with steppers below.
 *  Pass `stock` (item_id|size → qty) to show availability and flag shortfalls. */
export function ItemPicker({
  items,
  lines,
  setLines,
  stock,
}: {
  items: PickerItem[];
  lines: PickerLine[];
  setLines: React.Dispatch<React.SetStateAction<PickerLine[]>>;
  stock?: Record<string, number>;
}) {
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  function addItem(it: PickerItem) {
    setLines((ls) => {
      if (!it.has_sizes) {
        const ex = ls.find((l) => l.item_id === it.id);
        if (ex) return ls.map((l) => (l === ex ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...ls, { key: Date.now() + Math.random(), item_id: it.id, size: it.has_sizes ? it.sizes?.[0] ?? "" : "", qty: 1 }];
    });
  }
  const patch = (key: number, p: Partial<PickerLine>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const remove = (key: number) => setLines((ls) => ls.filter((l) => l.key !== key));
  const availOf = (l: PickerLine) => {
    const it = byId.get(l.item_id);
    if (!it || !stock) return null;
    return stock[`${it.id}|${it.has_sizes ? l.size : ""}`] ?? 0;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((it) => {
          const count = lines.filter((l) => l.item_id === it.id).reduce((s, l) => s + l.qty, 0);
          return (
            <button
              type="button"
              key={it.id}
              onClick={() => addItem(it)}
              className="relative rounded-lg border border-border bg-card p-2 text-left transition hover:border-pink"
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
              <div className="mt-0.5 text-xs font-semibold text-yellow">{it.points} pts</div>
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
            const short = a !== null && l.qty > a;
            return (
              <div key={l.key} className="flex items-center gap-3 rounded-md bg-card p-2">
                {it.image_url ? (
                  <img src={it.image_url} alt="" className="item-img h-11 w-11 shrink-0 rounded" />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{it.name}</div>
                  {it.has_sizes && it.sizes && (
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
                  {a !== null && (
                    <div className={`mt-0.5 text-xs ${short ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                      {a} in stock{short ? " — not enough" : ""}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => patch(l.key, { qty: Math.max(1, l.qty - 1) })} className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-muted">−</button>
                  <input
                    type="number"
                    min={1}
                    value={l.qty}
                    onChange={(e) => patch(l.key, { qty: Math.max(1, Number(e.target.value) || 1) })}
                    className="h-7 w-12 rounded border border-border bg-[var(--input)] text-center text-sm text-foreground"
                  />
                  <button type="button" onClick={() => patch(l.key, { qty: l.qty + 1 })} className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-muted">+</button>
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
