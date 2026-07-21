// Shared types used by both apps/api and apps/web.
// Kept intentionally small in Step 1 — will grow with each module.

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiHealthResponse {
  status: "ok" | "error";
  service: string;
  timestamp: string;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface UserOrganizationSummary {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  roleName: string;
}

export interface CurrentUserResponse extends PublicUser {
  organizations: UserOrganizationSummary[];
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface OrganizationListItem {
  organizationId: string;
  name: string;
  slug: string;
  roleName: string;
  joinedAt: string;
}

export interface OrganizationMember {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  joinedAt: string;
}

export interface OrganizationRole {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
}
