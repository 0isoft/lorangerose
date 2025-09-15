import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { AuthedRequest } from "../../middleware/requireAdmin";

const router = Router();

// --- Multer disk storage (DEV/LOCAL) --- THIS SHOULD BE CHANGED WHEN MOVING TO SUPABASE
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve(process.cwd(), "uploads")),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const base = path.parse(file.originalname).name.replace(/[^\w.-]/g, "_").slice(0, 64);
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${ts}_${base}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// --- Validation ---
const MediaTypeEnum = z.enum(["HERO", "MENU", "ANNOUNCEMENT"]);
const LowerMediaType = z.enum(["hero", "menu", "announcement"]).transform(s => s.toUpperCase() as "HERO" | "MENU" | "ANNOUNCEMENT");

const MediaCreate = z.object({
  type: z.union([MediaTypeEnum, LowerMediaType]),
  alt: z.string().max(200).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  published: z.coerce.boolean().optional().default(true),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
});

const MediaUpdate = MediaCreate.partial();

// --- Routes ---
// Admin list: include everything, allow filter by type
router.get("/", async (req, res) => {
  const type = req.query.type as string | undefined;
  const where = type ? { type: (type.toUpperCase() as any) } : {};
  const rows = await prisma.mediaAsset.findMany({
    where,
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });
  res.json(rows);
});

// Create with file (multipart/form-data)
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

// Update metadata (no file)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = MediaUpdate.parse(req.body);
  const updated = await prisma.mediaAsset.update({
    where: { id },
    data,
  });
  res.json(updated);
});

// Delete asset (and local file if any)
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
