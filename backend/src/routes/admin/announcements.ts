/**
 * @file announcements.ts
 * @brief Admin API routes for managing announcements and their associated media links.
 * @details
 * Exposes CRUD endpoints for manipulating announcements, supporting media asset linking.
 * All endpoints require admin authentication (should be mounted under an admin-protected route).
 */

/**
 * @swagger
 * tags:
 *   name: AdminAnnouncements
 *   description: Admin API for managing announcements (requires authentication)
 */

/**
 * @swagger
 * /api/admin/announcements:
 *   get:
 *     summary: Get all announcements
 *     description: >
 *       Returns a list of all announcements with their associated media assets (sorted by date descending).
 *     tags: [AdminAnnouncements]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of announcements with media assets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 *
 *   post:
 *     summary: Create a new announcement
 *     description: >
 *       Creates a new announcement and associates any provided media assets.
 *     tags: [AdminAnnouncements]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementCreate'
 *     responses:
 *       201:
 *         description: The created announcement (with media assets)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 */

/**
 * @swagger
 * /api/admin/announcements/{id}:
 *   patch:
 *     summary: Update an announcement
 *     description: >
 *       Updates an existing announcement. If the media array is provided, all previous media links are replaced atomically.
 *     tags: [AdminAnnouncements]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementUpdate'
 *     responses:
 *       200:
 *         description: The updated announcement (with media assets)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *
 *   delete:
 *     summary: Delete an announcement
 *     description: >
 *       Deletes an announcement and all its associated media links.
 *     tags: [AdminAnnouncements]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The announcement ID
 *     responses:
 *       204:
 *         description: No Content (deletion successful)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MediaLink:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Media asset ID
 *         sortOrder:
 *           type: integer
 *           description: Sort order for the media asset
 *           default: 0
 *     AnnouncementCreate:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Announcement date (ISO 8601)
 *         title:
 *           type: string
 *           description: Title of the announcement
 *           maxLength: 160
 *         desc:
 *           type: string
 *           description: Optional description
 *           nullable: true
 *           maxLength: 1000
 *         published:
 *           type: boolean
 *           description: Published flag
 *           default: true
 *         media:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MediaLink'
 *           description: Optional array of media links
 *     AnnouncementUpdate:
 *       allOf:
 *         - $ref: '#/components/schemas/AnnouncementCreate'
 *       description: All fields optional for PATCH
 *     MediaAsset:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         url:
 *           type: string
 *         filename:
 *           type: string
 *         [additionalProps]:
 *           description: Other asset fields...
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
 *             allOf:
 *               - $ref: '#/components/schemas/MediaAsset'
 *               - type: object
 *                 properties:
 *                   _linkSortOrder:
 *                     type: integer
 *                     description: Sort order of the linked asset
 */

import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

/**
 * @brief Zod schema for a media asset link object.
 * @details Used for validating and typing announcement-media associations.
 */
const MediaLink = z.object({
  id: z.string().min(1),                             /**< Media asset ID (required) */
  sortOrder: z.number().int().min(0).optional().default(0), /**< Sort order for the media asset (optional, default 0) */
});

/**
 * @brief Zod schema for creating a new announcement.
 * @details
 * The announcement can have a date, title, description, publication status,
 * and an array of associated media links.
 */
const AnnouncementCreate = z.object({
  date: z.coerce.date(),                             /**< Announcement date (ISO 8601 or Date object) */
  title: z.string().min(1).max(160),                 /**< Title of the announcement (required, max 160 chars) */
  desc: z.string().max(1000).optional().nullable(),  /**< Optional description (nullable, max 1000 chars) */
  published: z.coerce.boolean().optional().default(true), /**< Published flag (default true) */
  media: z.array(MediaLink).optional().default([]),  /**< Optional array of media links */
});

/**
 * @brief Zod schema for updating an announcement.
 * @details
 * All fields are optional; used for PATCH requests.
 */
const AnnouncementUpdate = AnnouncementCreate.partial();

/**
 * @brief Prisma include configuration for fetching an announcement with its media and asset info.
 * @details
 * Used to add the full media asset info (not just the ids) and maintain sorting.
 */
const includeWithMedia = {
  media: {
    include: { asset: true },     /**< Includes linked asset data */
    orderBy: { sortOrder: "asc" as const }, /**< Orders media by sortOrder ascending */
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
      // Replace all media links
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
