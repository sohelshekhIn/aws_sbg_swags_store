import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-pink text-primary-foreground hover:brightness-105 font-semibold",
    outline: "border border-border bg-transparent hover:bg-muted text-foreground",
    ghost: "hover:bg-muted text-foreground",
    danger: "border border-destructive text-destructive hover:bg-destructive hover:text-[var(--background)]",
  };
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4 text-sm transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-border bg-[var(--input)] px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-pink focus:ring-2 focus:ring-pink/40",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-border bg-[var(--input)] px-2 text-sm text-foreground outline-none focus:border-pink focus:ring-2 focus:ring-pink/40",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-medium uppercase tracking-wide text-muted-foreground", className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-card p-5", className)} {...props} />;
}

/** Small pink/points pill. */
export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-yellow/40 bg-yellow/10 px-2 py-0.5 text-xs font-semibold text-yellow",
        className
      )}
      {...props}
    />
  );
}
