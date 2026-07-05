export type ID = string;

export type Timestamped = {
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = Timestamped & {
  id: ID;
  email: string;
  fullName: string | null;
};

export type Organization = Timestamped & {
  id: ID;
  name: string;
  slug: string;
  ownerId: ID;
};

export type OrganizationRole = "owner" | "admin" | "member";

export type OrganizationMember = Timestamped & {
  id: ID;
  organizationId: ID;
  userId: ID;
  role: OrganizationRole;
};

export type ClientProfile = Timestamped & {
  id: ID;
  organizationId: ID;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  taxCode: string | null;
  status: "active" | "archived";
};

export type ChecklistTemplate = Timestamped & {
  id: ID;
  organizationId: ID | null;
  key: string;
  name: string;
  description: string | null;
  isDefault: boolean;
};

export type ChecklistTemplateCategory = Timestamped & {
  id: ID;
  templateId: ID;
  name: string;
  sortOrder: number;
};

export type ChecklistTemplateItem = Timestamped & {
  id: ID;
  templateId: ID;
  categoryId: ID;
  label: string;
  required: boolean;
  sortOrder: number;
};

export type PracticeStatus = "draft" | "sent" | "in_progress" | "needs_review" | "complete" | "archived";
export type PracticeItemStatus = "requested" | "uploaded" | "needs_correction" | "approved" | "not_needed";

export type Practice = Timestamped & {
  id: ID;
  organizationId: ID;
  clientId: ID;
  templateId: ID;
  fiscalYear: number;
  status: PracticeStatus;
  publicToken: string;
  publicLinkEnabled: boolean;
  archivedAt: string | null;
};

export type PracticeItem = Timestamped & {
  id: ID;
  organizationId: ID;
  practiceId: ID;
  templateItemId: ID;
  categoryName: string;
  label: string;
  required: boolean;
  status: PracticeItemStatus;
  note: string | null;
  sortOrder: number;
};

export type ClientRequest = Timestamped & {
  id: ID;
  organizationId: ID;
  clientId: ID;
  title: string;
  description: string | null;
  status: "draft" | "sent" | "in_progress" | "completed" | "archived";
  dueAt: string | null;
};

export type DocumentUploadedByType = "client" | "studio";
export type DocumentStatus = "active" | "deleted";

export type DocumentRecord = Timestamped & {
  id: ID;
  organizationId: ID;
  clientId: ID;
  practiceId: ID | null;
  practiceItemId: ID | null;
  requestId: ID | null;
  storagePath: string;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedByType: DocumentUploadedByType;
  status: DocumentStatus;
};

export type ActivityEventType =
  | "public_link_opened"
  | "document_uploaded"
  | "document_deleted"
  | "public_link_disabled"
  | "public_link_enabled";

export type ActivityActorType = "client" | "studio" | "system";

export type ActivityLogEvent = Timestamped & {
  id: ID;
  organizationId: ID;
  practiceId: ID | null;
  practiceItemId: ID | null;
  documentId: ID | null;
  eventType: ActivityEventType;
  actorType: ActivityActorType;
  metadata: Record<string, unknown>;
};

export function getClientDisplayName(client: Pick<ClientProfile, "firstName" | "lastName">) {
  return `${client.firstName} ${client.lastName}`.trim();
}
