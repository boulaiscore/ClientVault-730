import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientProfile } from "@/types/models";

export function ClientForm({ action, client, submitLabel }: { action: (formData: FormData) => Promise<void>; client?: ClientProfile; submitLabel: string }) {
  return <form action={action} className="grid max-w-2xl gap-5"><input type="hidden" name="clientId" value={client?.id ?? ""} /><div className="grid gap-2"><Label htmlFor="firstName">Nome</Label><Input id="firstName" name="firstName" defaultValue={client?.firstName ?? ""} required /></div><div className="grid gap-2"><Label htmlFor="lastName">Cognome</Label><Input id="lastName" name="lastName" defaultValue={client?.lastName ?? ""} required /></div><div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} /></div><div className="grid gap-2"><Label htmlFor="phone">Telefono</Label><Input id="phone" name="phone" defaultValue={client?.phone ?? ""} /></div><div className="grid gap-2"><Label htmlFor="taxCode">Codice fiscale</Label><Input id="taxCode" name="taxCode" defaultValue={client?.taxCode ?? ""} /></div><Button type="submit" className="w-fit">{submitLabel}</Button></form>;
}
