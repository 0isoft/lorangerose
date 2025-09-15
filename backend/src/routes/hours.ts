// src/routes/hours.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
    const rows = await prisma.businessHours.findMany({ orderBy: { weekday: "asc" } });
      const out = rows.map(r => ({
        weekday: r.weekday,
        text: r.displayText ?? "",
      }));
      res.json(out);
});

export default router;
export {}; // keeps the file a module under ts-node/HMR
