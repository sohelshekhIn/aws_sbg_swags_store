import { supabase } from "@/lib/supabase";
import { getStockMap } from "@/lib/stock";
import { GiveawayForm } from "@/components/giveaway-form";
import type { ItemLite } from "@/components/order-form";

export const dynamic = "force-dynamic";

export default async function NewGiveawayPage() {
  const { data: items } = await supabase
    .from("items")
    .select("id,name,points,has_sizes,sizes,image_url")
    .eq("active", true)
    .order("points", { ascending: false });
  const stock = Object.fromEntries(await getStockMap());

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Give out swag</h1>
      <GiveawayForm items={(items ?? []) as ItemLite[]} stock={stock} />
    </div>
  );
}
