export const ALLOWED_UPLOAD_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif"]);
export const MAX_UPLOAD_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES_PER_PRACTICE_ITEM = 10;

export type UploadableFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export function sanitizeFileName(fileName: string) {
  const normalized = fileName.normalize("NFKD").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return normalized || "documento";
}

export function validateUploadFile(file: Pick<UploadableFile, "type" | "size">) {
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) throw new Error("Formato file non supportato.");
  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) throw new Error("Il file supera il limite di 25 MB.");
}

export function assertCanAddFileToPracticeItem(existingActiveFileCount: number) {
  if (existingActiveFileCount >= MAX_FILES_PER_PRACTICE_ITEM) throw new Error("Hai gia caricato il numero massimo di file per questo documento.");
}
