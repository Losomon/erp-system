// The complete catalog of permissions the system understands.
// Grouped by module so it stays readable as it grows in Steps 3-6.
// Format: "<resource>.<action>"

export const PERMISSIONS = [
  // Organization / identity administration
  "organization.manage",
  "members.invite",
  "members.remove",
  "roles.manage",
  "audit_logs.read",

  // Step 3 modules — declared now so seeding/roles don't need to change
  // shape later, even though the endpoints don't exist yet.
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
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  "organization.manage": "Update organization settings",
  "members.invite": "Invite new members to the organization",
  "members.remove": "Remove members from the organization",
  "roles.manage": "Create, edit, and assign roles",
  "audit_logs.read": "View the organization's audit log",

  "customers.read": "View customers",
  "customers.create": "Create customers",
  "customers.update": "Edit customers",
  "customers.delete": "Delete customers",

  "products.read": "View products",
  "products.create": "Create products",
  "products.update": "Edit products",
  "products.delete": "Delete products",

  "sales.read": "View sales orders",
  "sales.create": "Create sales orders",
  "sales.update": "Edit sales orders",
  "sales.delete": "Delete sales orders",

  "invoices.read": "View invoices",
  "invoices.create": "Create invoices",
  "invoices.approve": "Approve invoices",
  "invoices.delete": "Delete invoices",

  "payments.read": "View payments",
  "payments.create": "Record payments",

  "inventory.read": "View inventory levels",
  "inventory.update": "Adjust inventory levels",
};
