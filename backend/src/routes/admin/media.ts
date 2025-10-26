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

/**
 * @brief Lowercase media type enum, coerces to uppercase.
 */
const LowerMediaType = z.enum(["hero", "menu", "announcement"])
  .transform(s => s.toUpperCase() as "HERO" | "MENU" | "ANNOUNCEMENT");

/**
 * @brief Zod schema for creating a media asset.
 * @details
 * - type: Media type (required, case-insensitive)
 * - alt: Alternative text (optional, max 200 chars)
 * - sortOrder: Sort order for UI (default 0)
 * - published: Published flag (default true)
 * - width/height: Dimensions (optional, positive integers)
 */
const MediaCreate = z.object({
  type: z.union([MediaTypeEnum, LowerMediaType]),
  alt: z.string().max(200).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  published: z.coerce.boolean().optional().default(true),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
});

/**
 * @brief Zod schema for updating a media asset.
 * @details All fields optional; used for PATCH endpoints.
 */
const MediaUpdate = MediaCreate.partial();

// --- Routes ---

/**
 * @brief GET /api/admin/media
 * @route GET /
 * @param req.query.type (optional) Filter by media type ("HERO", "MENU", "ANNOUNCEMENT")
 * @returns {Array} All media assets, optionally filtered by type, sorted by type and sortOrder.
 * @details
 * Returns all media assets for admin, including unpublished ones.
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
 * @brief POST /api/admin/media
 * @route POST /
 * @param file (multipart/form-data) The uploaded file (required)
 * @param req.body Fields matching MediaCreate schema
 * @returns {Object} The created media asset record
 * @details
 * Uploads a file and creates a media asset entry in the database. Stores the file in the local uploads directory.
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
 * @brief PATCH /api/admin/media/:id
 * @route PATCH /:id
 * @param req.params.id {string} ID of the media asset to update
 * @param req.body Fields matching MediaUpdate schema
 * @returns {Object} The updated media asset record
 * @details
 * Updates metadata (type, alt, sortOrder, etc) for a media asset. Does not update the file itself.
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
 * @brief DELETE /api/admin/media/:id
 * @route DELETE /:id
 * @param req.params.id {string} ID of the media asset to delete
 * @returns 204 No Content on success
 * @details
 * Deletes a media asset from the database and attempts best-effort cleanup of the associated local file.
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const asset = await prisma.mediaAsset.delete({ where: { id } });

  // Best-effort local file cleanup
  if (asset.key) {
    const p = path.resolve(process.cwd(), "uploads", asset.key);
    fs.promises.unlink(p).catch(() => void 0);
  }
  res.status(204).end();
});

export default router;
