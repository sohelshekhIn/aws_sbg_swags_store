"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { maxGiveawayLineQty, totalStock } from "@/lib/inventory";
import { getStockMap, stockKey } from "@/lib/stock";
import { supabase } from "@/lib/supabase";

export type GiveawayLineInput = { item_id: string; size: string | null; qty: number };

async function assertWithinStock(lines: GiveawayLineInput[], giveawayId?: string) {
  const active = lines.filter((l) => l.item_id && l.qty > 0);
  if (active.length === 0) return;

  const stock = Object.fromEntries(await getStockMap());
  if (giveawayId) {
    const { data: existing } = await supabase
      .from("giveaway_items")
      .select("item_id, size, qty")
      .eq("giveaway_id", giveawayId);
    for (const l of existing ?? []) {
      const key = stockKey(l.item_id, l.size);
      stock[key] = (stock[key] ?? 0) + l.qty;
    }
  }

  const ids = [...new Set(active.map((l) => l.item_id))];
  const { data: items } = await supabase.from("items").select("id, name, has_sizes, sizes").in("id", ids);
  const byId = new Map((items ?? []).map((i) => [i.id, i]));

  const keyed = active.map((l, i) => ({ ...l, key: i }));

  const byItem = new Map<string, number>();
  for (const l of active) byItem.set(l.item_id, (byItem.get(l.item_id) ?? 0) + l.qty);

  for (const [itemId, qty] of byItem) {
    const it = byId.get(itemId);
    if (!it) throw new Error("Unknown item");
    const avail = totalStock(it, stock);
    if (qty > avail) {
      throw new Error(`Not enough stock for ${it.name} (requested ${qty}, ${avail} available)`);
    }
  }

  for (const l of keyed) {
    const it = byId.get(l.item_id);
    if (!it) throw new Error("Unknown item");
    const max = maxGiveawayLineQty(it, l.size ?? "", stock, keyed, l.key);
    if (l.qty > max) {
      throw new Error(`Not enough stock for ${it.name}${l.size ? ` (${l.size})` : ""} (requested ${l.qty}, ${max} available)`);
    }
  }
}

export async function createGiveaway(input: {
  recipient: string;
  note: string | null;
  lines: GiveawayLineInput[];
}) {
  await assertWithinStock(input.lines);

  const { data: g, error } = await supabase
    .from("giveaways")
    .insert({ recipient: input.recipient, note: input.note || null })
    .select("id")
    .single();
  if (error || !g) throw new Error(error?.message || "Failed to record giveaway");

  const rows = input.lines
    .filter((l) => l.item_id && l.qty > 0)
    .map((l) => ({ giveaway_id: g.id, item_id: l.item_id, size: l.size, qty: l.qty }));
  if (rows.length) await supabase.from("giveaway_items").insert(rows);

  revalidatePath("/giveaways");
  revalidatePath("/");
  redirect("/giveaways");
}

export async function updateGiveaway(
  id: string,
  input: { recipient: string; note: string | null; lines: GiveawayLineInput[] }
) {
  await assertWithinStock(input.lines, id);

  await supabase
    .from("giveaways")
    .update({ recipient: input.recipient, note: input.note || null })
    .eq("id", id);

  await supabase.from("giveaway_items").delete().eq("giveaway_id", id);
  const rows = input.lines
    .filter((l) => l.item_id && l.qty > 0)
    .map((l) => ({ giveaway_id: id, item_id: l.item_id, size: l.size, qty: l.qty }));
  if (rows.length) await supabase.from("giveaway_items").insert(rows);

  revalidatePath("/giveaways");
  revalidatePath(`/giveaways/${id}`);
  revalidatePath("/");
  redirect("/giveaways");
}

export async function deleteGiveaway(id: string) {
  await supabase.from("giveaways").delete().eq("id", id);
  revalidatePath("/giveaways");
  revalidatePath("/");
  redirect("/giveaways");
}
