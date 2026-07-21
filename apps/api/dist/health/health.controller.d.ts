import { PrismaService } from "../prisma/prisma.service";
import type { ApiHealthResponse } from "@atelier/types";
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<ApiHealthResponse & {
        database: "connected" | "unavailable";
    }>;
}
