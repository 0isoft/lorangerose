// /routes/mediaPublic.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
  const qType = (req.query.type as string | undefined)?.toUpperCase();
  const takeParam = Number(req.query.take);
  const take = Number.isFinite(takeParam) && takeParam > 0 ? takeParam : undefined;

  const where: any = { published: true };
  if (qType === "HERO" || qType === "MENU" || qType === "ANNOUNCEMENT") {
    where.type = qType;
  }

  const rows = await prisma.mediaAsset.findMany({
    where,
    orderBy: qType ? [{ sortOrder: "asc" }] : [{ type: "asc" }, { sortOrder: "asc" }],
    // default to 3 only for MENU when take is not provided
    take: qType === "MENU" ? (take ?? 3) : take,
  });

  res.json(rows);
});

export default router;
