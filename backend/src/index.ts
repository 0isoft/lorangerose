import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";

import authRouter from "./routes/auth";
import announcementsPublic from "./routes/announcements";
import closuresPublic from "./routes/closures";
import mediaPublic from "./routes/media";
import adminAnnouncements from "./routes/admin/announcements";
import adminClosures from "./routes/admin/closures";
import adminMedia from "./routes/admin/media";
import { requireAdmin } from "./middleware/requireAdmin";
import galleryPublic from "./routes/galleryPublic";
import adminGallery from "./routes/admin/gallery";
import recurringClosures from "./routes/admin/recurringClosures";
import hours from "./routes/hours";
import adminHours from "./routes/admin/hours"
import { trackHit } from "./analytics";   
import rateLimit from "express-rate-limit";
import adminAnalytics from "./routes/admin/analytics";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const trackLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });



const app = express();
app.set("trust proxy", true);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));

// Ensure uploads dir exists (for local/dev disk storage)
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Public content
app.use("/api/auth", authRouter);
app.use("/api/announcements", announcementsPublic);
app.use("/api/closures", closuresPublic);
app.use("/api/media", mediaPublic);
app.use("/api/gallery", galleryPublic);
app.use("/api/hours", hours);

// Admin CRUD
app.use("/api/admin/announcements", requireAdmin, adminAnnouncements);
app.use("/api/admin/closures", requireAdmin, adminClosures);
app.use("/api/admin/media", requireAdmin, adminMedia);
app.use("/api/admin/gallery", requireAdmin, adminGallery);
app.use("/api/admin/recurring-closures", recurringClosures);
app.use("/api/admin/hours", adminHours)
app.post("/api/track", trackLimiter, trackHit);
app.use("/api/admin/analytics", requireAdmin, adminAnalytics);


const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});

app.get("/debug/db", async (_req, res) => {
  const [info] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT current_database() AS db,
            current_user AS usr,
            inet_server_addr() AS addr,
            inet_server_port() AS port;`
  );
  res.json(info);
});