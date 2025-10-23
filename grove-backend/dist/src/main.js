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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const Sentry = __importStar(require("@sentry/node"));
const app_module_1 = require("./app.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const csrf_guard_1 = require("./common/guards/csrf.guard");
const prisma_exception_filter_1 = require("./common/filters/prisma-exception.filter");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const security_headers_middleware_1 = require("./common/middleware/security-headers.middleware");
const request_logger_middleware_1 = require("./common/middleware/request-logger.middleware");
const tenant_context_middleware_1 = require("./common/middleware/tenant-context.middleware");
const org_filter_interceptor_1 = require("./common/interceptors/org-filter.interceptor");
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
    });
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3000',
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        exposedHeaders: ['Set-Cookie'],
    });
    app.use(new security_headers_middleware_1.SecurityHeadersMiddleware().use.bind(new security_headers_middleware_1.SecurityHeadersMiddleware()));
    app.use(new request_logger_middleware_1.RequestLoggerMiddleware().use.bind(new request_logger_middleware_1.RequestLoggerMiddleware()));
    app.use(new tenant_context_middleware_1.TenantContextMiddleware().use.bind(new tenant_context_middleware_1.TenantContextMiddleware()));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaExceptionFilter(), new global_exception_filter_1.GlobalExceptionFilter());
    const reflector = app.get(core_1.Reflector);
    app.useGlobalGuards(new jwt_auth_guard_1.JwtAuthGuard(reflector), new csrf_guard_1.CsrfGuard(reflector));
    app.useGlobalInterceptors(new org_filter_interceptor_1.OrgFilterInterceptor(reflector));
    app.setGlobalPrefix(process.env.API_PREFIX || 'api');
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 Grove Backend API running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map