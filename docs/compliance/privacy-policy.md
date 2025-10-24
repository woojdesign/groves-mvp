# Privacy Policy

**Version**: 1.0
**Last Updated**: October 23, 2025
**Effective Date**: October 23, 2025

## 1. Introduction

Grove ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our professional networking service.

## 2. Information We Collect

### 2.1 Information You Provide

- **Account Information**: Email address, name, organization affiliation
- **Profile Information**: Professional interests, current projects, connection preferences, career focus areas
- **Communication Data**: Feedback on matches, safety reports, messages through introductions

### 2.2 Automatically Collected Information

- **Usage Data**: Login times, feature interactions, match acceptance/rejection patterns
- **Technical Data**: IP address, user-agent (browser/device), session information
- **Log Data**: All user actions are logged with timestamps for security and audit purposes

### 2.3 Information from Third Parties

- **SSO Providers**: If you use SAML or OIDC authentication (e.g., through your organization), we receive basic profile information including your email, name, and SSO identifier from your identity provider

## 3. How We Use Your Information

We use your information to:

- **Provide Our Service**: Generate meaningful professional matches based on your interests and projects
- **Improve Matching Algorithm**: Analyze aggregated patterns to improve match quality
- **Communication**: Send match notifications, introduction emails when mutual interest is confirmed
- **Security & Safety**: Monitor for abuse, enforce our terms, investigate safety reports
- **Legal Compliance**: Maintain audit trails for regulatory requirements, respond to legal requests
- **Service Operations**: Debug issues, optimize performance, maintain infrastructure

## 4. How We Share Your Information

### 4.1 With Other Users

- **Before Mutual Match**: Only your first name and aggregated interests (no email or full profile)
- **After Mutual Match**: Full name, email address, and shared interests are revealed to facilitate connection

### 4.2 With Service Providers

- **Email Service**: Postmark (for transactional emails)
- **AI Services**: OpenAI (for generating embedding vectors from profile text)
- **Infrastructure**: AWS/Cloud hosting providers (for database and application hosting)

### 4.3 With Your Organization

If you are using Grove through an organizational SSO login, your organization may have access to:
- Aggregated usage statistics (not individual activity logs)
- User roster (who in the organization is using Grove)

We do NOT share individual match details, profile content, or private messages with your organization.

### 4.4 Legal Requirements

We may disclose your information if required by law, court order, or government request, or to protect our legal rights and safety.

## 5. Your Rights (GDPR)

You have the following rights regarding your personal data:

### 5.1 Right to Access (Article 15)

You can download all your data at any time by visiting **Account Settings → Export My Data** or by calling our API endpoint `GET /api/users/me/export`.

### 5.2 Right to Erasure (Article 17)

You can permanently delete your account and all associated data by visiting **Account Settings → Delete Account** or by calling our API endpoint `DELETE /api/users/me`. This action is irreversible.

### 5.3 Right to Rectification (Article 16)

You can update your profile information, name, and preferences at any time through your account settings.

### 5.4 Right to Data Portability (Article 20)

Your data export (JSON format) can be imported into other services. The export includes all your profile data, match history, and activity logs.

### 5.5 Right to Object (Article 21)

You can pause your account to temporarily stop receiving matches by setting your account status to "paused."

### 5.6 Right to Withdraw Consent (Article 7)

You can withdraw consent for data processing at any time by deleting your account.

## 6. Data Retention

- **Active Accounts**: We retain your data as long as your account is active
- **Deleted Accounts**: Upon account deletion, all personal data is permanently removed within 30 days
- **Audit Logs**: Security and compliance logs are retained for 7 years to meet regulatory requirements, but personal identifiers are pseudonymized after account deletion

## 7. Data Security

We implement industry-standard security measures:

- **Encryption at Rest**: All database data is encrypted
- **Encryption in Transit**: All API communication uses TLS/HTTPS
- **Field-Level Encryption**: Sensitive PII (email, name, profile text) is encrypted at the application layer
- **Access Controls**: Role-based access with multi-factor authentication for administrators
- **Audit Logging**: All data access and modifications are logged with IP address and user-agent tracking

## 8. International Data Transfers

Your data may be transferred to and stored in servers located outside your country of residence. We ensure appropriate safeguards are in place through:
- EU-US Data Privacy Framework (if applicable)
- Standard Contractual Clauses with our service providers
- Adequate data protection measures as required by GDPR

## 9. Children's Privacy

Grove is not intended for users under 18 years of age. We do not knowingly collect information from minors. If you believe we have inadvertently collected information from a minor, please contact us immediately.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. We will notify you of material changes via email or prominent notice in the application.

## 11. Contact Us

If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:

**Email**: privacy@grove.app
**Address**: [Your Company Address]
**Data Protection Officer**: [DPO Contact Info]

## 12. Supervisory Authority

If you are in the EU/EEA, you have the right to lodge a complaint with your local data protection authority.

---

**Consent**

By using Grove, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described herein.
