"use client";

import { useActionState } from "react";
import { verifyPin, type LoginState } from "./actions";
import { Button, Input, Card } from "@/components/ui";
import { Mosaic, ChipLogo } from "@/components/brand";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(verifyPin, {});

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border">
        <Mosaic />
        <Card className="rounded-none border-0">
          <div className="mb-1 flex items-center gap-2.5">
            <ChipLogo size={32} />
            <h1 className="text-lg font-bold">BUILDER<span className="text-pink">SWAG</span></h1>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">AWS Student Builder Group · enter PIN to continue.</p>
        <form action={action} className="space-y-3">
          <Input
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="PIN"
            required
          />
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Checking…" : "Unlock"}
          </Button>
        </form>
        </Card>
      </div>
    </main>
  );
}
