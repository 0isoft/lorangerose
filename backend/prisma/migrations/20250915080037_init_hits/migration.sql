-- AlterTable
ALTER TABLE "public"."BusinessHours" ADD COLUMN     "displayText" TEXT;

-- CreateTable
CREATE TABLE "public"."Hit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ipHash" TEXT,
    "city" TEXT,
    "country" TEXT,
    "sessionId" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Hit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hit_createdAt_idx" ON "public"."Hit"("createdAt");

-- CreateIndex
CREATE INDEX "Hit_path_createdAt_idx" ON "public"."Hit"("path", "createdAt");

-- CreateIndex
CREATE INDEX "Hit_city_country_idx" ON "public"."Hit"("city", "country");
