-- CreateTable
CREATE TABLE "public"."BusinessHours" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "lunchStartMin" INTEGER,
    "lunchEndMin" INTEGER,
    "dinnerStartMin" INTEGER,
    "dinnerEndMin" INTEGER,
    "closedAllDay" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "BusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_weekday_effectiveFrom_key" ON "public"."BusinessHours"("weekday", "effectiveFrom");
