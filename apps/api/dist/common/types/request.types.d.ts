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
declare module "express" {
    interface Request {
        user?: AuthenticatedUser;
        membership?: MembershipContext;
    }
}
