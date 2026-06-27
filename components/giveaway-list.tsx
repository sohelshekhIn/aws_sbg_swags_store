"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export type GiveawayItem = {
  name: string;
  image_url: string | null;
  size: string | null;
  qty: number;
};

export type GiveawayRow = {
  id: string;
  recipient: string;
  note: string | null;
  created_at: string;
  items: GiveawayItem[];
};

function totalQty(items: GiveawayItem[]) {
  return items.reduce((s, i) => s + i.qty, 0);
}

function GiveawaySidebar({ g, onClose }: { g: GiveawayRow; onClose: () => void }) {
  const units = totalQty(g.items);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="giveaway-sidebar-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Giveaway</p>
            <h2 id="giveaway-sidebar-title" className="truncate text-lg font-semibold">
              {g.recipient}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{fmtDate(g.created_at)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {g.note && (
            <p className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">{g.note}</p>
          )}

          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Items given out</h3>
            <span className="text-sm font-semibold text-pink">
              {units} unit{units === 1 ? "" : "s"}
            </span>
          </div>

          <ul className="space-y-2">
            {g.items.map((item, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="item-img h-14 w-14 shrink-0 rounded-md" />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">—</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.name}</div>
                  {item.size && (
                    <span className="mt-0.5 inline-block rounded border border-border px-1.5 py-px text-[10px] font-semibold uppercase text-muted-foreground">
                      {item.size}
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold text-pink">{item.qty}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">qty</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 border-t border-border px-4 py-3">
          <Link href={`/giveaways/${g.id}/edit`} className="flex-1">
            <Button variant="outline" className="w-full">
              Edit giveaway
            </Button>
          </Link>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </aside>
    </div>
  );
}

export function GiveawayList({ giveaways }: { giveaways: GiveawayRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const selected = useMemo(() => giveaways.find((g) => g.id === openId) ?? null, [giveaways, openId]);

  if (giveaways.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing given out yet.</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {giveaways.map((g) => {
          const units = totalQty(g.items);
          return (
            <div key={g.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId(g.id)}
                  className="min-w-0 text-left font-semibold hover:text-pink"
                >
                  {g.recipient}
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(g.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View
                  </button>
                  <Link href={`/giveaways/${g.id}/edit`} className="text-xs text-pink hover:underline">
                    Edit
                  </Link>
                  <span className="text-muted-foreground">{fmtDate(g.created_at)}</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {units} item{units === 1 ? "" : "s"} given out
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {g.items.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted py-0.5 pl-0.5 pr-2 text-xs">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="item-img h-5 w-5 rounded-full" />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-background" />
                    )}
                    <span className="font-semibold text-pink">{c.qty}×</span> {c.name}
                    {c.size ? ` (${c.size})` : ""}
                  </span>
                ))}
              </div>
              {g.note && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{g.note}</p>}
            </div>
          );
        })}
      </div>

      {selected && <GiveawaySidebar g={selected} onClose={close} />}
    </>
  );
}
