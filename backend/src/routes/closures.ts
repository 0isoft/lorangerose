// routes/closures.ts (public)
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// default horizon: now → now + 5y
function defaultRange() {
  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 5);
  return { start, end };
}

router.get("/", async (req, res) => {
  const { start: qsStart, end: qsEnd } = req.query as { start?: string; end?: string };
  const { start, end } = (() => {
    try {
      if (qsStart && qsEnd) return { start: new Date(qsStart), end: new Date(qsEnd) };
    } catch {}
    return defaultRange();
  })();

  // 1) fetch one-offs (as-is)
  const oneOffs = await prisma.closure.findMany({
    orderBy: { date: "asc" },
    where: { date: { gte: start, lte: end } },
  });

  // 2) fetch recurring rules and expand to concrete dates within range
  const rules = await prisma.recurringClosure.findMany();
  const expanded: Array<{ id: string; date: Date; slot: "ALL"|"LUNCH"|"DINNER"; note: string|null }> = [];

  for (const r of rules) {
    // compute effective range
    const effStart = new Date(Math.max(start.getTime(), (r.startsOn?.getTime() ?? start.getTime())));
    const effEnd   = new Date(Math.min(end.getTime(),   (r.endsOn?.getTime()   ?? end.getTime())));
    if (effStart > effEnd) continue;

    // find first occurrence on/after effStart that matches weekday
    const first = new Date(effStart);
    const mon0 = (first.getDay() + 6) % 7; // Mon=0
    const delta = (r.weekday - mon0 + 7) % 7;
    first.setDate(first.getDate() + delta);

    const intervalWeeks = r.interval ?? 1;

    for (let d = new Date(first); d <= effEnd; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7*intervalWeeks)) {
      // synthesize a stable id per occurrence (ruleId + ISO)
      const iso = d.toISOString();
      expanded.push({
        id: `rec_${r.id}_${iso.slice(0,10)}`,
        date: d,
        slot: r.slot,
        note: r.note ?? null,
      });
    }
  }

  // 3) merge & return in the same shape as one-offs
  //    (front-end already merges lunch/dinner → all if both present)
  const out = [
    ...oneOffs.map(o => ({ id: o.id, date: o.date, slot: o.slot, note: o.note ?? null })),
    ...expanded
  ].sort((a,b) => a.date.getTime() - b.date.getTime());

  res.json(out);
});

export default router;
