import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { OrderForm, type ItemLite } from "@/components/order-form";
import type { PickerLine } from "@/components/item-picker";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();
  if (order.status === "received") redirect(`/orders/${id}`);

  const { data: existingLines } = await supabase
    .from("order_items")
    .select("item_id, size, qty_ordered")
    .eq("order_id", id);

  const existingItemIds = [...new Set((existingLines ?? []).map((l) => l.item_id))];
  const itemFilter =
    existingItemIds.length > 0
      ? `active.eq.true,id.in.(${existingItemIds.join(",")})`
      : "active.eq.true";
  const { data: items } = await supabase
    .from("items")
    .select("id,name,points,has_sizes,sizes,image_url")
    .or(itemFilter)
    .order("points", { ascending: false });

  const initialLines: PickerLine[] = (existingLines ?? []).map((l, i) => ({
    key: i,
    item_id: l.item_id,
    size: l.size ?? "",
    qty: l.qty_ordered,
  }));

  return (
    <div className="space-y-4">
      <Link href={`/orders/${id}`} className="text-sm text-muted-foreground hover:underline">
        ← {order.title}
      </Link>
      <h1 className="text-xl font-semibold">
        {order.status === "draft" ? "Draft order" : "Edit order"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {order.status === "draft"
          ? "Save your progress as a draft, then create the final order when ready."
          : "Change items, budget, or dates before receiving."}
      </p>
      <OrderForm
        items={(items ?? []) as ItemLite[]}
        orderId={id}
        mode={order.status === "draft" ? "draft" : "open"}
        initial={{
          title: order.title,
          budget: order.points_budget,
          grantedOn: order.points_granted_on ?? "",
          note: order.note ?? "",
          lines: initialLines,
        }}
      />
    </div>
  );
}
