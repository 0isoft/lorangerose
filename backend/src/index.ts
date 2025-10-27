/**
 * @file index.ts
 * @brief Main entrypoint for the Express REST API server.
 * @details
 * - Loads environment variables and configures the Express app.
 * - Applies middleware including cookie handling, CORS, JSON parsing, and rate limiting.
 * - Mounts public and admin API routes for authentication, announcements, closures, media, gallery, business hours, analytics, and uploads.
 * - Exposes health and debug endpoints.
 * - Starts the HTTP server.
 * 
 * @author
 *   0isoft
 * @date
 *   2025
 * @version
 *   1.0
 */

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
import prisma from "./lib/prisma"
// @ts-ignore
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from "express";



/**
 * @brief Express rate limiter for analytics tracking.
 * @details
 *   - Limits requests to the /api/track endpoint to 120 per IP per 60 seconds.
 *   - Uses standard HTTP rate limit headers.
 */
const trackLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });

/**
 * @brief Instance of the Express application.
 */
const app = express();

/**
 * @brief Debug middleware logs incoming HTTP requests.
 * @details Logs the request method, URL, host, and whether cookies are present.
 * @param req Express Request
 * @param _res Express Response
 * @param next Next middleware callback
 */
app.use((req, _res, next) => {
  console.log('[DEBUG]', req.method, req.url,
    'Host:', req.headers.host,
    'Cookie:', req.headers.cookie ? '(present)' : '(none)');
  next();
});

app.set("trust proxy", true);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

/**
 * @brief Ensures the uploads directory exists for hosting static uploaded files.
 * @details
 *   - Creates the "uploads" directory if it does not exist, supporting local/dev disk storage.
 *   - Serves files under /uploads.
 */
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

/**
 * @brief Health check endpoint.
 * @route GET /health
 * @returns {object} { ok: true } Indicates the API is running.
 */
app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * @name Public API Endpoints
 * @brief Mounts routers for public-facing APIs.
 */
app.use("/api/auth", authRouter);
app.use("/api/announcements", announcementsPublic);
app.use("/api/closures", closuresPublic);
app.use("/api/media", mediaPublic);
app.use("/api/gallery", galleryPublic);
app.use("/api/hours", hours);

/**
 * @name Admin API Endpoints
 * @brief Mounts routers for admin (protected) APIs.
 * @details
 *   - requireAdmin middleware restricts access to authenticated admin users.
 *   - Includes CRUD endpoints for announcements, closures, media, gallery, recurring closures, business hours, and analytics.
 */
app.use("/api/admin/announcements", requireAdmin, adminAnnouncements);
app.use("/api/admin/closures", requireAdmin, adminClosures);
app.use("/api/admin/media", requireAdmin, adminMedia);
app.use("/api/admin/gallery", requireAdmin, adminGallery);
app.use("/api/admin/recurring-closures", requireAdmin, recurringClosures);
app.use("/api/admin/hours", adminHours)
app.post("/api/track", trackLimiter, trackHit);
app.use("/api/admin/analytics", requireAdmin, adminAnalytics);

/**
 * @brief Swagger OpenAPI Documentation
 * @details
 *   - Serves interactive Swagger UI at /api-docs for the API documentation
 *   - Note: To ensure the docs work in dev (with TypeScript), point "apis" to the TS source files!
 *   - JSDoc comments must be present in the .ts files, or use swagger-autogen for more advanced setups.
 *   - If docs are blank, try: 
 *       1. Change './routes/*.js' => './routes/*.ts'
 *       2. Ensure valid JSDoc @swagger blocks in your route files.
 */

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'L`Oragne Rose API',
      version: '1.0.0',
      description: 'CRUD API for restaurant management',
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local dev server"
      }
    ]
  },
  apis: [path.join(__dirname, 'routes', '**', '*.ts')],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Simply use app.use directly - no need for a separate router
app.use("/api-docs",requireAdmin, swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @brief Starts the HTTP server and listens for incoming requests.
 * @details
 *   - Uses PORT environment variable or defaults to 3000.
 *   - Binds on all network interfaces (0.0.0.0).
 */
const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

/**
 * @brief Debug-only endpoint for database connection and server info.
 * @route GET /debug/db
 * @returns {object} Database and connection information.
 *   - db: current database name
 *   - usr: database user
 *   - addr: server address
 *   - port: server port
 */
app.get("/debug/db", async (_req, res) => {
  const [info] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT current_database() AS db,
            current_user AS usr,
            inet_server_addr() AS addr,
            inet_server_port() AS port;`
  );
  res.json(info);
});