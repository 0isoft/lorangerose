/**
 * @file hours.ts
 * @brief Admin API routes for managing weekly business hours.
 * @details
 * Provides endpoints for updating and retrieving weekly business hours.
 * All endpoints require admin authentication.
 */

import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Hours
 *   description: Endpoints for managing weekly business hours (admin only)
 */

/**
 * @brief Converts a time string in "HH:MM" format to total minutes.
 * @param s Time string ("HH:MM") or null/undefined
 * @return {number|null} Total minutes since 00:00, or null if invalid
 */
function hhmmToMin(s?: string | null): number | null {
  if (!s) return null;
  const [h, m] = s.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * @brief Zod schema for validating and typing weekly business hours form data.
 * @details
 * Allows specifying weekday, closedAllDay flag, lunch and dinner intervals, and arbitrary text.
 */
const HoursPayload = z.object({
  weekday: z.number().int().min(0).max(6),                        /**< Day of the week (0=Sunday, 6=Saturday) */
  closedAllDay: z.boolean().optional(),                           /**< Optional: is this day closed all day? */
  lunch: z.tuple([z.string(), z.string()]).nullable().optional(), /**< Optional: lunch hours interval (["HH:MM", "HH:MM"]) */
  dinner: z.tuple([z.string(), z.string()]).nullable().optional(),/**< Optional: dinner hours interval (["HH:MM", "HH:MM"]) */
  text: z.string().trim().optional(),                             /**< Optional: freeform formatted hours string */
});

/**
 * @brief Parses a formatted text string into lunch/dinner intervals.
 * @param text Formatted business hours string (e.g. "12:00-14:30, 18:00-22:00")
 * @return { lunch: [string, string] | null, dinner: [string, string] | null }
 *   Parsed time ranges (if any) for lunch and dinner.
 * @details
 * Only parses up to 2 time ranges. Each must be "HH:MM-HH:MM" (24h).
 */
function parseTextToRanges(
  text?: string
): { lunch: [string, string] | null; dinner: [string, string] | null } {
  if (!text) return { lunch: null as [string,string] | null, dinner: null as [string,string] | null };
  const parts = text
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  const ranges: [string, string][] = [];
  for (const p of parts) {
    const [a, b] = p.split("-").map(s => s?.trim());
    if (!a || !b) continue;
    if (!/^\d{1,2}:\d{2}$/.test(a) || !/^\d{1,2}:\d{2}$/.test(b)) continue;
    ranges.push([a, b]);
  }
  return {
    lunch: ranges[0] ?? null,
    dinner: ranges[1] ?? null,
  };
}

/**
 * @swagger
 * /api/admin/hours:
 *   get:
 *     summary: Get all business hours
 *     description: Returns a list of all business hours records for all weekdays (sorted ascending).
 *     tags: [Admin Hours]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successful response with list of business hours
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusinessHours'
 */
router.get("/", async (_req, res) => {
  const rows = await prisma.businessHours.findMany({ orderBy: { weekday: "asc" } });
  res.json(rows);
});

/**
 * @swagger
 * /api/admin/hours/{weekday}:
 *   put:
 *     summary: Update or create business hours for a specific weekday
 *     description: |
 *       Sets or updates business hours for a given weekday.  
 *       Accepts a `displayText` field and optional flags for `closedAllDay`, `lunch`, and `dinner`.
 *     tags: [Admin Hours]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: weekday
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         description: Weekday index (0 = Sunday, 6 = Saturday)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HoursPayload'
 *     responses:
 *       200:
 *         description: Updated or created business hours object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessHours'
 *       400:
 *         description: Validation error
 */
router.put("/:weekday", async (req, res) => {
  const weekday = Number(req.params.weekday);
  const parsed = HoursPayload.parse({ ...req.body, weekday });

  const text = (parsed.text ?? "").trim();
  const data = {
    weekday,
    displayText: text,
    closedAllDay: parsed.closedAllDay ?? (text.length === 0),
    lunchStartMin:  null,
    lunchEndMin:    null,
    dinnerStartMin: null,
    dinnerEndMin:   null,
  };

  const existing = await prisma.businessHours.findFirst({ where: { weekday } });
  const saved = existing
    ? await prisma.businessHours.update({ where: { id: existing.id }, data })
    : await prisma.businessHours.create({ data });

  res.json(saved);
});

export default router;
export {};

/**
 * @swagger
 * components:
 *   schemas:
 *     HoursPayload:
 *       type: object
 *       properties:
 *         weekday:
 *           type: integer
 *           description: Day of the week (0=Sunday, 6=Saturday)
 *         closedAllDay:
 *           type: boolean
 *           description: Whether the business is closed all day
 *         lunch:
 *           type: array
 *           items:
 *             type: string
 *           example: ["12:00", "14:00"]
 *         dinner:
 *           type: array
 *           items:
 *             type: string
 *           example: ["18:00", "22:00"]
 *         text:
 *           type: string
 *           description: Custom formatted hours string
 *     BusinessHours:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         weekday:
 *           type: integer
 *         displayText:
 *           type: string
 *         closedAllDay:
 *           type: boolean
 *         lunchStartMin:
 *           type: integer
 *           nullable: true
 *         lunchEndMin:
 *           type: integer
 *           nullable: true
 *         dinnerStartMin:
 *           type: integer
 *           nullable: true
 *         dinnerEndMin:
 *           type: integer
 *           nullable: true
 */