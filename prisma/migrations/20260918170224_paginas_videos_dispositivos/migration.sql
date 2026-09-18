-- CreateEnum
CREATE TYPE "EventPhase" AS ENUM ('PRE_EVENT', 'EVENT');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- AlterTable
ALTER TABLE "PhotoRequest" ADD COLUMN     "mediaType" "MediaType" NOT NULL DEFAULT 'PHOTO',
ADD COLUMN     "phase" "EventPhase" NOT NULL DEFAULT 'EVENT';

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSection" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SiteSection_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "EventSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "quinceaneraNombre" TEXT NOT NULL,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT NOT NULL,
    "lema" TEXT NOT NULL,
    "indicaciones" TEXT NOT NULL DEFAULT '',
    "saveTheDateMensaje" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_tokenHash_key" ON "TrustedDevice"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceVerification_tokenHash_key" ON "DeviceVerification"("tokenHash");

-- AddForeignKey
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceVerification" ADD CONSTRAINT "DeviceVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
