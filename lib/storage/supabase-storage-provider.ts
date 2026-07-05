import "server-only";

import { createServiceSupabaseClient } from "@/lib/db/supabase";
import type { StorageProvider, StoredObject, UploadInput } from "@/lib/storage/types";

export class SupabaseStorageProvider implements StorageProvider {
  private readonly supabase = createServiceSupabaseClient();

  async upload(input: UploadInput): Promise<StoredObject> {
    const { data, error } = await this.supabase.storage.from(input.bucket).upload(input.path, input.file, { contentType: input.contentType, upsert: false });
    if (error) throw new Error(`Failed to upload file: ${error.message}`);
    return { bucket: input.bucket, path: data.path };
  }

  async createSignedUrl(bucket: string, path: string, expiresInSeconds: number) {
    const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error) throw new Error(`Failed to create signed URL: ${error.message}`);
    return data.signedUrl;
  }

  async remove(bucket: string, paths: string[]) {
    if (paths.length === 0) return;
    const { error } = await this.supabase.storage.from(bucket).remove(paths);
    if (error) throw new Error(`Failed to remove files: ${error.message}`);
  }
}
