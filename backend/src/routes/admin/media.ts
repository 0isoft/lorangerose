/**
 * @file media.ts
 * @brief Admin API routes for managing media assets (images, uploads).
 * @details
 * Provides endpoints for uploading, listing, updating, and deleting media assets.
 * All endpoints require admin authentication (to be mounted under an admin-protected route).
 * 
 * NOTE: Uses Multer disk storage for local/dev; should be replaced for production/CDN use.
 */

import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { AuthedRequest } from "../../middleware/requireAdmin";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Media
 *   description: Endpoints for uploading, managing, and deleting media assets (admin only)
 */

/**
 * @brief Multer disk storage configuration for local development.
 * @details
 * Stores uploads in ./uploads directory. Filenames are timestamped and sanitized.
 * @note Replace this for production/CDN storage (e.g., Supabase, S3).
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve(process.cwd(), "uploads")),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const base = path.parse(file.originalname).name.replace(/[^\w.-]/g, "_").slice(0, 64);
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${ts}_${base}${ext}`);
  },
});

/**
 * @brief Multer middleware for single file uploads.
 * @details
 * File size limit: 10MB. Stores uploaded files using the above disk storage configuration.
 */
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// --- Validation Schemas ---

/**
 * @brief Enum for supported media types.
 * @details Accepts "HERO", "MENU", "ANNOUNCEMENT".
 */
const MediaTypeEnum = z.enum(["HERO", "MENU", "ANNOUNCEMENT"]);

const LowerMediaType = z.enum(["hero", "menu", "announcement"])
  .transform(s => s.toUpperCase() as "HERO" | "MENU" | "ANNOUNCEMENT");

const MediaCreate = z.object({
  type: z.union([MediaTypeEnum, LowerMediaType]),
  alt: z.string().max(200).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  published: z.coerce.boolean().optional().default(true),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
});

const MediaUpdate = MediaCreate.partial();

/**
 * @swagger
 * /api/admin/media:
 *   get:
 *     summary: Get all media assets
 *     description: Returns a list of all media assets, optionally filtered by type. Includes unpublished assets.
 *     tags: [Admin Media]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HERO, MENU, ANNOUNCEMENT]
 *         description: Optional filter by media type
 *     responses:
 *       200:
 *         description: List of media assets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MediaAsset'
 */
router.get("/", async (req, res) => {
  const type = req.query.type as string | undefined;
  const where = type ? { type: (type.toUpperCase() as any) } : {};
  const rows = await prisma.mediaAsset.findMany({
    where,
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });
  res.json(rows);
});

/**
 * @swagger
 * /api/admin/media:
 *   post:
 *     summary: Upload a new media asset
 *     description: Uploads a file (multipart/form-data) and creates a corresponding media asset record.
 *     tags: [Admin Media]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - type
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The uploaded file (image)
 *               type:
 *                 type: string
 *                 description: Media type (HERO, MENU, ANNOUNCEMENT)
 *               alt:
 *                 type: string
 *                 description: Alternative text for accessibility
 *               sortOrder:
 *                 type: integer
 *               published:
 *                 type: boolean
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created media asset
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MediaAsset'
 *       400:
 *         description: Missing file or invalid payload
 */
router.post("/", upload.single("file"), async (req: AuthedRequest, res) => {
  const parsed = MediaCreate.parse(req.body);
  const file = req.file;
  if (!file) return res.status(400).json({ error: "file is required" });

  const url = `/uploads/${file.filename}`;
  const key = file.filename;

  const created = await prisma.mediaAsset.create({
    data: {
      type: parsed.type,
      alt: parsed.alt ?? null,
      sortOrder: parsed.sortOrder,
      published: parsed.published,
      width: parsed.width,
      height: parsed.height,
      url,
      key,
      createdById: req.user?.id,
    },
  });
  res.status(201).json(created);
});

/**
 * @swagger
 * /api/admin/media/{id}:
 *   patch:
 *     summary: Update media metadata
 *     description: Updates metadata for a media asset (type, alt, sortOrder, etc). Does not modify the file.
 *     tags: [Admin Media]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MediaUpdate'
 *     responses:
 *       200:
 *         description: Updated media asset
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MediaAsset'
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = MediaUpdate.parse(req.body);
  const updated = await prisma.mediaAsset.update({
    where: { id },
    data,
  });
  res.json(updated);
});

/**
 * @swagger
 * /api/admin/media/{id}:
 *   delete:
 *     summary: Delete a media asset
 *     description: Deletes a media asset record and removes the corresponding local file (best effort).
 *     tags: [Admin Media]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media asset ID
 *     responses:
 *       204:
 *         description: Media deleted successfully (no content)
 *       404:
 *         description: Media not found
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const asset = await prisma.mediaAsset.delete({ where: { id } });

  if (asset.key) {
    const p = path.resolve(process.cwd(), "uploads", asset.key);
    fs.promises.unlink(p).catch(() => void 0);
  }
  res.status(204).end();
});

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     MediaAsset:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [HERO, MENU, ANNOUNCEMENT]
 *         alt:
 *           type: string
 *           nullable: true
 *         url:
 *           type: string
 *         key:
 *           type: string
 *         sortOrder:
 *           type: integer
 *         published:
 *           type: boolean
 *         width:
 *           type: integer
 *           nullable: true
 *         height:
 *           type: integer
 *           nullable: true
 *         createdById:
 *           type: string
 *           nullable: true
 *     MediaUpdate:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *         alt:
 *           type: string
 *         sortOrder:
 *           type: integer
 *         published:
 *           type: boolean
 *         width:
 *           type: integer
 *         height:
 *           type: integer
 */
