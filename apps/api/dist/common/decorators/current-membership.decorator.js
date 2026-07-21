"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentMembership = void 0;
const common_1 = require("@nestjs/common");
require("../types/request.types");
exports.CurrentMembership = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.membership;
});
//# sourceMappingURL=current-membership.decorator.js.map