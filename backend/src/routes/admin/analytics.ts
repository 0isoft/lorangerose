export {};
import { Router } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

function parseRange(q: any) {
  const to = q.to ? new Date(q.to) : new Date();                // default now
  const from = q.from ? new Date(q.from) :
    new Date(to.getTime() - 29 * 24 * 3600 * 1000);             // default last 30 days
  return { from, to };
}

// GET /api/admin/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
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

// GET /api/admin/analytics/series?bucket=day|hour&from=...&to=...
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
