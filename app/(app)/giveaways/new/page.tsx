import { supabase } from "@/lib/supabase";
import { getStockMap, itemsInStock } from "@/lib/stock";
import { GiveawayForm } from "@/components/giveaway-form";
import type { ItemLite } from "@/components/order-form";

export const dynamic = "force-dynamic";

export default async function NewGiveawayPage() {
  const { data: items } = await supabase
    .from("items")
    .select("id,name,points,has_sizes,sizes,image_url")
    .eq("active", true)
    .order("name");
  const stockMap = await getStockMap();
  const stock = Object.fromEntries(stockMap);
  const inStock = itemsInStock((items ?? []) as ItemLite[], stockMap);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Give out swag</h1>
      {inStock.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing in stock to give out right now.</p>
      ) : (
        <GiveawayForm items={inStock} stock={stock} />
      )}
    </div>
  );
}
