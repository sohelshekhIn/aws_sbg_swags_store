"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Card } from "@/components/ui";
import { ItemPicker, type PickerItem, type PickerLine } from "@/components/item-picker";
import { finalizeOrder, saveOrderDraft, updateOrder } from "@/app/(app)/orders/actions";

export type ItemLite = PickerItem;

export function OrderForm({
  items,
  orderId,
  mode = "new",
  initial,
}: {
  items: PickerItem[];
  orderId?: string;
  mode?: "new" | "draft" | "open";
  initial?: { title: string; budget: number; grantedOn: string; note: string; lines: PickerLine[] };
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [budget, setBudget] = useState(initial?.budget ?? 0);
  const [grantedOn, setGrantedOn] = useState(initial?.grantedOn ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [lines, setLines] = useState<PickerLine[]>(initial?.lines ?? []);
  const [pending, startTransition] = useTransition();

  const itemById = (id: string) => items.find((i) => i.id === id);
  const total = lines.reduce((s, l) => s + (itemById(l.item_id)?.points ?? 0) * (l.qty || 0), 0);
  const over = total > budget;
  const expiry = grantedOn
    ? new Date(new Date(grantedOn).getTime() + 30 * 86_400_000).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  function payload() {
    return {
      title: title.trim(),
      points_budget: budget,
      points_granted_on: grantedOn || null,
      note: note || null,
      lines: lines.map((l) => {
        const it = itemById(l.item_id);
        return { item_id: l.item_id, size: it?.has_sizes ? l.size || null : null, qty: l.qty };
      }),
    };
  }

  function saveDraft() {
    startTransition(() => saveOrderDraft(orderId ?? null, payload()));
  }

  function finalize() {
    if (!title.trim() || lines.length === 0) return;
    startTransition(() => finalizeOrder(orderId ?? null, payload()));
  }

  function saveOpen(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || lines.length === 0 || !orderId) return;
    startTransition(() => updateOrder(orderId, payload()));
  }

  const canFinalize = Boolean(title.trim() && lines.length > 0 && !over);

  return (
    <form onSubmit={mode === "open" ? saveOpen : (e) => e.preventDefault()} className="space-y-4">
      <Card className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. March 2026 order"
            required={mode === "open"}
          />
        </div>
        <div>
          <Label>Points budget</Label>
          <Input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
        </div>
        <div>
          <Label>Points granted on</Label>
          <Input type="date" value={grantedOn} onChange={(e) => setGrantedOn(e.target.value)} />
        </div>
        <div>
          <Label>Note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {expiry && <p className="text-xs text-muted-foreground sm:col-span-3">Points expire on {expiry} (30 days).</p>}
      </Card>

      <ItemPicker items={items} lines={lines} setLines={setLines} budget={budget} />

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <p className={`text-sm ${over ? "font-semibold text-destructive" : ""}`}>
          Points used: <span className="font-semibold">{total}</span> / {budget}{" "}
          {budget > 0 && (
            <span className={over ? "" : "text-muted-foreground"}>
              {over ? `— over by ${total - budget}` : `— ${budget - total} left`}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {mode !== "open" && (
            <Button type="button" variant="outline" disabled={pending || over} onClick={saveDraft}>
              {pending ? "Saving…" : "Save draft"}
            </Button>
          )}
          {mode === "open" ? (
            <Button type="submit" disabled={pending || !canFinalize}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          ) : (
            <Button type="button" disabled={pending || !canFinalize} onClick={finalize}>
              {pending ? "Saving…" : "Create final order"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
