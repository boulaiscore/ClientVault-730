export type EmailMessage = { to: string; from: string; subject: string; text: string; html: string };
export type EmailResult = { provider: string; messageId?: string };
export interface EmailProvider { send(message: EmailMessage): Promise<EmailResult>; }

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.log("[ClientVault email]", JSON.stringify({ to: message.to, from: message.from, subject: message.subject, text: message.text }, null, 2));
    return { provider: "console", messageId: `console-${Date.now()}` };
  }
}

export class ResendEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string) {}
  async send(message: EmailMessage) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: message.from, to: [message.to], subject: message.subject, text: message.text, html: message.html })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Resend email failed: ${body?.message ?? response.statusText}`);
    return { provider: "resend", messageId: body?.id };
  }
}

export function getEmailProvider() {
  const provider = process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === "production" ? "" : "console");
  if (provider === "console") return new ConsoleEmailProvider();
  if (provider === "resend") {
    if (!process.env.RESEND_API_KEY) throw new Error("EMAIL_PROVIDER=resend requires RESEND_API_KEY.");
    return new ResendEmailProvider(process.env.RESEND_API_KEY);
  }
  if (process.env.NODE_ENV === "production") throw new Error("EMAIL_PROVIDER must be configured in production.");
  return new ConsoleEmailProvider();
}

export function getEmailFrom() {
  const from = process.env.EMAIL_FROM || "ClientVault 730 <no-reply@clientvault.local>";
  if (process.env.NODE_ENV === "production" && !process.env.EMAIL_FROM) throw new Error("EMAIL_FROM must be configured in production.");
  return from;
}
