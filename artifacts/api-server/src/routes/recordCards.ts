import { Router } from "express";
import { db, recordCardsTable } from "@workspace/db";
import { eq, sql, count, desc } from "drizzle-orm";
import { ScrapeRecordCardsBody, CreateRecordCardBody } from "@workspace/api-zod";

const router = Router();

router.get("/record-cards", async (req, res) => {
  const { category, difficulty, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (category)   conditions.push(eq(recordCardsTable.category, category));
  if (difficulty) conditions.push(eq(recordCardsTable.difficulty, difficulty));

  const cards = await db.select().from(recordCardsTable)
    .where(conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined)
    .orderBy(desc(recordCardsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  res.json(cards.map(serializeCard));
});

router.post("/record-cards", async (req, res) => {
  const body = CreateRecordCardBody.parse(req.body);
  const [card] = await db.insert(recordCardsTable).values({
    title:         body.title,
    holder:        body.holder,
    value:         String(body.value),
    unit:          body.unit,
    previousValue: body.previousValue != null ? String(body.previousValue) : null,
    category:      body.category,
    subcategory:   body.subcategory,
    difficulty:    body.difficulty ?? "medium",
    ageRange:      body.ageRange,
    recordDate:    body.recordDate,
    location:      body.location,
    source:        body.source,
    sourceUrl:     body.sourceUrl,
    verified:      false,
  }).returning();
  res.status(201).json(serializeCard(card));
});

router.get("/record-cards/stats", async (req, res) => {
  const [{ total }] = await db.select({ total: count() }).from(recordCardsTable);
  const byCategory = await db
    .select({ category: recordCardsTable.category, count: count() })
    .from(recordCardsTable)
    .groupBy(recordCardsTable.category);
  const [{ recent }] = await db.select({ recent: count() }).from(recordCardsTable)
    .where(sql`created_at > now() - interval '7 days'`);
  res.json({ total: Number(total), byCategory: byCategory.map(c => ({ category: c.category, count: Number(c.count) })), recentlyAdded: Number(recent) });
});

router.get("/record-cards/:id", async (req, res) => {
  const [card] = await db.select().from(recordCardsTable).where(eq(recordCardsTable.id, Number(req.params.id)));
  if (!card) return res.status(404).json({ error: "Not found" });
  res.json(serializeCard(card));
});

router.post("/record-cards/scrape", async (req, res) => {
  const body = ScrapeRecordCardsBody.parse(req.body);
  req.log.info({ sources: body.sources }, "Scrape job queued");
  res.json({ jobId: `scrape-${Date.now()}`, status: "queued", message: `Scrape job queued for ${body.sources.length} sources` });
});

function serializeCard(c: any) {
  return {
    ...c,
    value:         Number(c.value),
    previousValue: c.previousValue != null ? Number(c.previousValue) : null,
    createdAt:     c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

export default router;
