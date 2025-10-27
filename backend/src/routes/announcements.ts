import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Public endpoints for viewing and managing restaurant announcements
 */

/**
 * @brief Schema for media link validation
 * @details Defines the structure for linking media assets to announcements
 */
const MediaLink = z.object({
  id: z.string().min(1),                  // mediaAssetId
  sortOrder: z.number().int().min(0).optional().default(0),
});

const AnnouncementCreate = z.object({
  date: z.coerce.date(),
  title: z.string().min(1).max(160),
  desc: z.string().max(1000).optional().nullable(),
  published: z.coerce.boolean().optional().default(true),
  media: z.array(MediaLink).optional().default([]),
});

const AnnouncementUpdate = AnnouncementCreate.partial();

const includeWithMedia = {
  media: {
    include: { asset: true },
    orderBy: { sortOrder: "asc" as const },
  },
};

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: Get all announcements
 *     description: Fetches all announcements ordered by date (newest first) with associated media assets.
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 */
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

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Create a new announcement
 *     description: Creates a new announcement with optional media attachments in a single transaction.
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementCreate'
 *     responses:
 *       201:
 *         description: Created announcement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Invalid request payload
 */
router.post("/", async (req, res) => {
  const data = AnnouncementCreate.parse(req.body);

  const created = await prisma.$transaction(async (tx) => {
    const a = await tx.announcement.create({
      data: {
        date: data.date,
        title: data.title,
        desc: data.desc ?? null,
        published: data.published ?? true,
      },
    });

    if (data.media && data.media.length) {
      await tx.announcementMedia.createMany({
        data: data.media.map(m => ({
          announcementId: a.id,
          mediaAssetId: m.id,
          sortOrder: m.sortOrder ?? 0,
        })),
        skipDuplicates: true,
      });
    }

    return tx.announcement.findUniqueOrThrow({
      where: { id: a.id },
      include: includeWithMedia,
    });
  });

  res.status(201).json({
    ...created,
    mediaAssets: created.media.map(m => ({ ...m.asset, _linkSortOrder: m.sortOrder })),
  });
});

/**
 * @swagger
 * /api/announcements/{id}:
 *   patch:
 *     summary: Update an existing announcement
 *     description: Updates announcement fields and optionally replaces media attachments.
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the announcement to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementUpdate'
 *     responses:
 *       200:
 *         description: Updated announcement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Announcement not found
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = AnnouncementUpdate.parse(req.body);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.announcement.update({
      where: { id },
      data: {
        date: data.date,
        title: data.title,
        desc: data.desc,
        published: data.published,
      },
    });

    if (data.media) {
      await tx.announcementMedia.deleteMany({ where: { announcementId: id } });
      if (data.media.length) {
        await tx.announcementMedia.createMany({
          data: data.media.map(m => ({
            announcementId: id,
            mediaAssetId: m.id,
            sortOrder: m.sortOrder ?? 0,
          })),
          skipDuplicates: true,
        });
      }
    }

    const r = await tx.announcement.findUniqueOrThrow({
      where: { id },
      include: includeWithMedia,
    });
    return r;
  });

  res.json({
    ...updated,
    mediaAssets: updated.media.map(m => ({ ...m.asset, _linkSortOrder: m.sortOrder })),
  });
});

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     description: Permanently removes an announcement and its associated media links.
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     responses:
 *       204:
 *         description: Deleted successfully (no content)
 *       404:
 *         description: Announcement not found
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.announcement.delete({ where: { id } });
  res.status(204).end();
});

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         title:
 *           type: string
 *         desc:
 *           type: string
 *           nullable: true
 *         published:
 *           type: boolean
 *         mediaAssets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MediaAssetLink'
 *     MediaAssetLink:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         url:
 *           type: string
 *         alt:
 *           type: string
 *           nullable: true
 *         _linkSortOrder:
 *           type: integer
 *     AnnouncementCreate:
 *       type: object
 *       required: [title, date]
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *         title:
 *           type: string
 *         desc:
 *           type: string
 *           nullable: true
 *         published:
 *           type: boolean
 *         media:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MediaLink'
 *     AnnouncementUpdate:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *         title:
 *           type: string
 *         desc:
 *           type: string
 *           nullable: true
 *         published:
 *           type: boolean
 *         media:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MediaLink'
 *     MediaLink:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         sortOrder:
 *           type: integer
 */

