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
      <OrderForm items={(items ?? []) as ItemLite[]} />
    </div>
  );
}
