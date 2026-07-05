import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/studio/status-badge";
import { formatProgressPercent } from "@/lib/domain/practice";
import type { PracticeSummary } from "@/lib/studio/studio-repository";
import { getClientDisplayName } from "@/types/models";

export function PracticeTable({ practices }: { practices: PracticeSummary[] }) {
  return <div className="overflow-hidden rounded-md border border-border bg-surface"><table className="w-full border-collapse text-sm"><thead className="bg-muted/60 text-left text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Cliente</th><th className="px-4 py-3 font-medium">Anno</th><th className="px-4 py-3 font-medium">Stato</th><th className="px-4 py-3 font-medium">Progress</th><th className="px-4 py-3 font-medium">Mancanti</th><th className="px-4 py-3" /></tr></thead><tbody>{practices.map((summary) => <tr key={summary.practice.id} className="border-t border-border"><td className="px-4 py-3 font-medium">{getClientDisplayName(summary.client)}</td><td className="px-4 py-3">{summary.practice.fiscalYear}</td><td className="px-4 py-3"><StatusBadge status={summary.practice.status} /></td><td className="px-4 py-3">{formatProgressPercent(summary.progress)}%</td><td className="px-4 py-3">{summary.missingItemCount}</td><td className="px-4 py-3 text-right"><Button asChild variant="secondary"><Link href={`/practices/${summary.practice.id}` as Route}>Apri</Link></Button></td></tr>)}{practices.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nessuna pratica trovata.</td></tr> : null}</tbody></table></div>;
}
