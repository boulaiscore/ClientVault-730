import { describe, expect, it, vi } from "vitest";
import { ConsoleEmailProvider } from "@/lib/email/provider";
import { getReminderMissingItems, isReminderDue, renderCorrectionEmail, renderMissingDocumentsEmail } from "@/lib/domain/reminders";
import type { Practice, PracticeItem } from "@/types/models";

const baseItem = { id: "item-1", organizationId: "org-1", practiceId: "practice-1", templateItemId: "template-item-1", categoryName: "Redditi", label: "Certificazione Unica", required: true, note: null, noteToClient: null, sortOrder: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
function item(status: PracticeItem["status"], patch: Partial<PracticeItem> = {}): PracticeItem { return { ...baseItem, id: `${status}-${patch.id ?? "1"}`, status, ...patch }; }
function practice(patch: Partial<Practice> = {}): Practice { return { id: "practice-1", organizationId: "org-1", clientId: "client-1", templateId: "template-1", fiscalYear: 2025, status: "in_progress", publicToken: "token", publicLinkEnabled: true, archivedAt: null, reminderEnabled: true, lastReminderSentAt: null, reminderCount: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01", ...patch }; }

describe("reminder domain", () => {
  it("selects requested and correction items only", () => {
    const items = [item("requested"), item("needs_correction", { noteToClient: "Manca pagina 2" }), item("uploaded"), item("approved"), item("not_needed")];
    expect(getReminderMissingItems(items).map((i) => i.status)).toEqual(["requested", "needs_correction"]);
  });

  it("renders missing reminder in text and html", () => {
    const email = renderMissingDocumentsEmail({ client: { firstName: "Mario" }, organization: { name: "Studio Demo" }, items: [item("requested"), item("needs_correction", { label: "Fattura medica", noteToClient: "Foto illeggibile" })], publicPortalUrl: "http://localhost:3000/p/token" });
    expect(email.subject).toBe("Documenti mancanti per il tuo 730");
    expect(email.text).toContain("Certificazione Unica");
    expect(email.text).toContain("Da correggere: Fattura medica - Foto illeggibile");
    expect(email.html).toContain("http://localhost:3000/p/token");
  });

  it("renders correction notification", () => {
    const email = renderCorrectionEmail({ client: { firstName: "Mario" }, organization: { name: "Studio Demo" }, item: item("needs_correction", { noteToClient: "Documento tagliato" }), publicPortalUrl: "http://localhost:3000/p/token" });
    expect(email.subject).toBe("Documento da correggere per il tuo 730");
    expect(email.text).toContain("Documento tagliato");
  });

  it("computes send-due eligibility", () => {
    expect(isReminderDue({ practice: practice(), items: [item("requested")] })).toBe(true);
    expect(isReminderDue({ practice: practice({ status: "draft" }), items: [item("requested")] })).toBe(false);
    expect(isReminderDue({ practice: practice({ publicLinkEnabled: false }), items: [item("requested")] })).toBe(false);
    expect(isReminderDue({ practice: practice({ lastReminderSentAt: "2026-01-05T00:00:00.000Z" }), items: [item("requested")], now: new Date("2026-01-06T00:00:00.000Z"), intervalDays: 3 })).toBe(false);
  });
});

describe("console email provider", () => {
  it("logs and returns a dev message id", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const result = await new ConsoleEmailProvider().send({ to: "mario@example.com", from: "studio@example.com", subject: "Test", text: "Ciao", html: "<p>Ciao</p>" });
    expect(result.provider).toBe("console");
    expect(result.messageId).toContain("console-");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
