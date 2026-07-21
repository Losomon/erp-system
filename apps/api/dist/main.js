"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
        credentials: true,
    });
    app.setGlobalPrefix("api");
    const port = process.env.API_PORT ?? 4000;
    await app.listen(port);
    console.log(`Atelier ERP API running on http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map