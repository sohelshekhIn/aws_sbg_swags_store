import Link from "next/link";
import { logout } from "./actions";
import { Button } from "@/components/ui";
import { Mosaic, ChipLogo } from "@/components/brand";

const links = [
  { href: "/", label: "Stock" },
  { href: "/items", label: "Items" },
  { href: "/orders", label: "Orders" },
  { href: "/giveaways", label: "Giveaways" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Mosaic />
      <header className="border-b border-border bg-card">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
          <Link href="/" className="mr-4 flex items-center gap-2.5">
            <ChipLogo />
            <span className="hidden font-bold leading-none sm:inline">
              BUILDER<span className="text-pink">SWAG</span>
            </span>
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <form action={logout} className="ml-auto">
            <Button variant="ghost" className="h-8 text-muted-foreground">Log out</Button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
