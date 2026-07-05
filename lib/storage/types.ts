export type UploadInput = { bucket: string; path: string; file: Blob | ArrayBuffer; contentType?: string };
export type StoredObject = { bucket: string; path: string; publicUrl?: string };
export interface StorageProvider {
  upload(input: UploadInput): Promise<StoredObject>;
  createSignedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string>;
  remove(bucket: string, paths: string[]): Promise<void>;
}
