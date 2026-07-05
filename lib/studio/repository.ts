import "server-only";

import { env } from "@/lib/env";
import { InMemoryStudioRepository } from "@/lib/studio/memory-store";
import { SupabaseStudioRepository } from "@/lib/studio/supabase-studio-repository";
import type { StudioRepository } from "@/lib/studio/studio-repository";

let repository: StudioRepository | null = null;
export function getStudioRepository(): StudioRepository {
  if (repository) return repository;
  repository = env.studioRepositoryProvider === "memory" ? new InMemoryStudioRepository() : new SupabaseStudioRepository();
  return repository;
}
