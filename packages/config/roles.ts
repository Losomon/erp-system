import { PermissionKey } from "./permissions";

// Every organization gets its own copy of these six roles at creation
// time (see apps/api organizations module). isSystem roles can't be
// renamed or deleted, but organizations can add custom roles later.

export const DEFAULT_ROLE_NAMES = [
  "Owner",
  "Admin",
  "Manager",
  "Accountant",
  "Sales Staff",
  "Employee",
] as const;

export type DefaultRoleName = (typeof DEFAULT_ROLE_NAMES)[number];

const ALL_PERMISSIONS: PermissionKey[] = [
  "organization.manage",
  "members.invite",
  "members.remove",
  "roles.manage",
  "audit_logs.read",
  "customers.read",
  "customers.create",
  "customers.update",
  "customers.delete",
  "products.read",
  "products.create",
  "products.update",
  "products.delete",
  "sales.read",
  "sales.create",
  "sales.update",
  "sales.delete",
  "invoices.read",
  "invoices.create",
  "invoices.approve",
  "invoices.delete",
  "payments.read",
  "payments.create",
  "inventory.read",
  "inventory.update",
];

/// Maps each default role to the permissions it's seeded with.
/// Owner always gets everything, defined explicitly (rather than derived)
/// so it stays correct even as new permissions are added — a reviewer
/// can see at a glance that Owner is meant to be a superset.
export const DEFAULT_ROLE_PERMISSIONS: Record<DefaultRoleName, PermissionKey[]> = {
  Owner: ALL_PERMISSIONS,

  Admin: [
    "members.invite",
    "members.remove",
    "roles.manage",
    "audit_logs.read",
    "customers.read",
    "customers.create",
    "customers.update",
    "customers.delete",
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "sales.read",
    "sales.create",
    "sales.update",
    "sales.delete",
    "invoices.read",
    "invoices.create",
    "invoices.approve",
    "invoices.delete",
    "payments.read",
    "payments.create",
    "inventory.read",
    "inventory.update",
  ],

  Manager: [
    "audit_logs.read",
    "customers.read",
    "customers.create",
    "customers.update",
    "products.read",
    "products.create",
    "products.update",
    "sales.read",
    "sales.create",
    "sales.update",
    "invoices.read",
    "invoices.create",
    "invoices.approve",
    "payments.read",
    "payments.create",
    "inventory.read",
    "inventory.update",
  ],

  Accountant: [
    "customers.read",
    "invoices.read",
    "invoices.create",
    "invoices.approve",
    "payments.read",
    "payments.create",
  ],

  "Sales Staff": [
    "customers.read",
    "customers.create",
    "customers.update",
    "products.read",
    "sales.read",
    "sales.create",
    "sales.update",
    "invoices.read",
    "invoices.create",
  ],

  Employee: ["customers.read", "products.read", "sales.read", "inventory.read"],
};
