import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function SignUpPage() { return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6"><Card><CardHeader><CardTitle>Crea account</CardTitle><CardDescription>Signup shell pronta per Supabase.</CardDescription></CardHeader><CardContent><form className="grid gap-4"><Label>Email</Label><Input type="email" /><Label>Password</Label><Input type="password" /><Button type="button">Crea account</Button></form></CardContent></Card></main>; }
