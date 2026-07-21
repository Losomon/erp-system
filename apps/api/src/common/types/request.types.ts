export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface MembershipContext {
  membershipId: string;
  organizationId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

// Augments Express's Request type once, so every controller can just
// write `req.user` / `req.membership` without re-declaring this.
declare module "express" {
  interface Request {
    user?: AuthenticatedUser;
    membership?: MembershipContext;
  }
}
