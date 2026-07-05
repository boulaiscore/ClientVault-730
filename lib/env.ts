export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  storageBucket: process.env.CLIENTVAULT_STORAGE_BUCKET ?? "client-documents",
  studioRepositoryProvider: process.env.CLIENTVAULT_STUDIO_REPOSITORY ?? "supabase",
  developmentOrganizationId: process.env.CLIENTVAULT_DEV_ORGANIZATION_ID ?? "00000000-0000-4730-8000-000000000730"
};
