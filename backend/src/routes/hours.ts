/**
 * @file hours.ts
 * @brief Public API routes for retrieving published business hours
 * @date 2025
 * @version 1.0
 * @author 0isoft
 */

import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Business Hours
 *   description: Public endpoint for retrieving the restaurant’s published business hours
 */

/**
 * @swagger
 * /api/hours:
 *   get:
 *     summary: Retrieve published business hours
 *     description: >
 *       Returns an array of business hours entries for each weekday, ordered from Monday (0) to Sunday (6).  
 *       Each entry includes the weekday index and a human-readable `text` string such as `"11:00–14:00, 17:30–22:00"`.  
 *       If a day is closed, the `text` field will be an empty string.
 *     tags: [Business Hours]
 *     responses:
 *       200:
 *         description: List of business hours for the week
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusinessHour'
 *             examples:
 *               example:
 *                 summary: Example response
 *                 value:
 *                   - weekday: 0
 *                     text: "11:00–14:00, 17:30–22:00"
 *                   - weekday: 1
 *                     text: ""
 *                   - weekday: 2
 *                     text: "11:30–15:00, 18:00–22:30"
 *       500:
 *         description: Internal server error
 */
router.get("/", async (_req, res) => {
  const rows = await prisma.businessHours.findMany({ orderBy: { weekday: "asc" } });

  const out = rows.map(r => ({
    weekday: r.weekday,
    text: r.displayText ?? "",
  }));

  res.json(out);
});

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     BusinessHour:
 *       type: object
 *       required:
 *         - weekday
 *         - text
 *       properties:
 *         weekday:
 *           type: integer
 *           description: Day of the week (0=Monday, 6=Sunday)
 *           example: 0
 *         text:
 *           type: string
 *           description: Human-readable opening hours, or empty string if closed
 *           example: "11:00–14:00, 17:30–22:00"
 */

export {};
