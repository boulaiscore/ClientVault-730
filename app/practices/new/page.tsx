import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPracticeAction } from "@/lib/studio/actions";
import { getCurrentOrganization } from "@/lib/studio/organization-context";
import { getStudioRepository } from "@/lib/studio/repository";
import { getClientDisplayName } from "@/types/models";
export const dynamic = "force-dynamic";
export default async function NewPracticePage() { const org = await getCurrentOrganization(); const clients = await getStudioRepository().listClients(org.id); return <AppShell><Card><CardHeader><CardTitle>Nuova pratica 730</CardTitle><CardDescription>Seleziona un cliente e genera la checklist 730.</CardDescription></CardHeader><CardContent><form action={createPracticeAction} className="grid max-w-2xl gap-5"><div className="grid gap-2"><Label htmlFor="clientId">Cliente</Label><select id="clientId" name="clientId" required className="h-10 rounded-md border border-border bg-surface px-3 text-sm"><option value="">Seleziona cliente</option>{clients.filter((c) => c.status === "active").map((c) => <option key={c.id} value={c.id}>{getClientDisplayName(c)}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="fiscalYear">Anno fiscale</Label><Input id="fiscalYear" name="fiscalYear" type="number" min="2020" defaultValue="2025" required /></div><Button type="submit" className="w-fit" disabled={clients.length === 0}>Crea pratica</Button></form></CardContent></Card></AppShell>; }
