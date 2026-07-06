import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv, requiredEnv } from "./lib/local-env.mjs";

loadLocalEnv(process.cwd());
const supabase = createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const appUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const intervalDays = Number(process.env.REMINDER_INTERVAL_DAYS || "3");
const cutoff = new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000).toISOString();

function missingItems(items) { return items.filter((item) => item.required && ["requested", "needs_correction"].includes(item.status)); }
function line(item) { return item.status === "needs_correction" ? `Da correggere: ${item.label} - ${item.note_to_client || item.note || "Correzione richiesta dallo studio"}` : `- ${item.label}`; }
async function sendEmail(message) {
  const provider = process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === "production" ? "" : "console");
  if (provider === "console") {
    console.log("[ClientVault email]", JSON.stringify(message, null, 2));
    return { provider: "console", messageId: `console-${Date.now()}` };
  }
  if (provider === "resend") {
    if (!process.env.RESEND_API_KEY) throw new Error("EMAIL_PROVIDER=resend requires RESEND_API_KEY.");
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: message.from, to: [message.to], subject: message.subject, text: message.text, html: message.html }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Resend email failed: ${body?.message || response.statusText}`);
    return { provider: "resend", messageId: body?.id };
  }
  throw new Error("EMAIL_PROVIDER must be configured.");
}

const { data: practices, error } = await supabase
  .from("practices")
  .select("*, client_profiles(*), organizations(*)")
  .eq("public_link_enabled", true)
  .eq("reminder_enabled", true)
  .is("archived_at", null)
  .in("status", ["sent", "in_progress", "needs_review"])
  .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${cutoff}`);
if (error) throw error;

const results = [];
for (const practice of practices || []) {
  const { data: items, error: itemError } = await supabase.from("practice_items").select().eq("organization_id", practice.organization_id).eq("practice_id", practice.id).order("sort_order", { ascending: true });
  if (itemError) throw itemError;
  const selected = missingItems(items || []);
  if (selected.length === 0) continue;
  const client = practice.client_profiles;
  const organization = practice.organizations;
  const portalUrl = `${appUrl}/p/${practice.public_token}`;
  const list = selected.map(line).join("\n");
  const subject = "Documenti mancanti per il tuo 730";
  const text = `Ciao ${client.first_name},\n\nper completare la raccolta documenti per il tuo 730 mancano ancora:\n\n${list}\n\nPuoi caricarli qui:\n${portalUrl}\n\nGrazie,\n${organization.name}`;
  const html = `<p>Ciao ${client.first_name},</p><p>per completare la raccolta documenti per il tuo 730 mancano ancora:</p><ul>${selected.map((item) => `<li>${line(item).replace(/^- /, "")}</li>`).join("")}</ul><p>Puoi caricarli qui:<br><a href="${portalUrl}">${portalUrl}</a></p><p>Grazie,<br>${organization.name}</p>`;
  const payload = { subject, text, html, itemIds: selected.map((item) => item.id) };
  try {
    const result = await sendEmail({ to: client.email, from: process.env.EMAIL_FROM || "ClientVault 730 <no-reply@clientvault.local>", subject, text, html });
    const sentAt = new Date().toISOString();
    const { data: reminder, error: reminderError } = await supabase.from("reminders").insert({ organization_id: practice.organization_id, practice_id: practice.id, channel: "email", reminder_type: "missing_documents", status: "sent", sent_at: sentAt, payload: { ...payload, provider: result.provider, messageId: result.messageId } }).select().single();
    if (reminderError) throw reminderError;
    await supabase.from("practices").update({ last_reminder_sent_at: sentAt, reminder_count: (practice.reminder_count || 0) + 1, updated_at: sentAt }).eq("id", practice.id);
    await supabase.from("activity_log_events").insert({ organization_id: practice.organization_id, practice_id: practice.id, event_type: "reminder_sent", actor_type: "system", metadata: { reminderId: reminder.id, itemCount: selected.length } });
    results.push({ practiceId: practice.id, status: "sent", reminderId: reminder.id });
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Reminder failed";
    const { data: reminder } = await supabase.from("reminders").insert({ organization_id: practice.organization_id, practice_id: practice.id, channel: "email", reminder_type: "missing_documents", status: "failed", sent_at: new Date().toISOString(), payload, error_message: message }).select().single();
    await supabase.from("activity_log_events").insert({ organization_id: practice.organization_id, practice_id: practice.id, event_type: "reminder_failed", actor_type: "system", metadata: { reminderId: reminder?.id, error: message } });
    results.push({ practiceId: practice.id, status: "failed", error: message });
  }
}

console.log(JSON.stringify({ ok: true, intervalDays, results }, null, 2));
