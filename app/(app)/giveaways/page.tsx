import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Giveaway = { id: string; recipient: string; note: string | null; created_at: string };

export default async function GiveawaysPage() {
  const { data: gs } = await supabase.from("giveaways").select("*").order("created_at", { ascending: false });
  const { data: gi } = await supabase
    .from("giveaway_items")
    .select("giveaway_id, size, qty, items(name, image_url)");

  type Chip = { name: string; image_url: string | null; size: string | null; qty: number };
  const byGiveaway = new Map<string, Chip[]>();
  for (const r of (gi ?? []) as any[]) {
    const chip: Chip = { name: r.items?.name ?? "?", image_url: r.items?.image_url ?? null, size: r.size, qty: r.qty };
    byGiveaway.set(r.giveaway_id, [...(byGiveaway.get(r.giveaway_id) ?? []), chip]);
  }

  const list = (gs ?? []) as Giveaway[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Giveaways</h1>
        <Link href="/giveaways/new"><Button>Give out</Button></Link>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing given out yet.</p>
      ) : (
        <div className="space-y-2">
          {list.map((g) => (
            <div key={g.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{g.recipient}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/giveaways/${g.id}/edit`} className="text-xs text-pink hover:underline">
                    Edit
                  </Link>
                  <span className="text-muted-foreground">{fmtDate(g.created_at)}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(byGiveaway.get(g.id) ?? []).map((c, i) => (
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
              {g.note && <p className="mt-1.5 text-xs text-muted-foreground">{g.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
