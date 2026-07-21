import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
export interface IssuedTokens {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
}
export interface RequestMeta {
    userAgent?: string;
    ipAddress?: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly audit;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, audit: AuditService);
    register(dto: RegisterDto, meta: RequestMeta): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: Date;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto, meta: RequestMeta): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: Date;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
        };
    }>;
    refresh(rawRefreshToken: string, meta: RequestMeta): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: Date;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
        };
    }>;
    logout(rawRefreshToken: string | undefined, userId?: string): Promise<void>;
    getCurrentUser(userId: string): Promise<{
        organizations: any;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
    }>;
    verifyAccessToken(token: string): Promise<any>;
    private issueTokens;
    private hashToken;
    private toPublicUser;
}
