import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ClientVault 730", description: "Studio workflow and secure client upload portal for 730 practices." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="it"><body>{children}</body></html>; }
