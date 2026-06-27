import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill them in."
  );
}

// Service-role client — server-only, bypasses RLS. Never import from a Client Component.
export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type Item = {
  id: string;
  name: string;
  points: number;
  has_sizes: boolean;
  sizes: string[] | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
};
