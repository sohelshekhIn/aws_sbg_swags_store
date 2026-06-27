"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type OrderLineInput = { item_id: string; size: string | null; qty: number };

export async function createOrder(input: {
  title: string;
  points_budget: number;
  points_granted_on: string | null;
  note: string | null;
  lines: OrderLineInput[];
}) {
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      title: input.title,
      points_budget: input.points_budget,
      points_granted_on: input.points_granted_on || null,
      note: input.note || null,
    })
    .select("id")
    .single();
  if (error || !order) throw new Error(error?.message || "Failed to create order");

  const rows = input.lines
    .filter((l) => l.item_id && l.qty > 0)
    .map((l) => ({ order_id: order.id, item_id: l.item_id, size: l.size, qty_ordered: l.qty }));
  if (rows.length) await supabase.from("order_items").insert(rows);

  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}

export async function receiveOrder(
  orderId: string,
  received: { id: string; qty_received: number }[]
) {
  await Promise.all(
    received.map((r) =>
      supabase.from("order_items").update({ qty_received: r.qty_received }).eq("id", r.id)
    )
  );
  await supabase.from("orders").update({ status: "received" }).eq("id", orderId);

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/");
  redirect(`/orders/${orderId}`);
}
