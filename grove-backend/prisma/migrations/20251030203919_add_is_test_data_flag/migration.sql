-- AlterTable: Add isTestData flag to users table
ALTER TABLE "users" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add isTestData flag to profiles table
ALTER TABLE "profiles" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: Add index on isTestData for users table
CREATE INDEX "users_is_test_data_idx" ON "users"("is_test_data");

-- CreateIndex: Add index on isTestData for profiles table
CREATE INDEX "profiles_is_test_data_idx" ON "profiles"("is_test_data");
