import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getStockMap, itemsInStock, stockKey } from "@/lib/stock";
import { GiveawayForm } from "@/components/giveaway-form";
import type { ItemLite } from "@/components/order-form";
import type { PickerLine } from "@/components/item-picker";

export const dynamic = "force-dynamic";

export default async function EditGiveawayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: giveaway } = await supabase.from("giveaways").select("*").eq("id", id).single();
  if (!giveaway) notFound();

  const { data: existingLines } = await supabase
    .from("giveaway_items")
    .select("item_id, size, qty")
    .eq("giveaway_id", id);

  const existingItemIds = [...new Set((existingLines ?? []).map((l) => l.item_id))];
  const itemFilter =
    existingItemIds.length > 0
      ? `active.eq.true,id.in.(${existingItemIds.join(",")})`
      : "active.eq.true";
  const { data: items } = await supabase
    .from("items")
    .select("id,name,points,has_sizes,sizes,image_url")
    .or(itemFilter)
    .order("name");

  const stock = Object.fromEntries(await getStockMap());
  for (const l of existingLines ?? []) {
    const key = stockKey(l.item_id, l.size);
    stock[key] = (stock[key] ?? 0) + l.qty;
  }

  const inStock = itemsInStock((items ?? []) as ItemLite[], stock, existingItemIds);

  const initialLines: PickerLine[] = (existingLines ?? []).map((l, i) => ({
    key: i,
    item_id: l.item_id,
    size: l.size ?? "",
    qty: l.qty,
  }));

  return (
    <div className="space-y-4">
      <Link href="/giveaways" className="text-sm text-muted-foreground hover:underline">
        ← Giveaways
      </Link>
      <h1 className="text-xl font-semibold">Edit giveaway — {giveaway.recipient}</h1>
      <p className="text-sm text-muted-foreground">
        Add extra items or adjust quantities, then save.
      </p>
      <GiveawayForm
        items={inStock}
        stock={stock}
        giveawayId={id}
        initial={{
          recipient: giveaway.recipient,
          note: giveaway.note ?? "",
          lines: initialLines,
        }}
      />
    </div>
  );
}
