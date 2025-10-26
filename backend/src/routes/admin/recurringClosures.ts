/**
 * @file recurringClosures.ts
 * @brief Admin API routes for managing recurring weekly schedule closures.
 * @details
 * Provides CRUD endpoints for manipulating recurring (weekly) closure exceptions.
 * All endpoints require admin authentication.
 */

export {}
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
 * @brief Zod schema for allowed weekdays.
 * @details Restricts value to integer in range 0 (Sunday) to 6 (Saturday).
 */
const Weekday = z.number().int().min(0).max(6);

/**
 * @brief Zod schema for creating a recurring closure.
 * @details
 * - `weekday`: Day of week (0=Sun, ..., 6=Sat)
 * - `slot`: Closure slot ("ALL", "LUNCH", "DINNER"), case insensitive
 * - `note`: Optional note (max 500 chars)
 * - `startsOn`: Optional date the closure schedule begins (inclusive)
 * - `endsOn`: Optional date the closure schedule ends (inclusive)
 * - `interval`: Interval in weeks (default: 1)
 */
const RecurringCreate = z.object({
  weekday: Weekday, /**< Day of week for this recurring closure (0=Sun, ..., 6=Sat) */
  slot: z.union([
    SlotEnum, 
    z.enum(["all", "lunch", "dinner"]).transform(s => s.toUpperCase() as any)
  ]), /**< Recurring closure slot ("ALL", "LUNCH", "DINNER"), case-insensitive */
  note: z.string().max(500).optional().nullable(), /**< Optional closure note (max 500 chars) */
  startsOn: z.coerce.date().optional().nullable(), /**< Optional first date to apply closure */
  endsOn: z.coerce.date().optional().nullable(),   /**< Optional last date to apply closure */
  interval: z.coerce.number().int().min(1).optional().default(1), /**< Weeks between closures (default: 1) */
});

/**
 * @brief Zod schema for updating a recurring closure.
 * @details All fields optional for PATCH requests.
 */
const RecurringUpdate = RecurringCreate.partial();

/**
 * @brief GET /api/admin/recurring-closures
 * @route GET /
 * @returns {Array} List of all recurring closures, ordered by weekday and slot ascending.
 * @details
 * Returns all recurring closure records for admin view.
 */
router.get("/", async (_req, res) => {
  const rows = await prisma.recurringClosure.findMany({ orderBy: [{ weekday: "asc" }, { slot: "asc" }] });
  res.json(rows);
});

/**
 * @brief POST /api/admin/recurring-closures
 * @route POST /
 * @param req.body RecurringCreate
 * @returns {Object} The created recurring closure object
 * @details
 * Creates a new recurring closure. Does not prevent overlapping intervals or duplicate slots.
 */
router.post("/", async (req, res) => {
  const data = RecurringCreate.parse(req.body);
  const created = await prisma.recurringClosure.create({
    data: { ...data, slot: data.slot as any },
  });
  res.status(201).json(created);
});

/**
 * @brief PATCH /api/admin/recurring-closures/:id
 * @route PATCH /:id
 * @param req.params.id {string} Closure ID to update
 * @param req.body RecurringUpdate
 * @returns {Object} The updated recurring closure object
 * @details
 * Updates an existing recurring closure by ID. Only fields present are updated.
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
 * @brief DELETE /api/admin/recurring-closures/:id
 * @route DELETE /:id
 * @param req.params.id {string} Closure ID to delete
 * @returns 204 No Content on success
 * @details
 * Deletes a recurring closure by its ID.
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.recurringClosure.delete({ where: { id } });
  res.status(204).end();
});

export default router;
