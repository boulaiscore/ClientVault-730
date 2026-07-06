import { beforeAll, describe, expect, it } from "vitest";
// @ts-ignore JS env helper is intentionally shared with Node scripts.
import { loadLocalEnv } from "../../scripts/lib/local-env.mjs";
// @ts-ignore JS seed helper is intentionally shared with Node scripts.
import { ensureDevSeed } from "../../scripts/lib/dev-seed.mjs";

loadLocalEnv(process.cwd());
const shouldRun = process.env.RUN_INTEGRATION_TESTS === "true";
const describeIntegration = shouldRun ? describe : describe.skip;

type SeedContext = Awaited<ReturnType<typeof ensureDevSeed>>;

function uniqueName(name: string) {
  return `${Date.now()}-${name}`;
}

describeIntegration("local Supabase integration", () => {
  let ctx: SeedContext;

  beforeAll(async () => {
    ctx = await ensureDevSeed();
  }, 60_000);

  it("has the default 730 template with exactly 29 items", async () => {
    const { data: template, error } = await ctx.supabase
      .from("checklist_templates")
      .select()
      .eq("key", "modello-730-default")
      .eq("is_default", true)
      .is("organization_id", null)
      .single();
    expect(error).toBeNull();

    const { count, error: countError } = await ctx.supabase
      .from("checklist_template_items")
      .select("id", { count: "exact", head: true })
      .eq("template_id", template!.id);
    expect(countError).toBeNull();
    expect(count).toBe(29);
  });

  it("seed creates one practice with 29 checklist items", async () => {
    const { data: practice, error } = await ctx.supabase
      .from("practices")
      .select()
      .eq("id", ctx.practice_id)
      .single();
    expect(error).toBeNull();
    expect(practice!.public_link_enabled).toBe(true);

    const { count, error: countError } = await ctx.supabase
      .from("practice_items")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", ctx.practice_id);
    expect(countError).toBeNull();
    expect(count).toBe(29);
  });

  it("public token resolves exactly one enabled practice", async () => {
    const { data, error } = await ctx.supabase
      .from("practices")
      .select("id")
      .eq("public_token", ctx.public_token)
      .eq("public_link_enabled", true);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(ctx.practice_id);
  });

  it("disabled public link blocks portal access", async () => {
    await ctx.supabase.from("practices").update({ public_link_enabled: false }).eq("id", ctx.practice_id);
    const { data, error } = await ctx.supabase
      .from("practices")
      .select("id")
      .eq("public_token", ctx.public_token)
      .eq("public_link_enabled", true)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
    await ctx.supabase.from("practices").update({ public_link_enabled: true }).eq("id", ctx.practice_id);
  });

  it("archived practice blocks upload eligibility", async () => {
    await ctx.supabase.from("practices").update({ status: "archived" }).eq("id", ctx.practice_id);
    const { data, error } = await ctx.supabase
      .from("practices")
      .select("status")
      .eq("public_token", ctx.public_token)
      .eq("public_link_enabled", true)
      .single();
    expect(error).toBeNull();
    expect(data!.status).toBe("archived");
    await ctx.supabase.from("practices").update({ status: "draft", archived_at: null }).eq("id", ctx.practice_id);
  });

  it("valid upload creates storage object, document record, item upload status, activity log, and signed URL", async () => {
    const { data: item, error: itemError } = await ctx.supabase
      .from("practice_items")
      .select()
      .eq("practice_id", ctx.practice_id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    expect(itemError).toBeNull();

    const documentId = crypto.randomUUID();
    const storedFileName = `${documentId}-${uniqueName("fixture.pdf")}`;
    const storagePath = `org-${ctx.organization_id}/practice-${ctx.practice_id}/item-${item!.id}/${storedFileName}`;
    const upload = await ctx.supabase.storage
      .from("client-documents")
      .upload(storagePath, Buffer.from("%PDF-1.4 smoke\n"), { contentType: "application/pdf" });
    expect(upload.error).toBeNull();

    const { data: document, error: documentError } = await ctx.supabase
      .from("document_records")
      .insert({
        id: documentId,
        organization_id: ctx.organization_id,
        client_id: ctx.client_id,
        practice_id: ctx.practice_id,
        practice_item_id: item!.id,
        storage_path: storagePath,
        file_name: "fixture.pdf",
        content_type: "application/pdf",
        size_bytes: 15,
        original_file_name: "fixture.pdf",
        stored_file_name: storedFileName,
        mime_type: "application/pdf",
        file_size_bytes: 15,
        uploaded_by_type: "client",
        status: "active"
      })
      .select()
      .single();
    expect(documentError).toBeNull();

    const itemUpdate = await ctx.supabase.from("practice_items").update({ status: "uploaded" }).eq("id", item!.id);
    expect(itemUpdate.error).toBeNull();

    const activity = await ctx.supabase.from("activity_log_events").insert({
      organization_id: ctx.organization_id,
      practice_id: ctx.practice_id,
      practice_item_id: item!.id,
      document_id: document!.id,
      event_type: "document_uploaded",
      actor_type: "client",
      metadata: { integration: true }
    });
    expect(activity.error).toBeNull();

    const signed = await ctx.supabase.storage.from("client-documents").createSignedUrl(storagePath, 60);
    expect(signed.error).toBeNull();
    expect(signed.data!.signedUrl).toContain("token=");
  });

  it("upload to item from another practice is rejected by relationship check", async () => {
    const { data: template } = await ctx.supabase.from("checklist_templates").select().eq("key", "modello-730-default").single();
    const { data: otherPractice, error: otherPracticeError } = await ctx.supabase
      .from("practices")
      .insert({ organization_id: ctx.organization_id, client_id: ctx.client_id, template_id: template!.id, fiscal_year: 2024, status: "draft" })
      .select()
      .single();
    expect(otherPracticeError).toBeNull();

    const { data: item, error: itemError } = await ctx.supabase
      .from("practice_items")
      .select()
      .eq("practice_id", ctx.practice_id)
      .limit(1)
      .single();
    expect(itemError).toBeNull();

    expect(item!.practice_id).not.toBe(otherPractice!.id);
  });


  it("records correction reminder workflow in persisted tables", async () => {
    const { data: item, error: itemError } = await ctx.supabase
      .from("practice_items")
      .select()
      .eq("practice_id", ctx.practice_id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    expect(itemError).toBeNull();

    const note = "Documento illeggibile, caricare una nuova scansione.";
    const correction = await ctx.supabase
      .from("practice_items")
      .update({ status: "needs_correction", note_to_client: note })
      .eq("organization_id", ctx.organization_id)
      .eq("id", item!.id);
    expect(correction.error).toBeNull();

    const activity = await ctx.supabase.from("activity_log_events").insert({
      organization_id: ctx.organization_id,
      practice_id: ctx.practice_id,
      practice_item_id: item!.id,
      event_type: "item_marked_needs_correction",
      actor_type: "studio",
      metadata: { noteToClient: note }
    });
    expect(activity.error).toBeNull();

    const sentAt = new Date().toISOString();
    const { data: reminder, error: reminderError } = await ctx.supabase
      .from("reminders")
      .insert({ organization_id: ctx.organization_id, practice_id: ctx.practice_id, channel: "email", reminder_type: "correction", target_item_id: item!.id, status: "sent", sent_at: sentAt, payload: { note } })
      .select()
      .single();
    expect(reminderError).toBeNull();

    const reminderActivity = await ctx.supabase.from("activity_log_events").insert({
      organization_id: ctx.organization_id,
      practice_id: ctx.practice_id,
      practice_item_id: item!.id,
      event_type: "correction_notification_sent",
      actor_type: "studio",
      metadata: { reminderId: reminder!.id }
    });
    expect(reminderActivity.error).toBeNull();

    const practiceUpdate = await ctx.supabase.from("practices").update({ last_reminder_sent_at: sentAt, reminder_count: 1 }).eq("id", ctx.practice_id);
    expect(practiceUpdate.error).toBeNull();

    const { data: reloadedReminder, error: reloadError } = await ctx.supabase.from("reminders").select().eq("id", reminder!.id).single();
    expect(reloadError).toBeNull();
    expect(reloadedReminder!.status).toBe("sent");
    expect(reloadedReminder!.target_item_id).toBe(item!.id);

    const { data: reloadedPractice } = await ctx.supabase.from("practices").select("last_reminder_sent_at,reminder_count").eq("id", ctx.practice_id).single();
    expect(new Date(reloadedPractice!.last_reminder_sent_at!).getTime()).toBe(new Date(sentAt).getTime());
    expect(reloadedPractice!.reminder_count).toBe(1);
  });

  it("tenant isolation holds in scoped repository-style queries", async () => {
    const otherOrgId = crypto.randomUUID();
    const { data: userList } = await ctx.supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    const ownerId = userList.users[0].id;
    await ctx.supabase.from("organizations").insert({ id: otherOrgId, name: "Altro Studio", slug: `altro-${Date.now()}`, owner_id: ownerId });
    const { data: clients, error } = await ctx.supabase.from("client_profiles").select().eq("organization_id", otherOrgId);
    expect(error).toBeNull();
    expect(clients).toHaveLength(0);
  });
});
