import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/components/studio/client-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveClientAction, updateClientAction } from "@/lib/studio/actions";
import { getCurrentOrganization } from "@/lib/studio/organization-context";
import { getStudioRepository } from "@/lib/studio/repository";
export const dynamic = "force-dynamic";
export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const org = await getCurrentOrganization(); const client = await getStudioRepository().getClient(org.id, id); if (!client) notFound(); return <AppShell><div className="grid gap-6"><Card><CardHeader><CardTitle>Modifica cliente</CardTitle><CardDescription>Aggiorna i dati anagrafici.</CardDescription></CardHeader><CardContent><ClientForm action={updateClientAction} client={client} submitLabel="Salva modifiche" /></CardContent></Card><Card><CardHeader><CardTitle>Archivio</CardTitle><CardDescription>Archivia il cliente senza rimuovere lo storico.</CardDescription></CardHeader><CardContent><form action={archiveClientAction}><input type="hidden" name="clientId" value={client.id} /><Button type="submit" variant="secondary" disabled={client.status === "archived"}>Archivia cliente</Button></form></CardContent></Card></div></AppShell>; }
