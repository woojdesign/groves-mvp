-- Phase 1: Enterprise SSO & Multi-Tenancy Migration
-- Add SSO and RBAC fields to existing tables

-- AlterTable: Add SSO configuration to Org table
ALTER TABLE "orgs" ADD COLUMN "sso_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orgs" ADD COLUMN "sso_provider" TEXT;
ALTER TABLE "orgs" ADD COLUMN "saml_metadata_url" TEXT;
ALTER TABLE "orgs" ADD COLUMN "saml_entity_id" TEXT;
ALTER TABLE "orgs" ADD COLUMN "oidc_issuer" TEXT;
ALTER TABLE "orgs" ADD COLUMN "oidc_client_id" TEXT;
ALTER TABLE "orgs" ADD COLUMN "oidc_client_secret" TEXT;
ALTER TABLE "orgs" ADD COLUMN "sso_metadata" JSONB;

-- AlterTable: Add RBAC and SSO fields to User table
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN "sso_provider" TEXT;
ALTER TABLE "users" ADD COLUMN "sso_subject" TEXT;
ALTER TABLE "users" ADD COLUMN "sso_metadata" JSONB;

-- CreateIndex: Add index for SSO lookups
CREATE INDEX "users_sso_provider_sso_subject_idx" ON "users"("sso_provider", "sso_subject");

-- CreateTable: Admin Actions audit log
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "org_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Admin Actions indexes
CREATE INDEX "admin_actions_admin_id_idx" ON "admin_actions"("admin_id");
CREATE INDEX "admin_actions_org_id_idx" ON "admin_actions"("org_id");
CREATE INDEX "admin_actions_action_idx" ON "admin_actions"("action");
CREATE INDEX "admin_actions_created_at_idx" ON "admin_actions"("created_at");
