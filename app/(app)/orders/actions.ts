"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lineAvail, orderPointsTotal } from "@/lib/inventory";
import { getStockMap, stockKey } from "@/lib/stock";
import { supabase } from "@/lib/supabase";

export type OrderLineInput = { item_id: string; size: string | null; qty: number };

type OrderInput = {
  title: string;
  points_budget: number;
  points_granted_on: string | null;
  note: string | null;
  lines: OrderLineInput[];
};

function lineRows(orderId: string, lines: OrderLineInput[]) {
  return lines
    .filter((l) => l.item_id && l.qty > 0)
    .map((l) => ({ order_id: orderId, item_id: l.item_id, size: l.size, qty_ordered: l.qty }));
}

async function replaceLines(orderId: string, lines: OrderLineInput[]) {
  await supabase.from("order_items").delete().eq("order_id", orderId);
  const rows = lineRows(orderId, lines);
  if (rows.length) await supabase.from("order_items").insert(rows);
}

function header(input: OrderInput, title: string) {
  return {
    title,
    points_budget: input.points_budget,
    points_granted_on: input.points_granted_on || null,
    note: input.note || null,
  };
}

async function assertWithinBudget(lines: OrderLineInput[], budget: number) {
  const ids = [...new Set(lines.filter((l) => l.qty > 0).map((l) => l.item_id))];
  if (ids.length === 0) return;
  const { data: items } = await supabase.from("items").select("id, points").in("id", ids);
  const points = new Map((items ?? []).map((i) => [i.id, i.points]));
  const total = orderPointsTotal(lines, points);
  if (total > budget) throw new Error(`Order exceeds budget by ${total - budget} points`);
}

/** Save work-in-progress without submitting the order. */
export async function saveOrderDraft(id: string | null, input: OrderInput) {
  await assertWithinBudget(input.lines, input.points_budget);
  const title = input.title.trim() || "Untitled draft";
  let orderId = id;

  if (orderId) {
    const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single();
    if (!order || order.status !== "draft") throw new Error("Only drafts can be saved this way");
    await supabase.from("orders").update(header(input, title)).eq("id", orderId);
  } else {
    const { data: order, error } = await supabase
      .from("orders")
      .insert({ ...header(input, title), status: "draft" })
      .select("id")
      .single();
    if (error || !order) throw new Error(error?.message || "Failed to save draft");
    orderId = order.id;
  }

  if (!orderId) throw new Error("Failed to save draft");
  await replaceLines(orderId, input.lines);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}/edit`);
  redirect(`/orders/${orderId}/edit`);
}

/** Promote a draft (or create fresh) into a real open order. */
export async function finalizeOrder(id: string | null, input: OrderInput) {
  if (!input.title.trim()) throw new Error("Title is required");
  if (!input.lines.some((l) => l.item_id && l.qty > 0)) throw new Error("Add at least one item");
  await assertWithinBudget(input.lines, input.points_budget);

  const title = input.title.trim();
  let orderId = id;

  if (orderId) {
    const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single();
    if (!order || order.status !== "draft") throw new Error("Only drafts can be finalized");
    await supabase.from("orders").update({ ...header(input, title), status: "open" }).eq("id", orderId);
  } else {
    const { data: order, error } = await supabase
      .from("orders")
      .insert({ ...header(input, title), status: "open" })
      .select("id")
      .single();
    if (error || !order) throw new Error(error?.message || "Failed to create order");
    orderId = order.id;
  }

  if (!orderId) throw new Error("Failed to create order");
  await replaceLines(orderId, input.lines);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}

export async function updateOrder(id: string, input: OrderInput) {
  const { data: order } = await supabase.from("orders").select("status").eq("id", id).single();
  if (!order || order.status !== "open") throw new Error("Only open orders can be edited");

  if (!input.title.trim()) throw new Error("Title is required");
  if (!input.lines.some((l) => l.item_id && l.qty > 0)) throw new Error("Add at least one item");
  await assertWithinBudget(input.lines, input.points_budget);

  await supabase.from("orders").update(header(input, input.title.trim())).eq("id", id);
  await replaceLines(id, input.lines);

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  redirect(`/orders/${id}`);
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
