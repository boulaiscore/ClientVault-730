import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_730_TEMPLATE_KEY: string;
export const DEFAULT_730_TEMPLATE_DEFINITION: Array<{ category: string; items: string[] }>;
export function createSupabaseAdmin(rootDir?: string): SupabaseClient;
export function ensureDevSeed(options?: { rootDir?: string; verbose?: boolean }): Promise<{
  supabase: SupabaseClient;
  organization_id: string;
  client_id: string;
  practice_id: string;
  public_token: string;
  studio_practice_url: string;
  public_portal_url: string;
}>;
