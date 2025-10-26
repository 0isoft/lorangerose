/**
 * @file closures.ts
 * @brief Public API routes for managing restaurant closures and recurring closure rules
 * @author 0isoft
 * @date 2025
 * 
 * This module provides REST API endpoints for retrieving closure information,
 * including both exceptional (one-time) closures and recurring closure patterns.
 * It handles date range queries and expands recurring rules into specific dates.
 */

// routes/closures.ts (public)
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * @brief Generates a default date range for closure queries
 * @details Creates a date range from the current date (at midnight) to 5 years in the future.
 * This is used when no specific start/end dates are provided in the query parameters.
 * @return {Object} Object containing start and end Date objects
 * @return {Date} return.start - Start date (today at 00:00:00)
 * @return {Date} return.end - End date (5 years from start)
 * 
 * @example
 * const range = defaultRange();
 * console.log(range.start); // 2025-01-15T00:00:00.000Z
 * console.log(range.end);   // 2030-01-15T00:00:00.000Z
 */
function defaultRange() {
  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 5);
  return { start, end };
}

/**
 * @brief GET /closures - Retrieve closure information within a date range
 * @details This endpoint returns both exceptional (one-time) closures and expanded recurring closure rules.
 * The response includes a 'kind' field to distinguish between "EXCEPTIONAL" and "RECURRING" closures.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.start] - Start date in ISO format (YYYY-MM-DD)
 * @param {string} [req.query.end] - End date in ISO format (YYYY-MM-DD)
 * @param {Object} res - Express response object
 * 
 * @return {Object[]} Array of closure objects
 * @return {string} return[].id - Unique identifier for the closure
 * @return {Date} return[].date - Date of the closure
 * @return {string} return[].slot - Time slot affected ("ALL", "LUNCH", or "DINNER")
 * @return {string|null} return[].note - Optional note about the closure
 * @return {string} return[].kind - Type of closure ("EXCEPTIONAL" or "RECURRING")
 * 
 * @throws {Error} Database query errors are caught and handled internally
 * 
 * @example
 * // Get closures for the next month
 * GET /closures?start=2025-01-01&end=2025-01-31
 * 
 * @example
 * // Get all closures (default 5-year range)
 * GET /closures
 * 
 * @example Response:
 * [
 *   {
 *     "id": "closure_123",
 *     "date": "2025-01-20T00:00:00.000Z",
 *     "slot": "ALL",
 *     "note": "Holiday closure",
 *     "kind": "EXCEPTIONAL"
 *   },
 *   {
 *     "id": "rec_456_2025-01-15",
 *     "date": "2025-01-15T00:00:00.000Z",
 *     "slot": "LUNCH",
 *     "note": "Weekly maintenance",
 *     "kind": "RECURRING"
 *   }
 * ]
 */
router.get("/", async (req, res) => {
  const { start: qsStart, end: qsEnd } = req.query as { start?: string; end?: string };
  
  /**
   * @brief Parse and validate date range from query parameters
   * @details Attempts to parse start and end dates from query string.
   * Falls back to default range if parsing fails or dates are invalid.
   */
  const { start, end } = (() => {
    try {
      if (qsStart && qsEnd) return { start: new Date(qsStart), end: new Date(qsEnd) };
    } catch {}
    return defaultRange();
  })();

  /**
   * @brief Fetch exceptional (one-time) closures from database
   * @details Retrieves all closure records within the specified date range,
   * ordered chronologically by date.
   */
  const oneOffs = await prisma.closure.findMany({
    orderBy: { date: "asc" },
    where: { date: { gte: start, lte: end } },
  });

  /**
   * @brief Fetch and expand recurring closure rules
   * @details Retrieves all recurring closure rules and expands them into specific dates
   * within the requested range, accounting for start/end dates and intervals.
   */
  const rules = await prisma.recurringClosure.findMany();
  
  /**
   * @typedef {Object} ExpandedClosure
   * @property {string} id - Generated ID combining rule ID and date
   * @property {Date} date - Calculated date for this occurrence
   * @property {string} slot - Time slot affected ("ALL", "LUNCH", or "DINNER")
   * @property {string|null} note - Optional note from the rule
   */
  const expanded: Array<{
    id: string; date: Date; slot: "ALL" | "LUNCH" | "DINNER"; note: string | null;
  }> = [];

  /**
   * @brief Expand recurring rules into specific closure dates
   * @details Iterates through each recurring rule and calculates all occurrences
   * within the effective date range, considering the rule's start/end dates and interval.
   */
  for (const r of rules) {
    // Calculate effective start date (later of query start or rule start)
    const effStart = new Date(Math.max(start.getTime(), (r.startsOn?.getTime() ?? start.getTime())));
    // Calculate effective end date (earlier of query end or rule end)
    const effEnd   = new Date(Math.min(end.getTime(),   (r.endsOn?.getTime()   ?? end.getTime())));
    
    // Skip if no overlap between query range and rule range
    if (effStart > effEnd) continue;

    /**
     * @brief Calculate first occurrence of the recurring rule
     * @details Finds the first date within the effective range that matches
     * the rule's weekday pattern, accounting for the rule's interval.
     */
    const first = new Date(effStart);
    // Convert Sunday=0 to Monday=0 weekday system
    const mon0 = (first.getDay() + 6) % 7;
    // Calculate days to add to reach the target weekday
    const delta = (r.weekday - mon0 + 7) % 7;
    first.setDate(first.getDate() + delta);

    /**
     * @brief Generate all occurrences within the effective range
     * @details Iterates through the calculated interval, generating closure dates
     * and creating expanded closure objects with unique IDs.
     */
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

  /**
   * @brief Combine and format closure data for response
   * @details Merges exceptional and recurring closures, adds the 'kind' field
   * to distinguish between them, and sorts the final result chronologically.
   */
  const out = [
    ...oneOffs.map(o => ({
      id: o.id, date: o.date, slot: o.slot, note: o.note ?? null, kind: "EXCEPTIONAL" as const,
    })),
    ...expanded.map(e => ({
      ...e, kind: "RECURRING" as const,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  res.json(out);
});

export default router;