import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv, requiredEnv } from "./local-env.mjs";

export const DEFAULT_730_TEMPLATE_KEY = "modello-730-default";

export const DEFAULT_730_TEMPLATE_DEFINITION = [
  { category: "Dati anagrafici", items: ["Documento di identita", "Tessera sanitaria / codice fiscale", "Dichiarazione anno precedente", "Dati coniuge e familiari a carico"] },
  { category: "Redditi", items: ["Certificazione Unica", "Altri redditi", "Redditi da locazione"] },
  { category: "Immobili", items: ["Contratti di affitto", "Mutuo / interessi passivi", "Atti di compravendita", "Visure o dati catastali disponibili"] },
  { category: "Spese sanitarie", items: ["Scontrini farmacia", "Fatture mediche", "Dispositivi medici", "Spese veterinarie"] },
  { category: "Spese famiglia e istruzione", items: ["Spese scolastiche", "Spese universitarie", "Attivita sportive figli", "Asilo nido"] },
  { category: "Previdenza e assicurazioni", items: ["Previdenza complementare", "Assicurazioni vita/infortuni", "Contributi colf/badanti"] },
  { category: "Bonus e detrazioni", items: ["Ristrutturazioni", "Ecobonus", "Bonus mobili", "Spese condominiali detraibili"] },
  { category: "Altro", items: ["Donazioni", "Spese funebri", "Altra documentazione rilevante"] }
];

export function createSupabaseAdmin(rootDir = process.cwd()) {
  loadLocalEnv(rootDir);
  return createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false }
  });
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function getOrCreateAuthUser(supabase, email, password) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = users.users.find((user) => user.email === email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Studio Demo" }
  });
  if (error) throw error;
  return data.user;
}

async function ensureDefaultTemplate(supabase) {
  const { data: existing, error: selectError } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("key", DEFAULT_730_TEMPLATE_KEY)
    .eq("is_default", true)
    .is("organization_id", null)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing) {
    const { count, error: countError } = await supabase
      .from("checklist_template_items")
      .select("id", { count: "exact", head: true })
      .eq("template_id", existing.id);
    if (countError) throw countError;
    if (count !== 29) throw new Error(`Default 730 template exists but has ${count} items instead of 29.`);
    return existing;
  }

  const { data: template, error: templateError } = await supabase
    .from("checklist_templates")
    .insert({ key: DEFAULT_730_TEMPLATE_KEY, name: "Modello 730", description: "Checklist documentale standard per pratiche 730.", is_default: true })
    .select()
    .single();
  if (templateError) throw templateError;

  for (const [categoryIndex, definition] of DEFAULT_730_TEMPLATE_DEFINITION.entries()) {
    const { data: category, error: categoryError } = await supabase
      .from("checklist_template_categories")
      .insert({ template_id: template.id, name: definition.category, sort_order: categoryIndex + 1 })
      .select()
      .single();
    if (categoryError) throw categoryError;

    const { error: itemsError } = await supabase.from("checklist_template_items").insert(
      definition.items.map((label, itemIndex) => ({
        template_id: template.id,
        category_id: category.id,
        label,
        required: true,
        sort_order: itemIndex + 1
      }))
    );
    if (itemsError) throw itemsError;
  }

  return template;
}

async function ensurePrivateBucket(supabase, bucketName) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  const existing = buckets.find((bucket) => bucket.id === bucketName);
  if (existing) {
    const { error } = await supabase.storage.updateBucket(bucketName, { public: false });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.storage.createBucket(bucketName, { public: false });
  if (error) throw error;
}

export async function ensureDevSeed({ rootDir = process.cwd(), verbose = false } = {}) {
  const supabase = createSupabaseAdmin(rootDir);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const organizationId = process.env.CLIENTVAULT_DEV_ORGANIZATION_ID || "00000000-0000-4730-8000-000000000730";
  const bucketName = process.env.CLIENTVAULT_STORAGE_BUCKET || "client-documents";
  const email = process.env.DEV_SEED_EMAIL || "studio-demo@clientvault.local";
  const password = process.env.DEV_SEED_PASSWORD || "clientvault-dev-password";
  const clientEmail = process.env.DEV_SEED_CLIENT_EMAIL || "mario.rossi@example.local";
  const fiscalYear = Number(process.env.DEV_SEED_FISCAL_YEAR || "2025");

  await ensurePrivateBucket(supabase, bucketName);
  const user = await getOrCreateAuthUser(supabase, email, password);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email,
    full_name: "Studio Demo"
  });
  if (profileError) throw profileError;

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .upsert({ id: organizationId, name: "Studio Demo", slug: "studio-demo", owner_id: user.id }, { onConflict: "id" })
    .select()
    .single();
  if (orgError) throw orgError;

  const { error: memberError } = await supabase
    .from("organization_members")
    .upsert({ organization_id: organization.id, user_id: user.id, role: "owner" }, { onConflict: "organization_id,user_id" });
  if (memberError) throw memberError;

  const template = await ensureDefaultTemplate(supabase);

  let { data: client, error: clientSelectError } = await supabase
    .from("client_profiles")
    .select()
    .eq("organization_id", organization.id)
    .eq("email", clientEmail)
    .maybeSingle();
  if (clientSelectError) throw clientSelectError;

  if (!client) {
    const { data, error } = await supabase
      .from("client_profiles")
      .insert({ organization_id: organization.id, first_name: "Mario", last_name: "Rossi", email: clientEmail, phone: "+39 333 000 0000", tax_code: "RSSMRA80A01H501U" })
      .select()
      .single();
    if (error) throw error;
    client = data;
  }

  let { data: practice, error: practiceSelectError } = await supabase
    .from("practices")
    .select()
    .eq("organization_id", organization.id)
    .eq("client_id", client.id)
    .eq("fiscal_year", fiscalYear)
    .maybeSingle();
  if (practiceSelectError) throw practiceSelectError;

  if (!practice) {
    const { data, error } = await supabase
      .from("practices")
      .insert({ organization_id: organization.id, client_id: client.id, template_id: template.id, fiscal_year: fiscalYear, status: "draft", public_token: randomToken(), public_link_enabled: true })
      .select()
      .single();
    if (error) throw error;
    practice = data;
  } else if (!practice.public_link_enabled) {
    const { data, error } = await supabase
      .from("practices")
      .update({ public_link_enabled: true })
      .eq("id", practice.id)
      .select()
      .single();
    if (error) throw error;
    practice = data;
  }

  const { count: itemCount, error: itemCountError } = await supabase
    .from("practice_items")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    .eq("practice_id", practice.id);
  if (itemCountError) throw itemCountError;

  if (itemCount === 0) {
    const { data: categories, error: categoriesError } = await supabase
      .from("checklist_template_categories")
      .select()
      .eq("template_id", template.id)
      .order("sort_order", { ascending: true });
    if (categoriesError) throw categoriesError;
    const { data: templateItems, error: templateItemsError } = await supabase
      .from("checklist_template_items")
      .select()
      .eq("template_id", template.id)
      .order("sort_order", { ascending: true });
    if (templateItemsError) throw templateItemsError;

    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const { error: insertItemsError } = await supabase.from("practice_items").insert(
      templateItems.map((templateItem, index) => ({
        organization_id: organization.id,
        practice_id: practice.id,
        template_item_id: templateItem.id,
        category_name: categoryById.get(templateItem.category_id)?.name || "Altro",
        label: templateItem.label,
        required: templateItem.required,
        status: "requested",
        note: null,
        sort_order: index + 1
      }))
    );
    if (insertItemsError) throw insertItemsError;
  } else if (itemCount !== 29) {
    throw new Error(`Seeded practice has ${itemCount} items instead of 29.`);
  }

  const result = {
    organization_id: organization.id,
    client_id: client.id,
    practice_id: practice.id,
    public_token: practice.public_token,
    studio_practice_url: `${appUrl.replace(/\/$/, "")}/practices/${practice.id}`,
    public_portal_url: `${appUrl.replace(/\/$/, "")}/p/${practice.public_token}`
  };

  if (verbose) {
    console.log(JSON.stringify(result, null, 2));
  }

  return { supabase, ...result };
}
