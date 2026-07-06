import "server-only";

import { getEmailFrom, getEmailProvider, type EmailProvider } from "@/lib/email/provider";
import { getReminderMissingItems, isReminderDue, renderCorrectionEmail, renderMissingDocumentsEmail } from "@/lib/domain/reminders";
import { env } from "@/lib/env";
import { getStudioRepository } from "@/lib/studio/repository";
import type { ID, PracticeItem } from "@/types/models";

function publicUrl(publicToken: string) { return `${(process.env.APP_BASE_URL || env.appUrl).replace(/\/$/, "")}/p/${publicToken}`; }
function requireEmail(email: string | null) { if (!email) throw new Error("Il cliente non ha un indirizzo email."); return email; }
function noteFor(item: PracticeItem) { return item.noteToClient || item.note || null; }

export async function sendMissingDocumentsReminder(input: { organizationId: ID; practiceId: ID; targetItemId?: ID | null; emailProvider?: EmailProvider }) {
  const repo = getStudioRepository();
  const detail = await repo.getPracticeDetail(input.organizationId, input.practiceId);
  if (!detail) throw new Error("Practice not found.");
  const organization = await repo.getOrganization(input.organizationId);
  if (!organization) throw new Error("Organization not found.");
  const items = getReminderMissingItems(detail.items, input.targetItemId);
  if (items.length === 0) throw new Error("Non ci sono documenti mancanti o correzioni da ricordare.");
  const email = renderMissingDocumentsEmail({ client: detail.client, organization, items, publicPortalUrl: publicUrl(detail.practice.publicToken) });
  const provider = input.emailProvider ?? getEmailProvider();
  const payload = { subject: email.subject, text: email.text, html: email.html, itemIds: items.map((item) => item.id), targetItemId: input.targetItemId ?? null };
  try {
    const result = await provider.send({ to: requireEmail(detail.client.email), from: getEmailFrom(), subject: email.subject, text: email.text, html: email.html });
    const sentAt = new Date().toISOString();
    const record = await repo.createReminderRecord({ organizationId: input.organizationId, practiceId: input.practiceId, channel: "email", reminderType: "missing_documents", targetItemId: input.targetItemId ?? null, status: "sent", sentAt, payload: { ...payload, provider: result.provider, messageId: result.messageId }, errorMessage: null });
    await repo.markPracticeReminderSent(input.organizationId, input.practiceId, sentAt);
    await repo.recordActivityEvent({ organizationId: input.organizationId, practiceId: input.practiceId, practiceItemId: input.targetItemId ?? null, documentId: null, eventType: "reminder_sent", actorType: "studio", metadata: { reminderId: record.id, itemCount: items.length } });
    return record;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email reminder failed.";
    const record = await repo.createReminderRecord({ organizationId: input.organizationId, practiceId: input.practiceId, channel: "email", reminderType: "missing_documents", targetItemId: input.targetItemId ?? null, status: "failed", sentAt: new Date().toISOString(), payload, errorMessage: message });
    await repo.recordActivityEvent({ organizationId: input.organizationId, practiceId: input.practiceId, practiceItemId: input.targetItemId ?? null, documentId: null, eventType: "reminder_failed", actorType: "studio", metadata: { reminderId: record.id, error: message } });
    throw error;
  }
}

export async function sendCorrectionNotification(input: { organizationId: ID; practiceId: ID; practiceItemId: ID; emailProvider?: EmailProvider }) {
  const repo = getStudioRepository();
  const detail = await repo.getPracticeDetail(input.organizationId, input.practiceId);
  if (!detail) throw new Error("Practice not found.");
  const item = detail.items.find((candidate) => candidate.id === input.practiceItemId);
  if (!item) throw new Error("Practice item not found.");
  if (item.status !== "needs_correction") throw new Error("L'elemento non e segnato come da correggere.");
  if (!noteFor(item)) throw new Error("Aggiungi una nota per il cliente prima di notificare la correzione.");
  const organization = await repo.getOrganization(input.organizationId);
  if (!organization) throw new Error("Organization not found.");
  const email = renderCorrectionEmail({ client: detail.client, organization, item, publicPortalUrl: publicUrl(detail.practice.publicToken) });
  const provider = input.emailProvider ?? getEmailProvider();
  const payload = { subject: email.subject, text: email.text, html: email.html, itemId: item.id, note: noteFor(item) };
  try {
    const result = await provider.send({ to: requireEmail(detail.client.email), from: getEmailFrom(), subject: email.subject, text: email.text, html: email.html });
    const record = await repo.createReminderRecord({ organizationId: input.organizationId, practiceId: input.practiceId, channel: "email", reminderType: "correction", targetItemId: item.id, status: "sent", sentAt: new Date().toISOString(), payload: { ...payload, provider: result.provider, messageId: result.messageId }, errorMessage: null });
    await repo.recordActivityEvent({ organizationId: input.organizationId, practiceId: input.practiceId, practiceItemId: item.id, documentId: null, eventType: "correction_notification_sent", actorType: "studio", metadata: { reminderId: record.id } });
    return record;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Correction notification failed.";
    const record = await repo.createReminderRecord({ organizationId: input.organizationId, practiceId: input.practiceId, channel: "email", reminderType: "correction", targetItemId: item.id, status: "failed", sentAt: new Date().toISOString(), payload, errorMessage: message });
    await repo.recordActivityEvent({ organizationId: input.organizationId, practiceId: input.practiceId, practiceItemId: item.id, documentId: null, eventType: "correction_notification_failed", actorType: "studio", metadata: { reminderId: record.id, error: message } });
    throw error;
  }
}

export async function sendDueReminders(input: { intervalDays?: number; emailProvider?: EmailProvider } = {}) {
  const repo = getStudioRepository();
  const candidates = await repo.listReminderCandidates(input.intervalDays ?? 3);
  const results = [];
  for (const candidate of candidates) {
    if (!isReminderDue({ practice: candidate.practice, items: candidate.items, intervalDays: input.intervalDays ?? 3 })) continue;
    try {
      const record = await sendMissingDocumentsReminder({ organizationId: candidate.practice.organizationId, practiceId: candidate.practice.id, emailProvider: input.emailProvider });
      results.push({ practiceId: candidate.practice.id, status: "sent", reminderId: record.id });
    } catch (error) {
      results.push({ practiceId: candidate.practice.id, status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  return results;
}
