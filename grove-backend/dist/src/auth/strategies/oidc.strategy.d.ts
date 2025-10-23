import { VerifyCallback } from 'passport-openidconnect';
import { OidcService } from '../oidc/oidc.service';
import { ConfigService } from '@nestjs/config';
declare const OidcStrategy_base: new (options: import("passport-openidconnect").StrategyOptions) => import("passport-openidconnect") & {
    validate(...args: any[]): unknown;
};
export declare class OidcStrategy extends OidcStrategy_base {
    private oidcService;
    private configService;
    constructor(oidcService: OidcService, configService: ConfigService);
    validate(issuer: string, profile: any, context: any, idToken: any, accessToken: any, refreshToken: any, done: VerifyCallback): Promise<any>;
}
export {};
