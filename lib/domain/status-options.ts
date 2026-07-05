import type { PracticeItemStatus, PracticeStatus } from "@/types/models";

export const PRACTICE_STATUSES: PracticeStatus[] = ["draft", "sent", "in_progress", "needs_review", "complete", "archived"];
export const PRACTICE_ITEM_STATUSES: PracticeItemStatus[] = ["requested", "uploaded", "needs_correction", "approved", "not_needed"];

export const STATUS_LABELS: Record<PracticeStatus | PracticeItemStatus, string> = {
  draft: "Bozza",
  sent: "Inviata",
  in_progress: "In lavorazione",
  needs_review: "Da verificare",
  complete: "Completa",
  archived: "Archiviata",
  requested: "Richiesto",
  uploaded: "Caricato",
  needs_correction: "Da correggere",
  approved: "Approvato",
  not_needed: "Non necessario"
};
