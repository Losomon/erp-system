import type { PermissionKey } from "@atelier/config";
export declare const PERMISSIONS_KEY = "requiredPermissions";
export declare const RequirePermissions: (...permissions: PermissionKey[]) => import("@nestjs/common").CustomDecorator<string>;
