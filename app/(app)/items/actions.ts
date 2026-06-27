"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

function parseSizes(hasSizes: boolean, raw: string): string[] | null {
  if (!hasSizes) return null;
  const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr : null;
}

function revalidate() {
  revalidatePath("/items");
  revalidatePath("/");
}

export async function createItem(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const has_sizes = formData.get("has_sizes") === "on";
  await supabase.from("items").insert({
    name,
    points: Number(formData.get("points") || 0),
    has_sizes,
    sizes: parseSizes(has_sizes, String(formData.get("sizes") || "")),
    image_url: String(formData.get("image_url") || "").trim() || null,
  });
  revalidate();
}

export async function updateItem(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  const has_sizes = formData.get("has_sizes") === "on";
  await supabase
    .from("items")
    .update({
      name,
      points: Number(formData.get("points") || 0),
      has_sizes,
      sizes: parseSizes(has_sizes, String(formData.get("sizes") || "")),
      image_url: String(formData.get("image_url") || "").trim() || null,
      active: formData.get("active") === "on",
    })
    .eq("id", id);
  revalidate();
}
