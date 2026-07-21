import { CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthService } from "../auth.service";
import "../../common/types/request.types";
export declare class JwtAuthGuard implements CanActivate {
    private readonly authService;
    constructor(authService: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractToken;
}
