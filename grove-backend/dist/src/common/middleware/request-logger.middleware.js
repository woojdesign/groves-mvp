"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggerMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RequestLoggerMiddleware = class RequestLoggerMiddleware {
    logger = new common_1.Logger('HTTP');
    use(req, res, next) {
        const { method, originalUrl, ip } = req;
        const userAgent = req.get('user-agent') || 'Unknown';
        const startTime = Date.now();
        res.on('finish', () => {
            const { statusCode } = res;
            const responseTime = Date.now() - startTime;
            const message = `${method} ${originalUrl} ${statusCode} ${responseTime}ms - IP: ${ip} - UA: ${userAgent}`;
            if (statusCode >= 500) {
                this.logger.error(message);
            }
            else if (statusCode >= 400) {
                this.logger.warn(message);
            }
            else {
                this.logger.log(message);
            }
            if (statusCode === 401) {
                this.logger.warn(`🔒 Unauthorized access attempt: ${method} ${originalUrl} - IP: ${ip}`);
            }
            else if (statusCode === 403) {
                this.logger.warn(`🚫 Forbidden access attempt: ${method} ${originalUrl} - IP: ${ip}`);
            }
        });
        next();
    }
};
exports.RequestLoggerMiddleware = RequestLoggerMiddleware;
exports.RequestLoggerMiddleware = RequestLoggerMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestLoggerMiddleware);
//# sourceMappingURL=request-logger.middleware.js.map