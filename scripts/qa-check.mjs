import { createSupabaseAdmin, ensureDevSeed, DEFAULT_730_TEMPLATE_KEY } from "./lib/dev-seed.mjs";

const REQUIRED_TABLES = [
  "profiles",
  "organizations",
  "organization_members",
  "client_profiles",
  "checklist_templates",
  "checklist_template_categories",
  "checklist_template_items",
  "practices",
  "practice_items",
  "client_requests",
  "document_records",
  "activity_log_events",
  "reminders"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertNoError(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result;
}

async function main() {
  const supabase = createSupabaseAdmin(process.cwd());
  const seed = await ensureDevSeed({ rootDir: process.cwd(), verbose: false });
  const checks = [];

  const tableResult = await assertNoError(
    await supabase.rpc("check_required_public_tables", { table_names: REQUIRED_TABLES }),
    "Failed to verify required tables"
  );
  const missingTables = tableResult.data ?? [];
  assert(missingTables.length === 0, `Missing required public tables: ${missingTables.join(", ")}`);
  checks.push(`required tables present (${REQUIRED_TABLES.length})`);

  const templateResult = await assertNoError(
    await supabase
      .from("checklist_templates")
      .select("id,key,is_default,organization_id")
      .eq("key", DEFAULT_730_TEMPLATE_KEY)
      .eq("is_default", true)
      .is("organization_id", null)
      .single(),
    "Default 730 template lookup failed"
  );
  checks.push("default 730 template exists");

  const templateItemsResult = await assertNoError(
    await supabase
      .from("checklist_template_items")
      .select("id", { count: "exact", head: true })
      .eq("template_id", templateResult.data.id),
    "Default 730 template item count failed"
  );
  assert(templateItemsResult.count === 29, `Default 730 template has ${templateItemsResult.count} items instead of 29.`);
  checks.push("default 730 template has exactly 29 items");

  const bucketResult = await assertNoError(
    await supabase.schema("storage").from("buckets").select("id,public").eq("id", "client-documents").single(),
    "Storage bucket lookup failed"
  );
  assert(bucketResult.data.public === false, "client-documents bucket exists but is public.");
  checks.push("client-documents bucket exists and is private");

  const practiceItemsResult = await assertNoError(
    await supabase
      .from("practice_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", seed.organization_id)
      .eq("practice_id", seed.practice_id),
    "Seed practice item count failed"
  );
  assert(practiceItemsResult.count === 29, `Seed practice has ${practiceItemsResult.count} items instead of 29.`);
  checks.push("seed practice has exactly 29 items");

  const publicLinkResult = await assertNoError(
    await supabase
      .from("practices")
      .select("id,public_token,public_link_enabled")
      .eq("id", seed.practice_id)
      .single(),
    "Seed practice public token lookup failed"
  );
  assert(publicLinkResult.data.public_token, "Seed practice does not have a public token.");
  assert(publicLinkResult.data.public_link_enabled === true, "Seed practice public link is not enabled.");
  checks.push("seed practice public token exists and link is enabled");

  console.log(JSON.stringify({ ok: true, checks, seed: {
    organization_id: seed.organization_id,
    client_id: seed.client_id,
    practice_id: seed.practice_id,
    public_token: seed.public_token,
    studio_practice_url: seed.studio_practice_url,
    public_portal_url: seed.public_portal_url
  } }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
