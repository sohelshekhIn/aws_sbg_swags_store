import Link from "next/link";
import { supabase, type Item } from "@/lib/supabase";
import { getStockMap, itemsInStock, stockKey, totalStock } from "@/lib/stock";
import { Button, Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

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

export default async function StockPage() {
  const { data: items } = await supabase.from("items").select("*").eq("active", true).order("points", { ascending: false });
  const stock = await getStockMap();
  const all = (items ?? []) as Item[];
  const list = itemsInStock(all, stock);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Current stock</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} in stock
            {all.length > list.length && (
              <span> · {all.length - list.length} out of stock hidden</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders/new"><Button variant="outline">+ New order</Button></Link>
          <Link href="/giveaways/new"><Button>Give out</Button></Link>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {all.length === 0 ? (
            <>
              No items yet. Add some on the <Link className="text-pink underline" href="/items">Items</Link> page.
            </>
          ) : (
            "Nothing in stock right now."
          )}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {list.map((item) => {
            const sized = item.has_sizes && item.sizes?.length;
            const total = totalStock(item, stock);
            const sizes = sized ? item.sizes!.filter((sz) => (stock.get(stockKey(item.id, sz)) ?? 0) > 0) : [];
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

                <div className="mt-2">
                  {sized ? (
                    <div className="flex flex-wrap gap-1">
                      {sizes.map((sz) => {
                        const q = stock.get(stockKey(item.id, sz)) ?? 0;
                        return (
                          <span key={sz} className={`rounded border px-1.5 py-0.5 text-[11px] ${chip[level(q)]}`}>
                            {sz} {q}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold ${qtyText[level(total)]}`}>{total}</span>
                      <span className="text-xs text-muted-foreground">in stock</span>
                    </div>
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
