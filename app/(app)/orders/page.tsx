import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui";
import { expiryDate, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  title: string;
  points_budget: number;
  points_granted_on: string | null;
  status: string;
  created_at: string;
};

export default async function OrdersPage() {
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  const { data: lines } = await supabase
    .from("order_items")
    .select("order_id, qty_ordered, qty_received, items(points)");

  const list = (orders ?? []) as Order[];
  const used: Record<string, number> = {};
  for (const o of list) used[o.id] = 0;
  for (const l of (lines ?? []) as any[]) {
    const o = list.find((x) => x.id === l.order_id);
    if (!o) continue;
    const qty = o.status === "received" ? l.qty_received ?? 0 : l.qty_ordered;
    used[o.id] += qty * (l.items?.points ?? 0);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <Link href="/orders/new"><Button>+ New order</Button></Link>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-2">Order</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Points</th>
              <th className="py-2">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const u = used[o.id] ?? 0;
              const over = u > o.points_budget;
              return (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Link href={`/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">
                      {o.title}
                    </Link>
                  </td>
                  <td className="py-2">
                    <span className={o.status === "received" ? "text-[var(--success)]" : "text-muted-foreground"}>
                      {o.status === "received" ? "Received" : "Open"}
                    </span>
                  </td>
                  <td className={`py-2 text-right ${over ? "text-destructive font-semibold" : ""}`}>
                    {u} / {o.points_budget}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {over ? `(over ${u - o.points_budget})` : `(${o.points_budget - u} left)`}
                    </span>
                  </td>
                  <td className="py-2 text-muted-foreground">{fmtDate(expiryDate(o.points_granted_on))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
