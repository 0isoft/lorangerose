export {}
import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

const SlotEnum = z.enum(["ALL", "LUNCH", "DINNER"]);
const Weekday = z.number().int().min(0).max(6);

const RecurringCreate = z.object({
  weekday: Weekday,
  slot: z.union([SlotEnum, z.enum(["all","lunch","dinner"]).transform(s => s.toUpperCase() as any)]),
  note: z.string().max(500).optional().nullable(),
  startsOn: z.coerce.date().optional().nullable(),
  endsOn: z.coerce.date().optional().nullable(),
  interval: z.coerce.number().int().min(1).optional().default(1),
});

const RecurringUpdate = RecurringCreate.partial();

router.get("/", async (_req, res) => {
  const rows = await prisma.recurringClosure.findMany({ orderBy: [{ weekday: "asc" }, { slot: "asc" }] });
  res.json(rows);
});

router.post("/", async (req, res) => {
  const data = RecurringCreate.parse(req.body);
  const created = await prisma.recurringClosure.create({
    data: { ...data, slot: data.slot as any },
  });
  res.status(201).json(created);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data = RecurringUpdate.parse(req.body);
  const updated = await prisma.recurringClosure.update({
    where: { id },
    data: { ...data, slot: (data.slot as any) ?? undefined },
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.recurringClosure.delete({ where: { id } });
  res.status(204).end();
});

export default router;
