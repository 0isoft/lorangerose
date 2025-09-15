-- CreateTable
CREATE TABLE "public"."AnnouncementMedia" (
    "announcementId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnnouncementMedia_pkey" PRIMARY KEY ("announcementId","mediaAssetId")
);

-- CreateIndex
CREATE INDEX "AnnouncementMedia_announcementId_sortOrder_idx" ON "public"."AnnouncementMedia"("announcementId", "sortOrder");

-- AddForeignKey
ALTER TABLE "public"."AnnouncementMedia" ADD CONSTRAINT "AnnouncementMedia_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnnouncementMedia" ADD CONSTRAINT "AnnouncementMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "public"."MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
