import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Order points expire 30 days after they were granted. */
export function expiryDate(grantedOn: string | null): Date | null {
  if (!grantedOn) return null;
  const d = new Date(grantedOn);
  d.setDate(d.getDate() + 30);
  return d;
}

export function fmtDate(d: string | Date | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}
