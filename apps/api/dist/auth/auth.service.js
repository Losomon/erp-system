"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let AuthService = class AuthService {
    constructor(prisma, jwt, config, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.audit = audit;
    }
    async register(dto, meta) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.ConflictException("An account with this email already exists");
        }
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
            },
        });
        await this.audit.log({
            userId: user.id,
            action: "USER_REGISTERED",
            entityType: "User",
            entityId: user.id,
        });
        const tokens = await this.issueTokens(user.id, meta);
        return { user: this.toPublicUser(user), ...tokens };
    }
    async login(dto, meta) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException("Invalid email or password");
        }
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            await this.audit.log({
                userId: user.id,
                action: "USER_LOGIN_FAILED",
                entityType: "User",
                entityId: user.id,
            });
            throw new common_1.UnauthorizedException("Invalid email or password");
        }
        await this.audit.log({
            userId: user.id,
            action: "USER_LOGIN",
            entityType: "User",
            entityId: user.id,
        });
        const tokens = await this.issueTokens(user.id, meta);
        return { user: this.toPublicUser(user), ...tokens };
    }
    async refresh(rawRefreshToken, meta) {
        const tokenHash = this.hashToken(rawRefreshToken);
        const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException("Refresh token is invalid or expired");
        }
        await this.prisma.refreshToken.update({
            where: { id: existing.id },
            data: { revokedAt: new Date() },
        });
        const user = await this.prisma.user.findUnique({ where: { id: existing.userId } });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException("Account is no longer active");
        }
        const tokens = await this.issueTokens(user.id, meta);
        return { user: this.toPublicUser(user), ...tokens };
    }
    async logout(rawRefreshToken, userId) {
        if (rawRefreshToken) {
            const tokenHash = this.hashToken(rawRefreshToken);
            await this.prisma.refreshToken.updateMany({
                where: { tokenHash, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        if (userId) {
            await this.audit.log({
                userId,
                action: "USER_LOGOUT",
                entityType: "User",
                entityId: userId,
            });
        }
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                memberships: {
                    include: { organization: true, role: true },
                },
            },
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return {
            ...this.toPublicUser(user),
            organizations: user.memberships.map((m) => ({
                organizationId: m.organizationId,
                organizationName: m.organization.name,
                organizationSlug: m.organization.slug,
                roleName: m.role.name,
            })),
        };
    }
    async verifyAccessToken(token) {
        return this.jwt.verifyAsync(token, {
            secret: this.config.get("JWT_ACCESS_SECRET"),
        });
    }
    async issueTokens(userId, meta) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email }, {
            secret: this.config.get("JWT_ACCESS_SECRET"),
            expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN") ?? "15m",
        });
        const rawRefreshToken = (0, node_crypto_1.randomBytes)(48).toString("hex");
        const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: this.hashToken(rawRefreshToken),
                expiresAt: refreshTokenExpiresAt,
                userAgent: meta.userAgent,
                ipAddress: meta.ipAddress,
            },
        });
        return { accessToken, refreshToken: rawRefreshToken, refreshTokenExpiresAt };
    }
    hashToken(raw) {
        return (0, node_crypto_1.createHash)("sha256").update(raw).digest("hex");
    }
    toPublicUser(user) {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, config_1.ConfigService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map