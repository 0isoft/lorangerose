/**
 * @file galleryPublic.ts
 * @brief Public gallery API routes for retrieving published gallery items
 * @version 1.0
 * @date 2025
 * @author 0isoft
 */

import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Gallery
 *   description: Public endpoints for accessing published gallery images
 */

/**
 * @swagger
 * /api/gallery:
 *   get:
 *     summary: Retrieve all published gallery items
 *     description: >
 *       Returns all published gallery items with their associated media assets, ordered by sort order.  
 *       Only items where both the gallery record and its linked asset are marked as `published` are included.  
 *       Includes caching headers for client-side and CDN performance optimization.
 *     tags: [Gallery]
 *     responses:
 *       200:
 *         description: List of published gallery items
 *         headers:
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: public, max-age=60, stale-while-revalidate=300
 *             description: Enables short-term caching with stale-while-revalidate strategy
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GalleryItem'
 *             examples:
 *               example:
 *                 summary: Example gallery response
 *                 value:
 *                   - id: "asset123"
 *                     type: "GALLERY"
 *                     url: "/uploads/image.jpg"
 *                     alt: "Beautiful sunset"
 *                     sortOrder: 1
 *                     published: true
 *                     width: 1920
 *                     height: 1080
 *       500:
 *         description: Database or server error
 */
router.get("/", async (_req, res) => {
  const items = await prisma.galleryItem.findMany({
    where: {
      published: true,
      asset: { published: true },
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

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json(out);
});

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     GalleryItem:
 *       type: object
 *       required:
 *         - id
 *         - type
 *         - url
 *         - sortOrder
 *         - published
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the gallery asset
 *           example: "asset123"
 *         type:
 *           type: string
 *           description: Fixed type identifier ("GALLERY") for frontend handling
 *           example: "GALLERY"
 *         url:
 *           type: string
 *           description: Relative or absolute path to the media file
 *           example: "/uploads/image.jpg"
 *         alt:
 *           type: string
 *           nullable: true
 *           description: Alternative text for accessibility
 *           example: "Beautiful sunset"
 *         sortOrder:
 *           type: integer
 *           description: Order in which the item should appear
 *           example: 1
 *         published:
 *           type: boolean
 *           description: Always `true` for this endpoint
 *           example: true
 *         width:
 *           type: integer
 *           nullable: true
 *           description: Media width in pixels (if known)
 *           example: 1920
 *         height:
 *           type: integer
 *           nullable: true
 *           description: Media height in pixels (if known)
 *           example: 1080
 */

