-- Convierte el sitio de single-tenant a multi-tenant: agrega Organization y
-- la cuelga de todo lo demás. Sigue el patrón expand -> backfill -> contract:
-- 1) agregar columnas nullable, 2) rellenarlas con el tenant existente
--    (Elizabeth), 3) recién ahí exigir NOT NULL / agregar los constraints.
-- Así el sitio de Elizabeth sigue funcionando igual, ahora como el primer
-- tenant real, sin perder ni un dato.

-- ========== 1) Organization ==========

CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'xv_rosa_dorado',
    "status" "OrgStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- La organización del tenant que ya existe, armada con los datos que ya
-- están en EventSettings. Si esa fila "singleton" no existiera (no debería
-- pasar en este punto de la vida del proyecto), este INSERT no inserta nada
-- y los ALTER TABLE ... NOT NULL de más abajo van a fallar solos (ninguna
-- fila para respaldar el organizationId) — falla ruidosa en vez de dejar
-- datos huérfanos en silencio.
INSERT INTO "Organization" ("id", "slug", "name", "theme", "status", "createdAt")
SELECT
    'org_elizabeth_xv_seed',
    'elizabeth-xv',
    COALESCE(NULLIF("quinceaneraNombre", ''), 'Mi evento'),
    'xv_rosa_dorado',
    'ACTIVE',
    now()
FROM "EventSettings"
WHERE "id" = 'singleton';

-- ========== 2) User ==========

ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
UPDATE "User" SET "organizationId" = 'org_elizabeth_xv_seed' WHERE "role" IN ('ADMIN', 'GUEST');

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invariante de seguridad: solo MASTER puede no tener organización. Un
-- ADMIN/GUEST sin organizationId sería un bug grave (queries filtrando por
-- organizationId lo dejarían fuera de todo, o peor, algún camino que no
-- filtre podría tratarlo como si perteneciera a cualquier tenant).
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_required_unless_master"
    CHECK ("role" = 'MASTER' OR "organizationId" IS NOT NULL);

CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- ========== 3) PhotoRequest ==========

ALTER TABLE "PhotoRequest" ADD COLUMN "organizationId" TEXT;
UPDATE "PhotoRequest" SET "organizationId" = 'org_elizabeth_xv_seed';
ALTER TABLE "PhotoRequest" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "PhotoRequest" ADD CONSTRAINT "PhotoRequest_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "PhotoRequest_organizationId_idx" ON "PhotoRequest"("organizationId");

-- ========== 4) TrustedDevice ==========

ALTER TABLE "TrustedDevice" ADD COLUMN "organizationId" TEXT;
UPDATE "TrustedDevice" SET "organizationId" = 'org_elizabeth_xv_seed';
ALTER TABLE "TrustedDevice" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "TrustedDevice_organizationId_idx" ON "TrustedDevice"("organizationId");

-- ========== 5) DeviceVerification ==========

ALTER TABLE "DeviceVerification" ADD COLUMN "organizationId" TEXT;
UPDATE "DeviceVerification" SET "organizationId" = 'org_elizabeth_xv_seed';
ALTER TABLE "DeviceVerification" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "DeviceVerification" ADD CONSTRAINT "DeviceVerification_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "DeviceVerification_organizationId_idx" ON "DeviceVerification"("organizationId");

-- ========== 6) Invitation ==========
-- "email" deja de ser único global (dos clientes distintos de la
-- plataforma pueden invitar a la misma persona); "code" se queda único
-- global, es lo que resuelve la organización sin depender de la URL.

ALTER TABLE "Invitation" ADD COLUMN "organizationId" TEXT;
UPDATE "Invitation" SET "organizationId" = 'org_elizabeth_xv_seed';
ALTER TABLE "Invitation" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "Invitation_email_key";
CREATE UNIQUE INDEX "Invitation_organizationId_email_key" ON "Invitation"("organizationId", "email");

-- ========== 7) SiteSection ==========
-- "key" deja de ser la primary key (una fila global por sección); ahora es
-- única solo dentro de cada organización, con un "id" propio como PK.

ALTER TABLE "SiteSection" ADD COLUMN "id" TEXT;
ALTER TABLE "SiteSection" ADD COLUMN "organizationId" TEXT;

-- Id determinístico a partir de la key existente (no hace falta cuid real
-- acá, solo un string único; Prisma sí generará cuid() para las filas
-- nuevas que se creen desde la app).
UPDATE "SiteSection" SET
    "id" = 'section_' || "key",
    "organizationId" = 'org_elizabeth_xv_seed';

ALTER TABLE "SiteSection" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "SiteSection" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "SiteSection" DROP CONSTRAINT "SiteSection_pkey";
ALTER TABLE "SiteSection" ADD CONSTRAINT "SiteSection_pkey" PRIMARY KEY ("id");

ALTER TABLE "SiteSection" ADD CONSTRAINT "SiteSection_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "SiteSection_organizationId_key_key" ON "SiteSection"("organizationId", "key");

-- ========== 8) EventSettings ==========
-- Pasa de "una sola fila fija (id='singleton')" a "una fila por
-- organización" (organizationId es ahora la primary key, 1:1 con
-- Organization). También se renombra quinceaneraNombre -> tituloEvento,
-- ya no todos los eventos son XV años.

ALTER TABLE "EventSettings" ADD COLUMN "organizationId" TEXT;
UPDATE "EventSettings" SET "organizationId" = 'org_elizabeth_xv_seed' WHERE "id" = 'singleton';
ALTER TABLE "EventSettings" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "EventSettings" DROP CONSTRAINT "EventSettings_pkey";
ALTER TABLE "EventSettings" DROP COLUMN "id";
ALTER TABLE "EventSettings" ADD CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("organizationId");

ALTER TABLE "EventSettings" ADD CONSTRAINT "EventSettings_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventSettings" RENAME COLUMN "quinceaneraNombre" TO "tituloEvento";
