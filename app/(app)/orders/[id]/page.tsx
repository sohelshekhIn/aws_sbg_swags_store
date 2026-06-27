import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui";
import { ReceiveForm, type ReceiveLine } from "@/components/receive-form";
import { expiryDate, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  const { data: rawLines } = await supabase
    .from("order_items")
    .select("id, size, qty_ordered, qty_received, items(name, points, image_url)")
    .eq("order_id", id);
  const lines = (rawLines ?? []) as any[];

  const received = order.status === "received";
  const lineQty = (l: any) => (received ? l.qty_received ?? 0 : l.qty_ordered);
  const total = lines.reduce((s, l) => s + lineQty(l) * (l.items?.points ?? 0), 0);
  const over = total > order.points_budget;

  return (
    <div className="space-y-4">
      <Link href="/orders" className="text-sm text-muted-foreground hover:underline">← Orders</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{order.title}</h1>
        <span className={received ? "text-[var(--success)]" : "text-muted-foreground"}>
          {received ? "Received" : "Open"}
        </span>
      </div>

      <Card className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
        <span>Budget: <b>{order.points_budget}</b></span>
        <span className={over ? "text-destructive font-semibold" : ""}>
          Points {received ? "used" : "ordered"}: {total}{" "}
          {order.points_budget > 0 && (over ? `(over ${total - order.points_budget})` : `(${order.points_budget - total} left)`)}
        </span>
        <span>Granted: {fmtDate(order.points_granted_on)}</span>
        <span>Expires: {fmtDate(expiryDate(order.points_granted_on))}</span>
      </Card>
      {order.note && <p className="text-sm text-muted-foreground">{order.note}</p>}

      {received ? (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-2">Item</th>
              <th className="py-2">Size</th>
              <th className="py-2 text-right">Ordered</th>
              <th className="py-2 text-right">Received</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    {l.items?.image_url && <img src={l.items.image_url} alt="" className="item-img h-8 w-8 rounded" />}
                    {l.items?.name}
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">{l.size ?? "—"}</td>
                <td className="py-2 text-right text-muted-foreground">{l.qty_ordered}</td>
                <td className="py-2 text-right">{l.qty_received ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ReceiveForm
          orderId={order.id}
          budget={order.points_budget}
          lines={lines.map<ReceiveLine>((l) => ({
            id: l.id,
            name: l.items?.name ?? "?",
            size: l.size,
            qty_ordered: l.qty_ordered,
            points: l.items?.points ?? 0,
            image_url: l.items?.image_url ?? null,
          }))}
        />
      )}
    </div>
  );
}
