import { Router } from "express";
import { db, templatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTemplateBody } from "@workspace/api-zod";

const router = Router();

router.get("/templates", async (req, res) => {
  const { topic, difficulty } = req.query as Record<string, string>;
  let rows = await db.select().from(templatesTable);
  if (topic)      rows = rows.filter(t => t.topic === topic);
  if (difficulty) rows = rows.filter(t => t.difficulty === difficulty);
  res.json(rows.map(serializeTemplate));
});

router.post("/templates", async (req, res) => {
  const body = CreateTemplateBody.parse(req.body);
  const [t] = await db.insert(templatesTable).values({
    name: body.name, topic: body.topic, difficulty: body.difficulty,
    templateText: body.templateText, variables: body.variables,
    mathOperation: body.mathOperation, exampleOutput: body.exampleOutput,
  }).returning();
  res.status(201).json(serializeTemplate(t));
});

router.get("/templates/:id", async (req, res) => {
  const [t] = await db.select().from(templatesTable).where(eq(templatesTable.id, Number(req.params.id)));
  if (!t) return res.status(404).json({ error: "Not found" });
  res.json(serializeTemplate(t));
});

function serializeTemplate(t: any) {
  return { ...t, createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt };
}

export default router;
