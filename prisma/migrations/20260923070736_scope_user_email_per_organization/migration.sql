-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "status";

-- DropEnum
DROP TYPE "OrgStatus";

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_email_key" ON "User"("organizationId", "email");

