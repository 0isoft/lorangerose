import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

const SlotEnum = z.enum(["ALL", "LUNCH", "DINNER"]);

const ClosureCreate = z.object({
  date: z.coerce.date(),
  slot: z.union([SlotEnum, z.enum(["all", "lunch", "dinner"]).transform(s => s.toUpperCase() as any)]),
  note: z.string().max(500).optional().nullable(),
});

const ClosureUpdate = ClosureCreate.partial();

router.get("/", async (_req, res) => {
  // Admin list: show all ascending by date
  const rows = await prisma.closure.findMany({ orderBy: { date: "asc" } });
  res.json(rows);
});

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

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = ClosureUpdate.parse(req.body);
  const updated = await prisma.closure.update({ where: { id }, data: { ...data, slot: data.slot as any } });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.closure.delete({ where: { id } });
  res.status(204).end();
});

export default router;
