import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = Router();

/**
 * @brief Schema for media link validation
 * @details Defines the structure for linking media assets to announcements
 */
const MediaLink = z.object({
  id: z.string().min(1),                  // mediaAssetId
  sortOrder: z.number().int().min(0).optional().default(0),
});

/**
 * @brief Schema for creating new announcements
 * @details Validates input data when creating announcements with optional media attachments
 */
const AnnouncementCreate = z.object({
  date: z.coerce.date(),
  title: z.string().min(1).max(160),
  desc: z.string().max(1000).optional().nullable(),
  published: z.coerce.boolean().optional().default(true),

  media: z.array(MediaLink).optional().default([]),
});

/**
 * @brief Schema for updating existing announcements
 * @details Partial schema allowing selective updates to announcement fields
 */
const AnnouncementUpdate = AnnouncementCreate.partial();

/**
 * @brief Include configuration for media relations
 * @details Defines how to include and order media assets when fetching announcements
 */
const includeWithMedia = {
  media: {
    include: { asset: true },
    orderBy: { sortOrder: "asc" as const },
  },
};

/**
 * @brief GET /announcements - Retrieve all announcements
 * @details Fetches all announcements ordered by date (newest first) with associated media assets
 * @returns {Promise<Object[]>} Array of announcements with flattened media assets
 * @note Media assets are flattened and include sort order for frontend consumption
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
 * @brief POST /announcements - Create a new announcement
 * @details Creates a new announcement with optional media attachments in a database transaction
 * @param {Object} req.body - Announcement data including title, date, description, and media
 * @returns {Promise<Object>} Created announcement with associated media assets
 * @throws {ZodError} If input validation fails
 * @note Uses database transaction to ensure data consistency
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
 * @brief PATCH /announcements/:id - Update an existing announcement
 * @details Updates announcement fields and optionally replaces media attachments
 * @param {string} req.params.id - ID of the announcement to update
 * @param {Object} req.body - Partial announcement data to update
 * @returns {Promise<Object>} Updated announcement with associated media assets
 * @throws {ZodError} If input validation fails
 * @note If media is provided, existing media links are deleted and new ones are created
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = AnnouncementUpdate.parse(req.body);

  const updated = await prisma.$transaction(async (tx) => {
    // base fields
    await tx.announcement.update({
      where: { id },
      data: {
        date: data.date,
        title: data.title,
        desc: data.desc,
        published: data.published,
      },
    });

    // if `media` provided, replace links
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
 * @brief DELETE /announcements/:id - Delete an announcement
 * @details Permanently removes an announcement and its associated media links
 * @param {string} req.params.id - ID of the announcement to delete
 * @returns {Promise<void>} No content response (204)
 * @note Cascade deletion of media links is handled by database constraints
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.announcement.delete({ where: { id } });
  res.status(204).end();
});

export default router;
