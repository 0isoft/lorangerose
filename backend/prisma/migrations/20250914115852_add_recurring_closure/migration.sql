-- CreateTable
CREATE TABLE "public"."GalleryItem" (
    "mediaAssetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("mediaAssetId")
);

-- CreateTable
CREATE TABLE "public"."RecurringClosure" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "slot" "public"."Slot" NOT NULL,
    "note" TEXT,
    "startsOn" TIMESTAMP(3),
    "endsOn" TIMESTAMP(3),
    "interval" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RecurringClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryItem_sortOrder_idx" ON "public"."GalleryItem"("sortOrder");

-- AddForeignKey
ALTER TABLE "public"."GalleryItem" ADD CONSTRAINT "GalleryItem_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "public"."MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
