import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function OrganizationOnboardingPage() { return <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12"><Card><CardHeader><CardTitle>Crea organizzazione</CardTitle><CardDescription>Workspace per studio, clienti, pratiche e documenti.</CardDescription></CardHeader><CardContent><form className="grid gap-5"><Label>Nome organizzazione</Label><Input placeholder="Studio Bianchi" /><Label>Slug</Label><Input placeholder="studio-bianchi" /><Button type="button" className="w-fit">Crea organizzazione</Button></form></CardContent></Card></main>; }
