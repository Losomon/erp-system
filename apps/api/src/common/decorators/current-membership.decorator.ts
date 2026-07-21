import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import "../types/request.types";

export const CurrentMembership = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.membership;
});
