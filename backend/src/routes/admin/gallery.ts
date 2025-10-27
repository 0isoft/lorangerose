/**
 * @file gallery.ts
 * @brief Admin API routes for managing the gallery collection.
 * @details
 * Provides CRUD endpoints to manage gallery items, allowing admins to
 * add, update, list, or remove media assets from the gallery. All endpoints
 * require admin authentication.
 */

/**
 * @swagger
 * tags:
 *   name: AdminGallery
 *   description: Admin API for managing gallery items (requires authentication)
 */

/**
 * @swagger
 * /api/admin/gallery:
 *   get:
 *     summary: Get all gallery items
 *     description: >
 *       Retrieves all gallery items, each with the linked media asset info,
 *       sorted by gallery sortOrder ascending.
 *     tags: [AdminGallery]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of gallery items with asset data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Media asset ID
 *                       type:
 *                         type: string
 *                       url:
 *                         type: string
 *                       alt:
 *                         type: string
 *                         nullable: true
 *                       width:
 *                         type: integer
 *                         nullable: true
 *                       height:
 *                         type: integer
 *                         nullable: true
 *                       sortOrder:
 *                         type: integer
 *                         description: Gallery sort order
 *                       published:
 *                         type: boolean
 *                         description: Gallery published flag
 *                       _linkSortOrder:
 *                         type: integer
 *                         description: Alias for gallery sortOrder
 *   post:
 *     summary: Upsert a gallery item
 *     description: >
 *       Adds or updates a gallery item. If the `mediaAssetId` exists, updates the sortOrder and published fields.
 *       Otherwise, creates a new gallery item.
 *     tags: [AdminGallery]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mediaAssetId:
 *                 type: string
 *                 description: The CUID of the linked media asset
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Sort ordering for display
 *               published:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the gallery item is published/visible
 *             required:
 *               - mediaAssetId
 *     responses:
 *       201:
 *         description: The created or updated gallery item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mediaAssetId:
 *                   type: string
 *                 sortOrder:
 *                   type: integer
 *                 published:
 *                   type: boolean
 */

import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import type { AuthedRequest } from "../../middleware/requireAdmin";

const router = Router();

/**
 * @brief Zod schema for upserting a gallery item.
 * @details
 * Used for create and update operations on gallery items.
 * - `mediaAssetId`: The CUID of the media asset.
 * - `sortOrder`: The integer sort ordering for display (default 0).
 * - `published`: Whether the gallery item is published/visible (default true).
 */
const UpsertSchema = z.object({
  mediaAssetId: z.string().cuid(),                         /**< CUID of the linked media asset */
  sortOrder: z.coerce.number().int().min(0).default(0),    /**< Sort ordering for the gallery */
  published: z.coerce.boolean().default(true),             /**< Published flag for the gallery item */
});

/**
 * @swagger
 * /api/admin/gallery:
 *   get:
 *     summary: Get all gallery items
 *     tags: [AdminGallery]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of gallery items with associated asset data.
 *   post:
 *     summary: Upsert a gallery item
 *     tags: [AdminGallery]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GalleryItemUpsert'
 *     responses:
 *       201:
 *         description: The created or updated gallery item
 */
// GET /api/admin/gallery
router.get("/", async (_req, res) => {
  const items = await prisma.galleryItem.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      mediaAssetId: true,
      sortOrder: true,
      published: true,
      asset: {
        select: {
          id: true,
          url: true,
          alt: true,
          width: true,
          height: true,
          type: true,
          sortOrder: true,
          published: true,
        },
      },
    },
  });

  // Flatten for frontend re-use of MediaAsset
  const out = items.map((g) => ({
    id: g.asset.id,                        /**< MediaAsset ID */
    type: g.asset.type,                    /**< Media type */
    url: g.asset.url,                      /**< Asset URL */
    alt: g.asset.alt ?? null,              /**< Asset alt text */
    width: g.asset.width ?? null,          /**< Asset width */
    height: g.asset.height ?? null,        /**< Asset height */
    sortOrder: g.sortOrder,                /**< Gallery sort order */
    published: g.published,                /**< Gallery published flag */
    _linkSortOrder: g.sortOrder,           /**< Optional: duplicate sortOrder for distinguishing source */
  }));
  res.json(out);
});

// POST /api/admin/gallery
router.post("/", async (req: AuthedRequest, res) => {
  const body = UpsertSchema.parse(req.body);
  const item = await prisma.galleryItem.upsert({
    where: { mediaAssetId: body.mediaAssetId },
    update: { sortOrder: body.sortOrder, published: body.published },
    create: body,
  });
  res.status(201).json(item);
});


/**
 * @swagger
 * /api/admin/gallery/{mediaAssetId}:
 *   patch:
 *     summary: Update a gallery item
 *     description: Updates sortOrder or published status for a gallery item by its media asset ID.
 *     tags: [AdminGallery]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaAssetId
 *         schema:
 *           type: string
 *         required: true
 *         description: The media asset ID (CUID) to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sortOrder:
 *                 type: integer
 *                 description: Sort ordering for display
 *               published:
 *                 type: boolean
 *                 description: Published flag
 *     responses:
 *       200:
 *         description: The updated gallery item
 *   delete:
 *     summary: Remove a gallery item
 *     description: Removes a gallery item for a given mediaAssetId. Does not delete the underlying MediaAsset record.
 *     tags: [AdminGallery]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaAssetId
 *         schema:
 *           type: string
 *         required: true
 *         description: The media asset ID (CUID) to remove
 *     responses:
 *       204:
 *         description: No Content on success
 */

// PATCH /api/admin/gallery/:mediaAssetId
router.patch("/:mediaAssetId", async (req: AuthedRequest, res) => {
  const { mediaAssetId } = req.params;
  const body = UpsertSchema.partial().parse(req.body);
  const item = await prisma.galleryItem.update({
    where: { mediaAssetId },
    data: body,
  });
  res.json(item);
});

// DELETE /api/admin/gallery/:mediaAssetId
router.delete("/:mediaAssetId", async (req: AuthedRequest, res) => {
  const { mediaAssetId } = req.params;
  await prisma.galleryItem.delete({ where: { mediaAssetId } });
  res.status(204).end();
});

export default router;
