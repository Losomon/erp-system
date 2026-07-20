import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { ApiHealthResponse } from "@atelier/types";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<ApiHealthResponse & { database: "connected" | "unavailable" }> {
    let database: "connected" | "unavailable" = "unavailable";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "unavailable";
    }

    return {
      status: database === "connected" ? "ok" : "error",
      service: "atelier-api",
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
