"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const reflector = app.get(core_1.Reflector);
    app.useGlobalGuards(new jwt_auth_guard_1.JwtAuthGuard(reflector));
    app.setGlobalPrefix(process.env.API_PREFIX || 'api');
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 Grove Backend API running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map