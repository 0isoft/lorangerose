// src/routes/admin/hours.ts
import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

function hhmmToMin(s?: string | null) {
  if (!s) return null;
  const [h, m] = s.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

const HoursPayload = z.object({
  weekday: z.number().int().min(0).max(6),
  closedAllDay: z.boolean().optional(),
  lunch: z.tuple([z.string(), z.string()]).nullable().optional(),
  dinner: z.tuple([z.string(), z.string()]).nullable().optional(),
  // NEW: one-line text like "12:00-14:30, 18:00-22:00"
  text: z.string().trim().optional(),
});

// Parse "12:00-14:30, 18:00-22:00" → up to two ranges [[start,end], [start,end]]
function parseTextToRanges(text?: string) {
  if (!text) return { lunch: null as [string,string] | null, dinner: null as [string,string] | null };
  const parts = text
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 2); // only keep first two ranges
  const ranges: [string,string][] = [];
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

router.get("/", async (_req, res) => {
    const rows = await prisma.businessHours.findMany({ orderBy: { weekday: "asc" } });
      // keep returning everything for admin, including displayText
    res.json(rows);
});

router.put("/:weekday", async (req, res) => {
  const weekday = Number(req.params.weekday);
  const parsed = HoursPayload.parse({ ...req.body, weekday });

  const text = (parsed.text ?? "").trim();
  const data = {
    weekday,
    displayText: text,
    // optional: define closedAllDay = empty text
    closedAllDay: parsed.closedAllDay ?? (text.length === 0),
    // optional: clear legacy minute fields to avoid confusion
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
