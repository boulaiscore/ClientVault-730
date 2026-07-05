import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PracticeTable } from "@/components/studio/practice-table";
import { Button } from "@/components/ui/button";
import { getCurrentOrganization } from "@/lib/studio/organization-context";
import { getStudioRepository } from "@/lib/studio/repository";
export const dynamic = "force-dynamic";
export default async function PracticesPage() { const org = await getCurrentOrganization(); const practices = await getStudioRepository().listPractices(org.id); return <AppShell><div className="mb-8 flex justify-between gap-4"><div><p className="text-sm font-medium text-muted-foreground">Pratiche 730</p><h1 className="mt-2 text-3xl font-semibold">Pratiche studio</h1></div><Button asChild><Link href="/practices/new">Nuova pratica</Link></Button></div><PracticeTable practices={practices} /></AppShell>; }
