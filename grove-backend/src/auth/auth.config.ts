export class AuthConfig {
  static isSamlEnabled(): boolean {
    const cert = process.env.SAML_CERT;
    const entryPoint = process.env.SAML_ENTRY_POINT;

    return !!(
      cert &&
      entryPoint &&
      !cert.includes('dummy') &&
      !cert.includes('CHANGE') &&
      !entryPoint.includes('dev.example.com')
    );
  }

  static isOidcEnabled(): boolean {
    const issuer = process.env.OIDC_ISSUER;
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;

    return !!(
      issuer &&
      clientId &&
      clientSecret &&
      !issuer.includes('dev.example.com') &&
      !clientId.includes('dev-client-id')
    );
  }
}
