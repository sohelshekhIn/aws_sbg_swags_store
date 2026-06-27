import { supabase } from "@/lib/supabase";
import { OrderForm, type ItemLite } from "@/components/order-form";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const { data: items } = await supabase
    .from("items")
    .select("id,name,points,has_sizes,sizes,image_url")
    .eq("active", true)
    .order("points", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New order</h1>
      <p className="text-sm text-muted-foreground">
        Save a draft while you build the order, then create the final order when ready to submit.
      </p>
      <OrderForm items={(items ?? []) as ItemLite[]} mode="new" />
    </div>
  );
}
