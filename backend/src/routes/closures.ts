/**
 * @file closures.ts
 * @brief Public API routes for managing restaurant closures and recurring closure rules
 * @author 0isoft
 * @date 2025
 */

import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Closures
 *   description: Public endpoints for retrieving exceptional and recurring restaurant closures
 */

/**
 * @swagger
 * /closures:
 *   get:
 *     summary: Retrieve closure information
 *     description: >
 *       Returns both one-time ("EXCEPTIONAL") closures and expanded recurring closures ("RECURRING") within the given date range.
 *       If no range is provided, defaults to the current date through 5 years ahead.
 *     tags: [Closures]
 *     parameters:
 *       - name: start
 *         in: query
 *         description: Start date in ISO format (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-01"
 *       - name: end
 *         in: query
 *         description: End date in ISO format (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-31"
 *     responses:
 *       200:
 *         description: Successful response with closures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Closure'
 *             examples:
 *               example:
 *                 summary: Example closure list
 *                 value:
 *                   - id: "closure_123"
 *                     date: "2025-01-20T00:00:00.000Z"
 *                     slot: "ALL"
 *                     note: "Holiday closure"
 *                     kind: "EXCEPTIONAL"
 *                   - id: "rec_456_2025-01-15"
 *                     date: "2025-01-15T00:00:00.000Z"
 *                     slot: "LUNCH"
 *                     note: "Weekly maintenance"
 *                     kind: "RECURRING"
 *       500:
 *         description: Internal server error
 */

router.get("/", async (req, res) => {
  const { start: qsStart, end: qsEnd } = req.query as { start?: string; end?: string };

  const { start, end } = (() => {
    try {
      if (qsStart && qsEnd) return { start: new Date(qsStart), end: new Date(qsEnd) };
    } catch {}
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    const e = new Date(s);
    e.setFullYear(e.getFullYear() + 5);
    return { start: s, end: e };
  })();

  const oneOffs = await prisma.closure.findMany({
    orderBy: { date: "asc" },
    where: { date: { gte: start, lte: end } },
  });

  const rules = await prisma.recurringClosure.findMany();
  const expanded: Array<{ id: string; date: Date; slot: "ALL" | "LUNCH" | "DINNER"; note: string | null }> = [];

  for (const r of rules) {
    const effStart = new Date(Math.max(start.getTime(), (r.startsOn?.getTime() ?? start.getTime())));
    const effEnd = new Date(Math.min(end.getTime(), (r.endsOn?.getTime() ?? end.getTime())));
    if (effStart > effEnd) continue;

    const first = new Date(effStart);
    const mon0 = (first.getDay() + 6) % 7;
    const delta = (r.weekday - mon0 + 7) % 7;
    first.setDate(first.getDate() + delta);

    const intervalWeeks = r.interval ?? 1;
    for (let d = new Date(first); d <= effEnd; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * intervalWeeks)) {
      const iso = d.toISOString().slice(0, 10);
      expanded.push({
        id: `rec_${r.id}_${iso}`,
        date: d,
        slot: r.slot,
        note: r.note ?? null,
      });
    }
  }

  const out = [
    ...oneOffs.map(o => ({
      id: o.id,
      date: o.date,
      slot: o.slot,
      note: o.note ?? null,
      kind: "EXCEPTIONAL" as const,
    })),
    ...expanded.map(e => ({
      ...e,
      kind: "RECURRING" as const,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  res.json(out);
});

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Closure:
 *       type: object
 *       required:
 *         - id
 *         - date
 *         - slot
 *         - kind
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the closure
 *           example: "closure_123"
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the closure
 *           example: "2025-01-20T00:00:00.000Z"
 *         slot:
 *           type: string
 *           description: Time slot affected
 *           enum: [ALL, LUNCH, DINNER]
 *           example: "ALL"
 *         note:
 *           type: string
 *           nullable: true
 *           description: Optional note describing the reason for closure
 *           example: "Holiday closure"
 *         kind:
 *           type: string
 *           description: Type of closure
 *           enum: [EXCEPTIONAL, RECURRING]
 *           example: "EXCEPTIONAL"
 */

