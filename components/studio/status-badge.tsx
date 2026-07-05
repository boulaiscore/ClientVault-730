import { STATUS_LABELS } from "@/lib/domain/status-options";
import type { PracticeItemStatus, PracticeStatus } from "@/types/models";
export function StatusBadge({ status }: { status: PracticeStatus | PracticeItemStatus }) { return <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">{STATUS_LABELS[status]}</span>; }
