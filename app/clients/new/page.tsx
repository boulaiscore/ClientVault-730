import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/components/studio/client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientAction } from "@/lib/studio/actions";
export default function NewClientPage() { return <AppShell><Card><CardHeader><CardTitle>Nuovo cliente</CardTitle><CardDescription>Crea una nuova anagrafica cliente.</CardDescription></CardHeader><CardContent><ClientForm action={createClientAction} submitLabel="Crea cliente" /></CardContent></Card></AppShell>; }
