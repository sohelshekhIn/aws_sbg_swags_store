"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Card } from "@/components/ui";
import { ItemPicker, type PickerItem, type PickerLine } from "@/components/item-picker";
import { createGiveaway, updateGiveaway } from "@/app/(app)/giveaways/actions";
import { maxGiveawayLineQty, totalStock } from "@/lib/inventory";

export function GiveawayForm({
  items,
  stock,
  giveawayId,
  initial,
}: {
  items: PickerItem[];
  stock: Record<string, number>;
  giveawayId?: string;
  initial?: { recipient: string; note: string; lines: PickerLine[] };
}) {
  const [recipient, setRecipient] = useState(initial?.recipient ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [lines, setLines] = useState<PickerLine[]>(initial?.lines ?? []);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(giveawayId);

  const itemById = (id: string) => items.find((i) => i.id === id);
  const overStock = (() => {
    const byItem = new Map<string, number>();
    for (const l of lines) byItem.set(l.item_id, (byItem.get(l.item_id) ?? 0) + l.qty);
    for (const [id, qty] of byItem) {
      const it = itemById(id);
      if (it && qty > totalStock(it, stock)) return true;
    }
    const keyed = lines.map((l, i) => ({ ...l, key: l.key ?? i }));
    return keyed.some((l) => {
      const it = itemById(l.item_id);
      if (!it) return false;
      return l.qty > maxGiveawayLineQty(it, l.size, stock, keyed, l.key);
    });
  })();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim() || lines.length === 0 || overStock) return;
    const payload = {
      recipient: recipient.trim(),
      note: note || null,
      lines: lines.map((l) => {
        const it = itemById(l.item_id);
        return { item_id: l.item_id, size: it?.has_sizes ? l.size || null : null, qty: l.qty };
      }),
    };
    startTransition(() =>
      editing ? updateGiveaway(giveawayId!, payload) : createGiveaway(payload)
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Recipient</Label>
          <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Name" required />
        </div>
        <div>
          <Label>Note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. event, reason" />
        </div>
      </Card>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing in stock to give out right now.</p>
      ) : (
        <ItemPicker items={items} lines={lines} setLines={setLines} stock={stock} mode="giveaway" />
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {lines.reduce((s, l) => s + l.qty, 0)} item(s) selected
        </p>
        <Button type="submit" disabled={pending || lines.length === 0 || overStock}>
          {pending ? "Saving…" : editing ? "Save changes" : "Record giveaway"}
        </Button>
      </div>
    </form>
  );
}
