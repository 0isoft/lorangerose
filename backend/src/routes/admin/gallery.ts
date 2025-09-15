// src/routes/admin/gallery.ts
import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import type { AuthedRequest } from "../../middleware/requireAdmin";

const router = Router();

const UpsertSchema = z.object({
  mediaAssetId: z.string().cuid(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  published: z.coerce.boolean().default(true),
});

// GET /api/admin/gallery  -> list all gallery items (with asset data)
router.get("/", async (_req, res) => {
  const items = await prisma.galleryItem.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      mediaAssetId: true,
      sortOrder: true,
      published: true,
      asset: {
        select: {
          id: true, url: true, alt: true, width: true, height: true,
          type: true, sortOrder: true, published: true,
        },
      },
    },
  });

  // flatten for frontend re-use of MediaAsset
  const out = items.map((g) => ({
    id: g.asset.id,
    type: g.asset.type,
    url: g.asset.url,
    alt: g.asset.alt ?? null,
    width: g.asset.width ?? null,
    height: g.asset.height ?? null,
    sortOrder: g.sortOrder,            // ← gallery ordering
    published: g.published,            // ← gallery published flag
    _linkSortOrder: g.sortOrder,       // optional, if you want to distinguish later
  }));
  res.json(out);
});

// POST /api/admin/gallery  -> add/update (upsert) an asset into gallery
router.post("/", async (req: AuthedRequest, res) => {
  const body = UpsertSchema.parse(req.body);
  const item = await prisma.galleryItem.upsert({
    where: { mediaAssetId: body.mediaAssetId },
    update: { sortOrder: body.sortOrder, published: body.published },
    create: body,
  });
  res.status(201).json(item);
});

// PATCH /api/admin/gallery/:mediaAssetId  -> update link fields
router.patch("/:mediaAssetId", async (req: AuthedRequest, res) => {
  const { mediaAssetId } = req.params;
  const body = UpsertSchema.partial().parse(req.body);
  const item = await prisma.galleryItem.update({
    where: { mediaAssetId },
    data: body,
  });
  res.json(item);
});

// DELETE /api/admin/gallery/:mediaAssetId  -> remove from gallery (keeps MediaAsset)
router.delete("/:mediaAssetId", async (req: AuthedRequest, res) => {
  const { mediaAssetId } = req.params;
  await prisma.galleryItem.delete({ where: { mediaAssetId } });
  res.status(204).end();
});

export default router;
