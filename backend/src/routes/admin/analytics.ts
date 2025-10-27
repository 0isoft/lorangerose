/**
 * @file analytics.ts
 * @brief Admin analytics API routes for retrieving website analytics data
 * @details Provides endpoints for summary statistics and time series data
 */

/**
 * @swagger
 * tags:
 *   name: AdminAnalytics
 *   description: Admin analytics API
 */

/**
 * @swagger
 * /api/admin/analytics/summary:
 *   get:
 *     summary: Retrieves analytics summary data
 *     description: >
 *       Returns summary analytics including total non-bot hits, unique session counts, top pages, and top cities. All data excludes bot traffic.
 *     tags: [AdminAnalytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Optional start date (YYYY-MM-DD). Defaults to 30 days before `to`.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Optional end date (YYYY-MM-DD). Defaults to today if not given.
 *     responses:
 *       200:
 *         description: Analytics summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of non-bot hits
 *                 uniques:
 *                   type: integer
 *                   description: Number of unique sessions
 *                 topPages:
 *                   type: array
 *                   description: Top 10 pages with hit counts
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       hits:
 *                         type: integer
 *                 topCities:
 *                   type: array
 *                   description: Top 10 cities with hit counts
 *                   items:
 *                     type: object
 *                     properties:
 *                       city:
 *                         type: string
 *                       country:
 *                         type: string
 *                       hits:
 *                         type: integer
 *                 range:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       format: date-time
 *                     to:
 *                       type: string
 *                       format: date-time
 */

export {};
import { Router } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * @brief Parses date range from query parameters
 * @param q Query parameters object containing optional 'from' and 'to' dates
 * @return Object containing parsed 'from' and 'to' Date objects
 * @details If 'to' is not provided, defaults to current date.
 *          If 'from' is not provided, defaults to 30 days before 'to'.
 */
function parseRange(q: any) {
  const to = q.to ? new Date(q.to) : new Date();                // default now
  const from = q.from ? new Date(q.from) :
    new Date(to.getTime() - 29 * 24 * 3600 * 1000);             // default last 30 days
  return { from, to };
}

/**
 * @brief GET /api/admin/analytics/summary - Retrieves analytics summary data
 * @param req Express request object
 * @param req.query.from Optional start date in YYYY-MM-DD format
 * @param req.query.to Optional end date in YYYY-MM-DD format
 * @param res Express response object
 * @return JSON response containing:
 *   - total: Total number of non-bot hits
 *   - uniques: Number of unique sessions
 *   - topPages: Array of top 10 pages with hit counts
 *   - topCities: Array of top 10 cities with hit counts
 *   - range: The actual date range used for the query
 * @details Excludes bot traffic from all calculations. Uses sessionId for unique visitor counting.
 */
router.get("/summary", async (req, res) => {
  const { from, to } = parseRange(req.query);

  // totals
  const [{ total }] = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*)::bigint AS total
    FROM "Hit"
    WHERE NOT "isBot" AND "createdAt" BETWEEN ${from} AND ${to};
  `;
  const [{ uniques }] = await prisma.$queryRaw<Array<{ uniques: bigint }>>`
    SELECT COUNT(DISTINCT "sessionId")::bigint AS uniques
    FROM "Hit"
    WHERE NOT "isBot" AND "sessionId" IS NOT NULL AND "createdAt" BETWEEN ${from} AND ${to};
  `;

  // top pages
  const topPages = await prisma.$queryRaw<Array<{ path: string; hits: bigint }>>`
    SELECT path, COUNT(*)::bigint AS hits
    FROM "Hit"
    WHERE NOT "isBot" AND "createdAt" BETWEEN ${from} AND ${to}
    GROUP BY path
    ORDER BY hits DESC
    LIMIT 10;
  `;

  // top cities
  const topCities = await prisma.$queryRaw<Array<{ city: string | null; country: string | null; hits: bigint }>>`
    SELECT COALESCE(city,'Unknown') AS city, COALESCE(country,'--') AS country, COUNT(*)::bigint AS hits
    FROM "Hit"
    WHERE NOT "isBot" AND "createdAt" BETWEEN ${from} AND ${to}
    GROUP BY 1,2
    ORDER BY hits DESC
    LIMIT 10;
  `;

  res.json({
    total: Number(total),
    uniques: Number(uniques),
    topPages: topPages.map(r => ({ ...r, hits: Number(r.hits) })),
    topCities: topCities.map(r => ({ ...r, hits: Number(r.hits) })),
    range: { from, to },
  });
});

/**
 * @swagger
 * /api/admin/analytics/series:
 *   get:
 *     summary: Retrieves time series analytics data
 *     description: >
 *       Returns time series analytics in the specified bucket granularity (by day or by hour).
 *       Excludes bot traffic and zero-fills missing time buckets.
 *     tags: [AdminAnalytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           enum: [day, hour]
 *           default: day
 *         required: false
 *         description: Time bucket granularity ("day" or "hour")
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Optional start date (YYYY-MM-DD). Defaults to 30 days before `to`.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Optional end date (YYYY-MM-DD). Defaults to today if not given.
 *     responses:
 *       200:
 *         description: Time series data array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   bucket:
 *                     type: string
 *                     format: date-time
 *                     description: Start of time bucket (hour or day)
 *                   hits:
 *                     type: integer
 *                     description: Number of hits in the time bucket
 */

/**
 * @brief GET /api/admin/analytics/series - Retrieves time series analytics data
 * @param req Express request object
 * @param req.query.bucket Time bucket granularity: "day" (default) or "hour"
 * @param req.query.from Optional start date in YYYY-MM-DD format
 * @param req.query.to Optional end date in YYYY-MM-DD format
 * @param res Express response object
 * @return JSON array of time series data points, each containing:
 *   - bucket: Date/time for the bucket
 *   - hits: Number of hits in that time bucket
 * @details Uses PostgreSQL's generate_series to create zero-filled time series.
 *          Excludes bot traffic. Time buckets are aligned to hour/day boundaries.
 */
router.get("/series", async (req, res) => {
  const { from, to } = parseRange(req.query);
  const bucket = (req.query.bucket as string) === "hour" ? "hour" : "day";
  const step = bucket === "hour" ? "1 hour" : "1 day";

  // zero-filled time series via generate_series
  const data = await prisma.$queryRaw<Array<{ bucket: Date; hits: bigint }>>(
    Prisma.sql`
      WITH series AS (
        SELECT generate_series(${from}::timestamptz, ${to}::timestamptz, ${Prisma.sql`'${Prisma.raw(step)}'::interval`}) AS b
      )
      SELECT s.b AS bucket,
             COALESCE(COUNT(h.*), 0)::bigint AS hits
      FROM series s
      LEFT JOIN "Hit" h
        ON date_trunc(${bucket}, h."createdAt") = date_trunc(${bucket}, s.b)
       AND NOT h."isBot"
      GROUP BY s.b
      ORDER BY s.b;
    `
  );

  res.json(data.map(d => ({ bucket: d.bucket, hits: Number(d.hits) })));
});

export default router;
