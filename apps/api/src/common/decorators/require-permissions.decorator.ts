import { SetMetadata } from "@nestjs/common";
import type { PermissionKey } from "@atelier/config";

export const PERMISSIONS_KEY = "requiredPermissions";

export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
