"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type GiveawayLineInput = { item_id: string; size: string | null; qty: number };

export async function createGiveaway(input: {
  recipient: string;
  note: string | null;
  lines: GiveawayLineInput[];
}) {
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
  await supabase
    .from("giveaways")
    .update({ recipient: input.recipient, note: input.note || null })
    .eq("id", id);

  // Replace the line items wholesale — stock is derived from them, so this
  // recomputes inventory correctly whether items were added, edited, or removed.
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
