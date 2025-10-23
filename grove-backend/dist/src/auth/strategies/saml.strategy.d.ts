import { Strategy, Profile } from 'passport-saml';
import { SamlService } from '../saml/saml.service';
import { ConfigService } from '@nestjs/config';
declare const SamlStrategy_base: new (...args: [options: import("passport-saml").SamlConfig] | [options: import("passport-saml").SamlConfig]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class SamlStrategy extends SamlStrategy_base {
    private samlService;
    private configService;
    constructor(samlService: SamlService, configService: ConfigService);
    validate(profile: Profile): Promise<any>;
}
export {};
