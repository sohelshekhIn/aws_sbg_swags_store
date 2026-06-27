"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { receiveOrder } from "@/app/(app)/orders/actions";

export type ReceiveLine = {
  id: string;
  name: string;
  size: string | null;
  qty_ordered: number;
  points: number;
  image_url: string | null;
};

export function ReceiveForm({
  orderId,
  budget,
  lines,
}: {
  orderId: string;
  budget: number;
  lines: ReceiveLine[];
}) {
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(lines.map((l) => [l.id, l.qty_ordered]))
  );
  const [pending, startTransition] = useTransition();

  const total = lines.reduce((s, l) => s + (qty[l.id] ?? 0) * l.points, 0);
  const over = total > budget;
  const markAll = () => setQty(Object.fromEntries(lines.map((l) => [l.id, l.qty_ordered])));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() =>
      receiveOrder(orderId, lines.map((l) => ({ id: l.id, qty_received: qty[l.id] ?? 0 })))
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
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
                  {l.image_url && <img src={l.image_url} alt="" className="item-img h-8 w-8 rounded" />}
                  {l.name}
                </span>
              </td>
              <td className="py-2 text-muted-foreground">{l.size ?? "—"}</td>
              <td className="py-2 text-right text-muted-foreground">{l.qty_ordered}</td>
              <td className="py-2 text-right">
                <Input
                  type="number"
                  min={0}
                  value={qty[l.id] ?? 0}
                  onChange={(e) => setQty((q) => ({ ...q, [l.id]: Number(e.target.value) }))}
                  className="ml-auto w-20 text-right"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t pt-3">
        <p className={`text-sm ${over ? "text-destructive font-semibold" : ""}`}>
          Points used: {total} / {budget}{" "}
          {budget > 0 && (over ? `— over by ${total - budget}` : `— ${budget - total} left`)}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={markAll}>Mark all received</Button>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Receive & add to stock"}</Button>
        </div>
      </div>
    </form>
  );
}
