import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

const links: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clienti" },
  { href: "/practices", label: "Pratiche" }
];

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface p-6 md:block"><Link href="/dashboard" className="text-xl font-semibold">ClientVault 730</Link><nav className="mt-8 grid gap-2">{links.map((link) => <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm hover:bg-muted">{link.label}</Link>)}</nav></aside><main className="mx-auto max-w-6xl px-4 py-8 md:ml-64 md:px-8">{children}</main></div>;
}
