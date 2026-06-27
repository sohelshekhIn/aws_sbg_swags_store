import { supabase, type Item } from "@/lib/supabase";
import { Button, Input, Label, Card } from "@/components/ui";
import { createItem, updateItem } from "./actions";

export const dynamic = "force-dynamic";

const ROW = "grid grid-cols-[44px_minmax(150px,2fr)_70px_minmax(120px,1.4fr)_minmax(150px,1.4fr)_56px_56px_72px] items-center gap-3";

export default async function ItemsPage() {
  const { data: items } = await supabase.from("items").select("*").order("points", { ascending: false });
  const list = (items as Item[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">Items</h1>
        <span className="text-sm text-muted-foreground">{list.length} items</span>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Add item</h2>
        <form action={createItem} className="grid grid-cols-1 gap-3 sm:grid-cols-[1.6fr_90px_1.4fr_auto]">
          <div>
            <Label>Name</Label>
            <Input name="name" placeholder="T-Shirt" required />
          </div>
          <div>
            <Label>Points</Label>
            <Input name="points" type="number" min={0} defaultValue={0} required />
          </div>
          <div>
            <Label>Image URL</Label>
            <Input name="image_url" placeholder="/items/t-shirt.png" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">Add</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="has_sizes" className="h-4 w-4 accent-pink" /> Has sizes
            </label>
            <Input name="sizes" placeholder="Sizes — e.g. S, M, L, XL, XXL" className="max-w-xs" />
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="min-w-[760px]">
          <div className={`${ROW} border-b border-border px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground`}>
            <span />
            <span>Name</span>
            <span>Points</span>
            <span>Sizes</span>
            <span>Image URL</span>
            <span className="text-center">Sized</span>
            <span className="text-center">Active</span>
            <span />
          </div>
          {list.map((item) => (
            <form
              key={item.id}
              action={updateItem}
              className={`${ROW} border-b border-border px-4 py-2.5 last:border-0 ${item.active ? "" : "opacity-50"}`}
            >
              <input type="hidden" name="id" value={item.id} />
              {item.image_url ? (
                <img src={item.image_url} alt="" className="item-img h-10 w-10 rounded-md" />
              ) : (
                <div className="h-10 w-10 rounded-md bg-muted" />
              )}
              <Input name="name" defaultValue={item.name} required />
              <Input name="points" type="number" min={0} defaultValue={item.points} />
              <Input name="sizes" defaultValue={item.sizes?.join(", ") ?? ""} placeholder="(none)" />
              <Input name="image_url" defaultValue={item.image_url ?? ""} placeholder="(none)" />
              <span className="flex justify-center">
                <input type="checkbox" name="has_sizes" defaultChecked={item.has_sizes} className="h-4 w-4 accent-pink" />
              </span>
              <span className="flex justify-center">
                <input type="checkbox" name="active" defaultChecked={item.active} className="h-4 w-4 accent-pink" />
              </span>
              <Button type="submit" variant="outline" className="h-8 px-3">Save</Button>
            </form>
          ))}
        </div>
      </Card>
    </div>
  );
}
