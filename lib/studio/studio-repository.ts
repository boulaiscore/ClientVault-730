import type { ActivityLogEvent, ChecklistTemplate, ChecklistTemplateCategory, ChecklistTemplateItem, ClientProfile, DocumentRecord, ID, Organization, Practice, PracticeItem, PracticeItemStatus, PracticeStatus, ReminderRecord } from "@/types/models";
import type { UploadableFile } from "@/lib/domain/document-upload";

export type ClientInput = { firstName: string; lastName: string; email?: string | null; phone?: string | null; taxCode?: string | null };
export type PracticeSummary = { practice: Practice; client: ClientProfile; progress: number; missingItemCount: number };
export type PracticeDetail = PracticeSummary & { items: PracticeItem[]; documents: DocumentRecord[] };
export type PublicPracticeDetail = PracticeDetail & { organization: Pick<Organization, "id" | "name" | "slug">; canUpload: boolean };
export type StudioDashboard = { totalPractices: number; inProgress: number; needsReview: number; complete: number; totalMissingDocuments: number; recentPractices: PracticeSummary[] };
export type ReminderRecordInput = { organizationId: ID; practiceId: ID; channel: ReminderRecord["channel"]; reminderType: ReminderRecord["reminderType"]; targetItemId?: ID | null; status: ReminderRecord["status"]; sentAt: string; payload: Record<string, unknown>; errorMessage?: string | null };
export type ActivityLogInput = { organizationId: ID; practiceId: ID | null; practiceItemId: ID | null; documentId: ID | null; eventType: ActivityLogEvent["eventType"]; actorType: ActivityLogEvent["actorType"]; metadata: Record<string, unknown> };

export interface StudioRepository {
  ensureDefault730Template(): Promise<{ template: ChecklistTemplate; categories: ChecklistTemplateCategory[]; items: ChecklistTemplateItem[] }>;
  getOrganization(organizationId: ID): Promise<Pick<Organization, "id" | "name" | "slug"> | null>;
  listClients(organizationId: ID, search?: string): Promise<ClientProfile[]>;
  getClient(organizationId: ID, clientId: ID): Promise<ClientProfile | null>;
  createClient(organizationId: ID, input: ClientInput): Promise<ClientProfile>;
  updateClient(organizationId: ID, clientId: ID, input: ClientInput): Promise<ClientProfile>;
  archiveClient(organizationId: ID, clientId: ID): Promise<void>;
  createPractice(organizationId: ID, clientId: ID, fiscalYear: number): Promise<Practice>;
  listPractices(organizationId: ID): Promise<PracticeSummary[]>;
  getPracticeDetail(organizationId: ID, practiceId: ID): Promise<PracticeDetail | null>;
  getPublicPractice(publicToken: string): Promise<PublicPracticeDetail | null>;
  logPublicLinkOpened(publicToken: string): Promise<void>;
  updatePracticeStatus(organizationId: ID, practiceId: ID, status: PracticeStatus): Promise<Practice>;
  updatePracticeItem(organizationId: ID, practiceItemId: ID, input: { status: PracticeItemStatus; required: boolean; note?: string | null; noteToClient?: string | null }): Promise<PracticeItem>;
  setPracticePublicLinkEnabled(organizationId: ID, practiceId: ID, enabled: boolean): Promise<Practice>;
  uploadClientDocument(publicToken: string, practiceItemId: ID, file: UploadableFile): Promise<DocumentRecord>;
  listPracticeDocuments(organizationId: ID, practiceId: ID): Promise<DocumentRecord[]>;
  createDocumentSignedUrl(organizationId: ID, documentId: ID): Promise<string>;
  deleteDocument(organizationId: ID, documentId: ID): Promise<void>;
  getDashboard(organizationId: ID): Promise<StudioDashboard>;
  createReminderRecord(input: ReminderRecordInput): Promise<ReminderRecord>;
  markPracticeReminderSent(organizationId: ID, practiceId: ID, sentAt: string): Promise<void>;
  recordActivityEvent(input: ActivityLogInput): Promise<void>;
  listReminderCandidates(intervalDays: number): Promise<Array<PracticeDetail & { organization: Pick<Organization, "id" | "name" | "slug"> }>>;
}

