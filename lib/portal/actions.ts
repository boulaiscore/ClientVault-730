"use server";

import { redirect } from "next/navigation";
import { getStudioRepository } from "@/lib/studio/repository";

function requiredString(formData: FormData, key: string) { const value = formData.get(key); if (typeof value !== "string" || !value.trim()) throw new Error(`Missing required field: ${key}.`); return value.trim(); }
function getUploadErrorMessage(error: unknown) { return error instanceof Error ? error.message : "Caricamento non riuscito."; }
export async function uploadPublicDocumentAction(formData: FormData) { const publicToken = requiredString(formData, "publicToken"); const practiceItemId = requiredString(formData, "practiceItemId"); const file = formData.get("file"); if (!(file instanceof File) || file.size === 0) redirect(`/p/${publicToken}?error=${encodeURIComponent("Seleziona un file da caricare.")}`); try { await getStudioRepository().uploadClientDocument(publicToken, practiceItemId, file); } catch (error) { redirect(`/p/${publicToken}?error=${encodeURIComponent(getUploadErrorMessage(error))}`); } redirect(`/p/${publicToken}?uploaded=1`); }
