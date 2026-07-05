import { env } from "@/lib/env";
import type { ID, Organization } from "@/types/models";

export const DEVELOPMENT_ORGANIZATION_ID: ID = env.developmentOrganizationId;

const developmentOrganization: Organization = { id: DEVELOPMENT_ORGANIZATION_ID, name: "Studio Demo", slug: "studio-demo", ownerId: "00000000-0000-4730-8000-000000000001", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

export interface OrganizationResolver { getCurrentOrganization(): Promise<Organization> }
export class DevelopmentOrganizationResolver implements OrganizationResolver { async getCurrentOrganization() { return developmentOrganization; } }
const organizationResolver = new DevelopmentOrganizationResolver();
export async function getCurrentOrganization() { return organizationResolver.getCurrentOrganization(); }
