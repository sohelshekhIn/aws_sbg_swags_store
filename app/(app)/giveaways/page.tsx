import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui";
import { GiveawayList, type GiveawayRow } from "@/components/giveaway-list";

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

  const giveaways: GiveawayRow[] = ((gs ?? []) as Giveaway[]).map((g) => ({
    id: g.id,
    recipient: g.recipient,
    note: g.note,
    created_at: g.created_at,
    items: byGiveaway.get(g.id) ?? [],
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Giveaways</h1>
        <Link href="/giveaways/new"><Button>Give out</Button></Link>
      </div>

      <GiveawayList giveaways={giveaways} />
    </div>
  );
}
