/**
 * @file galleryPublic.ts
 * @brief Public gallery API routes for retrieving published gallery items
 * @author 0isoft
 * @date 2025
 * @version 1.0
 */

// server/routes/galleryPublic.ts
export {}; 
import { Router } from "express";
import { prisma } from "../lib/prisma";

/**
 * @brief Express router instance for gallery public routes
 * @details This router handles public-facing gallery operations that don't require authentication
 */
const router = Router();

/**
 * @brief GET /api/gallery - Retrieve all published gallery items
 * @details Fetches all published gallery items with their associated media assets,
 *          ordered by sort order. Only returns items where both the gallery item
 *          and its associated asset are marked as published.
 * 
 * @param _req Express request object (unused)
 * @param res Express response object
 * 
 * @return JSON response containing array of gallery items with the following structure:
 *         - id: string - Unique identifier for the media asset
 *         - type: "GALLERY" - Type identifier for frontend consumption
 *         - url: string - URL path to the media file
 *         - alt: string | null - Alternative text for accessibility
 *         - sortOrder: number - Order in which items should be displayed
 *         - published: boolean - Always true for this endpoint
 *         - width: number | null - Media width in pixels
 *         - height: number | null - Media height in pixels
 * 
 * @note This endpoint includes caching headers:
 *       - Cache-Control: "public, max-age=60, stale-while-revalidate=300"
 *       - Items are cached for 60 seconds with 300 seconds stale-while-revalidate
 * 
 * @throws {Error} Database connection errors or Prisma query failures
 * 
 * @example
 * GET /api/gallery
 * Response:
 * [
 *   {
 *     "id": "asset123",
 *     "type": "GALLERY",
 *     "url": "/uploads/image.jpg",
 *     "alt": "Beautiful sunset",
 *     "sortOrder": 1,
 *     "published": true,
 *     "width": 1920,
 *     "height": 1080
 *   }
 * ]
 */
router.get("/", async (_req, res) => {
  /**
   * @brief Query published gallery items from database
   * @details Fetches gallery items where both the item and its asset are published,
   *          ordered by sortOrder in ascending order
   */
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

  /**
   * @brief Transform database results to frontend-compatible format
   * @details Maps the nested Prisma result structure to a flattened MediaAsset-like
   *          structure that the frontend expects
   */
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

  /**
   * @brief Set caching headers for performance optimization
   * @details Enables browser and CDN caching to reduce server load
   */
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json(out);
});

/**
 * @brief Export the configured router for use in main application
 * @details This router should be mounted at /api/gallery in the main Express app
 */
export default router;