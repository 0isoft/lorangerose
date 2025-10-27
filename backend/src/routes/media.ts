/**
 * @file media.ts
 * @brief Public API routes for retrieving published media assets
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
 *   name: Media
 *   description: Public endpoint for retrieving published media assets
 */

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: Retrieve published media assets
 *     description: >
 *       Returns a list of published media assets.  
 *       You can optionally filter results by `type` (e.g. `"HERO"`, `"MENU"`, `"ANNOUNCEMENT"`)  
 *       and/or limit the number of returned items via the `take` query parameter.  
 *       If `type=MENU` and no `take` is provided, defaults to returning 10 items.
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HERO, MENU, ANNOUNCEMENT]
 *         description: Filter by media type
 *         example: HERO
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Limit on number of results (ignored if invalid or <1)
 *         example: 5
 *     responses:
 *       200:
 *         description: List of published media assets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MediaAsset'
 *             examples:
 *               example:
 *                 summary: Example response
 *                 value:
 *                   - id: "asset001"
 *                     type: "HERO"
 *                     url: "/uploads/banner.jpg"
 *                     published: true
 *                     sortOrder: 1
 *                     alt: "Restaurant Hero Banner"
 *       500:
 *         description: Database or server error
 */
router.get("/", async (req, res) => {
  const qType = (req.query.type as string | undefined)?.toUpperCase();
  const takeParam = Number(req.query.take);
  const take = Number.isFinite(takeParam) && takeParam > 0 ? takeParam : undefined;

  const where: any = { published: true };
  if (qType === "HERO" || qType === "MENU" || qType === "ANNOUNCEMENT") {
    where.type = qType;
  }

  const rows = await prisma.mediaAsset.findMany({
    where,
    orderBy: qType ? [{ sortOrder: "asc" }] : [{ type: "asc" }, { sortOrder: "asc" }],
    take: qType === "MENU" ? (take ?? 10) : take,
  });

  res.json(rows);
});

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     MediaAsset:
 *       type: object
 *       required:
 *         - id
 *         - type
 *         - url
 *         - published
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the media asset
 *           example: "asset001"
 *         type:
 *           type: string
 *           description: Type of media asset ("HERO", "MENU", "ANNOUNCEMENT", etc.)
 *           example: "MENU"
 *         url:
 *           type: string
 *           description: URL path to the media file
 *           example: "/uploads/banner.jpg"
 *         published:
 *           type: boolean
 *           description: Whether the media asset is published (always true for this endpoint)
 *           example: true
 *         sortOrder:
 *           type: integer
 *           description: Sort order index for frontend display
 *           example: 1
 *         alt:
 *           type: string
 *           nullable: true
 *           description: Alternative text for accessibility
 *           example: "Restaurant Hero Banner"
 */

