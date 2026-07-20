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
