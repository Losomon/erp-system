import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import type { AuthenticatedUser } from "../common/types/request.types";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: Request, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto, req: Request, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
        };
    }>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
        };
    }>;
    logout(user: AuthenticatedUser, req: Request, res: Response): Promise<{
        success: boolean;
    }>;
    me(user: AuthenticatedUser): Promise<{
        organizations: any;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
    }>;
    private requestMeta;
    private setRefreshCookie;
}
