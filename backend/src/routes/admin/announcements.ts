import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

const MediaLink = z.object({
  id: z.string().min(1),
  sortOrder: z.number().int().min(0).optional().default(0),
});

const AnnouncementCreate = z.object({
  date: z.coerce.date(),
  title: z.string().min(1).max(160),
  desc: z.string().max(1000).optional().nullable(),
  published: z.coerce.boolean().optional().default(true),
  media: z.array(MediaLink).optional().default([]),   // <-- NEW
});

const AnnouncementUpdate = AnnouncementCreate.partial();

const includeWithMedia = {
  media: {
    include: { asset: true },
    orderBy: { sortOrder: "asc" as const },
  },
};

router.get("/", async (_req, res) => {
  const rows = await prisma.announcement.findMany({
    orderBy: { date: "desc" },
    include: includeWithMedia,
  });
  const payload = rows.map(r => ({
    ...r,
    mediaAssets: r.media.map(m => ({ ...m.asset, _linkSortOrder: m.sortOrder })),
  }));
  res.json(payload);
});

router.post("/", async (req, res) => {
  const data = AnnouncementCreate.parse(req.body);

  const created = await prisma.$transaction(async (tx) => {
    const a = await tx.announcement.create({
      data: { date: data.date, title: data.title, desc: data.desc ?? null, published: data.published ?? true },
    });
    if (data.media?.length) {
      await tx.announcementMedia.createMany({
        data: data.media.map(m => ({ announcementId: a.id, mediaAssetId: m.id, sortOrder: m.sortOrder ?? 0 })),
        skipDuplicates: true,
      });
    }
    return tx.announcement.findUniqueOrThrow({ where: { id: a.id }, include: includeWithMedia });
  });

  res.status(201).json({
    ...created,
    mediaAssets: created.media.map(m => ({ ...m.asset, _linkSortOrder: m.sortOrder })),
  });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = AnnouncementUpdate.parse(req.body);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.announcement.update({
      where: { id },
      data: { date: data.date, title: data.title, desc: data.desc, published: data.published },
    });

    if (data.media) {
      await tx.announcementMedia.deleteMany({ where: { announcementId: id } });
      if (data.media.length) {
        await tx.announcementMedia.createMany({
          data: data.media.map(m => ({ announcementId: id, mediaAssetId: m.id, sortOrder: m.sortOrder ?? 0 })),
          skipDuplicates: true,
        });
      }
    }

    return tx.announcement.findUniqueOrThrow({ where: { id }, include: includeWithMedia });
  });

  res.json({
    ...updated,
    mediaAssets: updated.media.map(m => ({ ...m.asset, _linkSortOrder: m.sortOrder })),
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.announcement.delete({ where: { id } });
  res.status(204).end();
});

export default router;
