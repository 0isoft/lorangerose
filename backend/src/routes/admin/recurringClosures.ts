/**
 * @file recurringClosures.ts
 * @brief Admin API routes for managing recurring weekly schedule closures.
 * @details
 * Provides CRUD endpoints for manipulating recurring (weekly) closure exceptions.
 * All endpoints require admin authentication.
 */

import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Recurring Closures
 *   description: Endpoints for managing recurring weekly closures (admin only)
 */

/**
 * @brief Zod enum for allowed closure slots.
 * @details Restricts values to "ALL", "LUNCH", or "DINNER" (case-insensitive supported).
 */
const SlotEnum = z.enum(["ALL", "LUNCH", "DINNER"]);

const Weekday = z.number().int().min(0).max(6);

const RecurringCreate = z.object({
  weekday: Weekday,
  slot: z.union([
    SlotEnum,
    z.enum(["all", "lunch", "dinner"]).transform(s => s.toUpperCase() as any),
  ]),
  note: z.string().max(500).optional().nullable(),
  startsOn: z.coerce.date().optional().nullable(),
  endsOn: z.coerce.date().optional().nullable(),
  interval: z.coerce.number().int().min(1).optional().default(1),
});

const RecurringUpdate = RecurringCreate.partial();

/**
 * @swagger
 * /api/admin/recurring-closures:
 *   get:
 *     summary: Get all recurring closures
 *     description: Returns all recurring closure records for admin view.
 *     tags: [Admin Recurring Closures]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of recurring closures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecurringClosure'
 */
router.get("/", async (_req, res) => {
  const rows = await prisma.recurringClosure.findMany({
    orderBy: [{ weekday: "asc" }, { slot: "asc" }],
  });
  res.json(rows);
});

/**
 * @swagger
 * /api/admin/recurring-closures:
 *   post:
 *     summary: Create a new recurring closure
 *     description: Creates a new recurring closure. Does not prevent overlapping intervals or duplicate slots.
 *     tags: [Admin Recurring Closures]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecurringClosureCreate'
 *     responses:
 *       201:
 *         description: Created recurring closure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecurringClosure'
 *       400:
 *         description: Invalid request payload
 */
router.post("/", async (req, res) => {
  const data = RecurringCreate.parse(req.body);
  const created = await prisma.recurringClosure.create({
    data: { ...data, slot: data.slot as any },
  });
  res.status(201).json(created);
});

/**
 * @swagger
 * /api/admin/recurring-closures/{id}:
 *   patch:
 *     summary: Update a recurring closure
 *     description: Updates an existing recurring closure by ID. Only fields present are updated.
 *     tags: [Admin Recurring Closures]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recurring closure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecurringClosureUpdate'
 *     responses:
 *       200:
 *         description: Updated recurring closure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecurringClosure'
 *       404:
 *         description: Closure not found
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = RecurringUpdate.parse(req.body);
  const updated = await prisma.recurringClosure.update({
    where: { id },
    data: { ...data, slot: (data.slot as any) ?? undefined },
  });
  res.json(updated);
});

/**
 * @swagger
 * /api/admin/recurring-closures/{id}:
 *   delete:
 *     summary: Delete a recurring closure
 *     description: Deletes a recurring closure by its ID.
 *     tags: [Admin Recurring Closures]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recurring closure ID
 *     responses:
 *       204:
 *         description: Successfully deleted (no content)
 *       404:
 *         description: Closure not found
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.recurringClosure.delete({ where: { id } });
  res.status(204).end();
});

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     RecurringClosure:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         weekday:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         slot:
 *           type: string
 *           enum: [ALL, LUNCH, DINNER]
 *         note:
 *           type: string
 *           nullable: true
 *         startsOn:
 *           type: string
 *           format: date
 *           nullable: true
 *         endsOn:
 *           type: string
 *           format: date
 *           nullable: true
 *         interval:
 *           type: integer
 *           minimum: 1
 *     RecurringClosureCreate:
 *       type: object
 *       required: [weekday, slot]
 *       properties:
 *         weekday:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         slot:
 *           type: string
 *           enum: [ALL, LUNCH, DINNER]
 *         note:
 *           type: string
 *           nullable: true
 *         startsOn:
 *           type: string
 *           format: date
 *           nullable: true
 *         endsOn:
 *           type: string
 *           format: date
 *           nullable: true
 *         interval:
 *           type: integer
 *           minimum: 1
 *     RecurringClosureUpdate:
 *       type: object
 *       properties:
 *         weekday:
 *           type: integer
 *         slot:
 *           type: string
 *           enum: [ALL, LUNCH, DINNER]
 *         note:
 *           type: string
 *           nullable: true
 *         startsOn:
 *           type: string
 *           format: date
 *           nullable: true
 *         endsOn:
 *           type: string
 *           format: date
 *           nullable: true
 *         interval:
 *           type: integer
 */

