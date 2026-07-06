import type { ClientProfile, Organization, Practice, PracticeItem } from "@/types/models";

export const REMINDER_MISSING_STATUSES = new Set<PracticeItem["status"]>(["requested", "needs_correction"]);
export type ReminderType = "missing_documents" | "correction";
export type ReminderStatus = "sent" | "failed";
export type ReminderChannel = "email";

export type ReminderEmail = { subject: string; text: string; html: string; missingItems: PracticeItem[] };

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function getReminderMissingItems(items: PracticeItem[], targetItemId?: string | null) {
  return items.filter((item) => item.required && REMINDER_MISSING_STATUSES.has(item.status) && (!targetItemId || item.id === targetItemId));
}

export function getCorrectionItems(items: PracticeItem[]) {
  return items.filter((item) => item.required && item.status === "needs_correction");
}

export function formatMissingReminderLine(item: PracticeItem) {
  if (item.status === "needs_correction") return `Da correggere: ${item.label} - ${item.noteToClient || item.note || "Correzione richiesta dallo studio"}`;
  return `- ${item.label}`;
}

export function renderMissingDocumentsEmail(input: { client: Pick<ClientProfile, "firstName">; organization: Pick<Organization, "name">; items: PracticeItem[]; publicPortalUrl: string }): ReminderEmail {
  const missingItems = getReminderMissingItems(input.items);
  const list = missingItems.map(formatMissingReminderLine).join("\n");
  const subject = "Documenti mancanti per il tuo 730";
  const text = `Ciao ${input.client.firstName},\n\nper completare la raccolta documenti per il tuo 730 mancano ancora:\n\n${list}\n\nPuoi caricarli qui:\n${input.publicPortalUrl}\n\nGrazie,\n${input.organization.name}`;
  const htmlItems = missingItems.map((item) => `<li>${escapeHtml(formatMissingReminderLine(item).replace(/^- /, ""))}</li>`).join("");
  const html = `<p>Ciao ${escapeHtml(input.client.firstName)},</p><p>per completare la raccolta documenti per il tuo 730 mancano ancora:</p><ul>${htmlItems}</ul><p>Puoi caricarli qui:<br><a href="${escapeHtml(input.publicPortalUrl)}">${escapeHtml(input.publicPortalUrl)}</a></p><p>Grazie,<br>${escapeHtml(input.organization.name)}</p>`;
  return { subject, text, html, missingItems };
}

export function renderCorrectionEmail(input: { client: Pick<ClientProfile, "firstName">; organization: Pick<Organization, "name">; item: PracticeItem; publicPortalUrl: string }): ReminderEmail {
  const note = input.item.noteToClient || input.item.note || "Correzione richiesta dallo studio";
  const subject = "Documento da correggere per il tuo 730";
  const text = `Ciao ${input.client.firstName},\n\nlo studio ha richiesto una correzione per:\n\n${input.item.label}\n\nMotivo:\n${note}\n\nPuoi caricare il documento corretto qui:\n${input.publicPortalUrl}\n\nGrazie,\n${input.organization.name}`;
  const html = `<p>Ciao ${escapeHtml(input.client.firstName)},</p><p>lo studio ha richiesto una correzione per:</p><p><strong>${escapeHtml(input.item.label)}</strong></p><p>Motivo:<br>${escapeHtml(note)}</p><p>Puoi caricare il documento corretto qui:<br><a href="${escapeHtml(input.publicPortalUrl)}">${escapeHtml(input.publicPortalUrl)}</a></p><p>Grazie,<br>${escapeHtml(input.organization.name)}</p>`;
  return { subject, text, html, missingItems: [input.item] };
}

export function isReminderDue(input: { practice: Pick<Practice, "status" | "publicLinkEnabled" | "archivedAt" | "lastReminderSentAt" | "reminderEnabled">; items: PracticeItem[]; now?: Date; intervalDays?: number }) {
  if (!input.practice.publicLinkEnabled || !input.practice.reminderEnabled || input.practice.archivedAt || input.practice.status === "archived") return false;
  if (!["sent", "in_progress", "needs_review"].includes(input.practice.status)) return false;
  if (getReminderMissingItems(input.items).length === 0) return false;
  if (!input.practice.lastReminderSentAt) return true;
  const now = input.now ?? new Date();
  const intervalMs = (input.intervalDays ?? 3) * 24 * 60 * 60 * 1000;
  return now.getTime() - new Date(input.practice.lastReminderSentAt).getTime() >= intervalMs;
}
