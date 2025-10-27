/**
 * @file closures.ts
 * @brief Admin API routes for managing date-specific closures.
 * @details
 * Provides CRUD endpoints for manipulating closure exceptions for a calendar/schedule.
 * All endpoints require admin authentication.
 */

/**
 * @swagger
 * tags:
 *   name: AdminClosures
 *   description: Admin API for managing date-specific closures (requires authentication)
 */

/**
 * @swagger
 * /api/admin/closures:
 *   get:
 *     summary: Get all closures
 *     description: Returns a list of all closures, ordered by date ascending.
 *     tags: [AdminClosures]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of closures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Closure'
 *   post:
 *     summary: Create a new closure
 *     description: >
 *       Creates a new closure record for the given date and slot.
 *       Returns 409 Conflict if a closure for the same date/slot already exists.
 *     tags: [AdminClosures]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClosureCreate'
 *     responses:
 *       201:
 *         description: The created closure object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Closure'
 *       409:
 *         description: Conflict - closure for date/slot already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Closure for this date/slot already exists
 *
 * /api/admin/closures/{id}:
 *   patch:
 *     summary: Update a closure
 *     description: Updates an existing closure identified by ID. Fields not supplied remain unchanged.
 *     tags: [AdminClosures]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The closure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClosureUpdate'
 *     responses:
 *       200:
 *         description: The updated closure object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Closure'
 *   delete:
 *     summary: Delete a closure
 *     description: Deletes an existing closure by its ID.
 *     tags: [AdminClosures]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The closure ID
 *     responses:
 *       204:
 *         description: No Content (deletion successful)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Closure:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Closure ID
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the closure (ISO 8601)
 *         slot:
 *           type: string
 *           enum: [ALL, LUNCH, DINNER]
 *           description: Service slot ("ALL", "LUNCH", or "DINNER")
 *         note:
 *           type: string
 *           nullable: true
 *           description: Optional closure note
 *     ClosureCreate:
 *       type: object
 *       required:
 *         - date
 *         - slot
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Closure date (ISO 8601)
 *         slot:
 *           type: string
 *           description: Service slot ("ALL", "LUNCH", or "DINNER")
 *           enum: [ALL, LUNCH, DINNER, all, lunch, dinner]
 *         note:
 *           type: string
 *           nullable: true
 *           maxLength: 500
 *           description: Optional note (max 500 chars)
 *     ClosureUpdate:
 *       allOf:
 *         - $ref: '#/components/schemas/ClosureCreate'
 *       description: All fields optional for PATCH
 */

import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

/**
 * @brief Zod enum for allowed closure slots.
 * @details Restricts values to "ALL", "LUNCH", or "DINNER" (case-insensitive supported).
 */
const SlotEnum = z.enum(["ALL", "LUNCH", "DINNER"]);

/**
 * @brief Zod schema for creating a closure.
 * @details
 * Requires a date, accepts either SlotEnum or lower-case equivalents ("all", "lunch", "dinner"),
 * and allows an optional note.
 */
const ClosureCreate = z.object({
  date: z.coerce.date(),    /**< Closure date (ISO 8601 or Date object) */
  slot: z.union([SlotEnum, z.enum(["all", "lunch", "dinner"]).transform(s => s.toUpperCase() as any)]), /**< Service slot ("ALL", "LUNCH", "DINNER") */
  note: z.string().max(500).optional().nullable(),   /**< Optional closure note (max 500 chars) */
});

/**
 * @brief Zod schema for updating a closure.
 * @details All fields optional; used for PATCH.
 */
const ClosureUpdate = ClosureCreate.partial();

/**
 * @brief GET /api/admin/closures
 * @route GET /
 * @returns {Array} List of all closures, ordered by date ascending.
 * @details
 * Returns all closure records for admin view.
 */
router.get("/", async (_req, res) => {
  // Admin list: show all ascending by date
  const rows = await prisma.closure.findMany({ orderBy: { date: "asc" } });
  res.json(rows);
});

/**
 * @brief POST /api/admin/closures
 * @route POST /
 * @param req.body ClosureCreate
 * @returns {Object} The created closure object
 * @details
 * Creates a new closure record for the given date and slot.
 * Returns 409 Conflict if a closure for the same date/slot already exists.
 */
router.post("/", async (req, res) => {
  const data = ClosureCreate.parse(req.body);
  try {
    const created = await prisma.closure.create({ data: { ...data, slot: data.slot as any } });
    res.status(201).json(created);
  } catch (e: any) {
    if (e.code === "P2002") {
      // unique(date, slot)
      return res.status(409).json({ error: "Closure for this date/slot already exists" });
    }
    throw e;
  }
});

/**
 * @brief PATCH /api/admin/closures/:id
 * @route PATCH /:id
 * @param req.params.id Closure ID to update
 * @param req.body ClosureUpdate
 * @returns {Object} The updated closure object
 * @details
 * Updates an existing closure identified by ID. Fields not supplied remain unchanged.
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = ClosureUpdate.parse(req.body);
  const updated = await prisma.closure.update({ where: { id }, data: { ...data, slot: data.slot as any } });
  res.json(updated);
});

/**
 * @brief DELETE /api/admin/closures/:id
 * @route DELETE /:id
 * @param req.params.id Closure ID to delete
 * @returns 204 No Content on success
 * @details
 * Deletes an existing closure by its ID.
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.closure.delete({ where: { id } });
  res.status(204).end();
});

export default router;
