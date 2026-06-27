"use server";

import { redirect } from "next/navigation";
import {
  clientIp,
  underRateLimit,
  recordFailedAttempt,
  clearAttempts,
  startSession,
} from "@/lib/auth";

export type LoginState = { error?: string };

export async function verifyPin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const pin = String(formData.get("pin") || "").trim();
  const ip = await clientIp();

  if (!(await underRateLimit(ip))) {
    return { error: "Too many attempts. Please try again in 15 minutes." };
  }

  const expected = process.env.APP_PIN || "000000";
  if (pin !== expected) {
    await recordFailedAttempt(ip);
    return { error: "Incorrect PIN." };
  }

  await clearAttempts(ip);
  await startSession();
  redirect("/");
}
