import type { ChecklistTemplate, ChecklistTemplateCategory, ChecklistTemplateItem, ID, Practice, PracticeItem, PracticeItemStatus, PracticeStatus } from "@/types/models";

const COMPLETE_ITEM_STATUSES = new Set<PracticeItemStatus>(["approved", "not_needed"]);
const UPDATED_ITEM_STATUSES = new Set<PracticeItemStatus>(["uploaded", "approved", "not_needed", "needs_correction"]);

export type CreatePracticeInput = {
  organizationId: ID;
  clientId: ID;
  fiscalYear: number;
  template: ChecklistTemplate;
  categories: ChecklistTemplateCategory[];
  templateItems: ChecklistTemplateItem[];
  createId: () => ID;
  createPublicToken?: () => string;
  now: () => string;
};

export function createPracticeFromTemplate(input: CreatePracticeInput) {
  const timestamp = input.now();
  const practiceId = input.createId();
  const categoryById = new Map(input.categories.map((category) => [category.id, category]));
  const practice: Practice = {
    id: practiceId,
    organizationId: input.organizationId,
    clientId: input.clientId,
    templateId: input.template.id,
    fiscalYear: input.fiscalYear,
    status: "draft",
    publicToken: input.createPublicToken?.() ?? input.createId(),
    publicLinkEnabled: true,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const practiceItems: PracticeItem[] = input.templateItems.map((templateItem, index) => {
    const category = categoryById.get(templateItem.categoryId);
    if (!category) {
      throw new Error(`Missing category for template item ${templateItem.id}.`);
    }
    return {
      id: input.createId(),
      organizationId: input.organizationId,
      practiceId,
      templateItemId: templateItem.id,
      categoryName: category.name,
      label: templateItem.label,
      required: templateItem.required,
      status: "requested",
      note: null,
      sortOrder: index + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });

  return { practice, practiceItems };
}

export function calculatePracticeProgress(practiceItems: Pick<PracticeItem, "required" | "status">[]) {
  const requiredItems = practiceItems.filter((item) => item.required);
  if (requiredItems.length === 0) return 0;
  return requiredItems.filter((item) => COMPLETE_ITEM_STATUSES.has(item.status)).length / requiredItems.length;
}

export function countMissingRequiredItems(practiceItems: Pick<PracticeItem, "required" | "status">[]) {
  return practiceItems.filter((item) => item.required && !COMPLETE_ITEM_STATUSES.has(item.status)).length;
}

export function deriveSuggestedPracticeStatus(practice: Pick<Practice, "status">, practiceItems: Pick<PracticeItem, "required" | "status">[]): PracticeStatus {
  if (practice.status === "archived") return "archived";
  const requiredItems = practiceItems.filter((item) => item.required);
  const allComplete = requiredItems.length > 0 && requiredItems.every((item) => COMPLETE_ITEM_STATUSES.has(item.status));
  if (allComplete) return "complete";
  if (practiceItems.some((item) => item.status === "uploaded")) return "needs_review";
  if (practiceItems.some((item) => UPDATED_ITEM_STATUSES.has(item.status))) return "in_progress";
  if (practice.status === "sent") return "sent";
  return "draft";
}

export function assertSameOrganization(expectedOrganizationId: ID, records: Array<{ organizationId: ID }>) {
  const mismatched = records.find((record) => record.organizationId !== expectedOrganizationId);
  if (mismatched) throw new Error("Record does not belong to the active organization.");
}

export function formatProgressPercent(progress: number) {
  return Math.round(progress * 100);
}
