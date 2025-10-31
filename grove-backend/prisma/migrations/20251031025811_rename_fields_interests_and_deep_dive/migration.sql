/*
  Warnings:

  - You are about to drop the column `niche_interest` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `rabbit_hole` on the `profiles` table. All the data in the column will be lost.
  - Added the required column `interests` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "niche_interest",
DROP COLUMN "rabbit_hole",
ADD COLUMN     "deep_dive" TEXT,
ADD COLUMN     "interests" TEXT NOT NULL;
