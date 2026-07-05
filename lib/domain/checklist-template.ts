import type { ChecklistTemplate, ChecklistTemplateCategory, ChecklistTemplateItem, ID } from "@/types/models";

export const DEFAULT_730_TEMPLATE_KEY = "modello-730-default";

export type SeededChecklistTemplate = {
  template: ChecklistTemplate;
  categories: ChecklistTemplateCategory[];
  items: ChecklistTemplateItem[];
};

type TemplateDefinition = { category: string; items: string[] };

export const DEFAULT_730_TEMPLATE_DEFINITION: TemplateDefinition[] = [
  { category: "Dati anagrafici", items: ["Documento di identita", "Tessera sanitaria / codice fiscale", "Dichiarazione anno precedente", "Dati coniuge e familiari a carico"] },
  { category: "Redditi", items: ["Certificazione Unica", "Altri redditi", "Redditi da locazione"] },
  { category: "Immobili", items: ["Contratti di affitto", "Mutuo / interessi passivi", "Atti di compravendita", "Visure o dati catastali disponibili"] },
  { category: "Spese sanitarie", items: ["Scontrini farmacia", "Fatture mediche", "Dispositivi medici", "Spese veterinarie"] },
  { category: "Spese famiglia e istruzione", items: ["Spese scolastiche", "Spese universitarie", "Attivita sportive figli", "Asilo nido"] },
  { category: "Previdenza e assicurazioni", items: ["Previdenza complementare", "Assicurazioni vita/infortuni", "Contributi colf/badanti"] },
  { category: "Bonus e detrazioni", items: ["Ristrutturazioni", "Ecobonus", "Bonus mobili", "Spese condominiali detraibili"] },
  { category: "Altro", items: ["Donazioni", "Spese funebri", "Altra documentazione rilevante"] }
];

export type IdFactory = () => ID;
export type DateFactory = () => string;

export function buildDefault730Template(createId: IdFactory, now: DateFactory, organizationId: ID | null = null): SeededChecklistTemplate {
  const timestamp = now();
  const templateId = createId();
  const template: ChecklistTemplate = {
    id: templateId,
    organizationId,
    key: DEFAULT_730_TEMPLATE_KEY,
    name: "Modello 730",
    description: "Checklist documentale standard per pratiche 730.",
    isDefault: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const categories: ChecklistTemplateCategory[] = [];
  const items: ChecklistTemplateItem[] = [];

  DEFAULT_730_TEMPLATE_DEFINITION.forEach((definition, categoryIndex) => {
    const categoryId = createId();
    categories.push({ id: categoryId, templateId, name: definition.category, sortOrder: categoryIndex + 1, createdAt: timestamp, updatedAt: timestamp });
    definition.items.forEach((label, itemIndex) => {
      items.push({ id: createId(), templateId, categoryId, label, required: true, sortOrder: itemIndex + 1, createdAt: timestamp, updatedAt: timestamp });
    });
  });

  return { template, categories, items };
}

export function findDefault730Template(templates: ChecklistTemplate[]) {
  return templates.find((template) => template.key === DEFAULT_730_TEMPLATE_KEY && template.isDefault);
}
