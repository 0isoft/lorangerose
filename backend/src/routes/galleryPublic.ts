// server/routes/galleryPublic.ts
export {}; 
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/gallery
router.get("/", async (_req, res) => {
  const items = await prisma.galleryItem.findMany({
    where: {
      published: true,
      asset: { published: true }, // asset must also be published
    },
    orderBy: { sortOrder: "asc" },
    select: {
      sortOrder: true,
      asset: {
        select: {
          id: true,
          url: true,
          alt: true,
          width: true,
          height: true,
        },
      },
    },
  });

  // Flatten to a MediaAsset-like shape the front-end already expects
  const out = items.map((g) => ({
    id: g.asset.id,
    type: "GALLERY" as const,
    url: g.asset.url,
    alt: g.asset.alt ?? null,
    sortOrder: g.sortOrder,
    published: true,
    width: g.asset.width ?? null,
    height: g.asset.height ?? null,
  }));

  // Optional caching
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json(out);
});

export default router;
