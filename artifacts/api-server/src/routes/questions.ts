import { Router } from "express";
import { db, questionsTable, recordCardsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { GenerateQuestionBody } from "@workspace/api-zod";
import { generateQuestion } from "../lib/questionEngine";
import { getAllProviders } from "../lib/providers";

const router = Router();

// ── List questions ─────────────────────────────────────────────────────────────

router.get("/questions", async (req, res) => {
  const { difficulty, topic, recordCardId, limit = "20", offset = "0" } = req.query as Record<string, string>;

  let rows = await db.select().from(questionsTable).limit(Math.min(100, Number(limit))).offset(Number(offset));
  if (difficulty)   rows = rows.filter(q => q.difficulty === difficulty);
  if (topic)        rows = rows.filter(q => q.topic === topic);
  if (recordCardId) rows = rows.filter(q => q.recordCardId === Number(recordCardId));

  const cardIds = [...new Set(rows.map(q => q.recordCardId))];
  const cards   = cardIds.length > 0
    ? await db.select().from(recordCardsTable).where(inArray(recordCardsTable.id, cardIds))
    : [];
  const cardMap = Object.fromEntries(cards.map(c => [c.id, c]));

  // SECURITY: Never expose correctAnswer in list endpoint — only needed at answer-submission time
  res.json(rows.map(q => serializeQuestion(q, cardMap[q.recordCardId], { hideAnswer: true })));
});

// ── Generate a question ────────────────────────────────────────────────────────

router.post("/questions/generate", async (req, res) => {
  try {
    const body   = GenerateQuestionBody.parse(req.body);
    const [card] = await db.select().from(recordCardsTable).where(eq(recordCardsTable.id, body.recordCardId));
    if (!card) return res.status(404).json({ error: "Record card not found" });

    const question = await generateQuestion({
      card:       card as any,
      topic:      body.topic,
      difficulty: body.difficulty,
      roundName:  body.roundName ?? undefined,
      logger:     req.log,
    });

    // SECURITY: strip answer from generate response too — caller doesn't need it
    res.json(serializeQuestion(question, card, { hideAnswer: true }));
  } catch (err: any) {
    req.log.error({ err }, "Question generation failed");
    res.status(500).json({ error: err?.message ?? "Generation failed" });
  }
});

// ── Single question (by ID) ────────────────────────────────────────────────────

router.get("/questions/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid question ID" });

  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!q) return res.status(404).json({ error: "Not found" });

  const [card] = await db.select().from(recordCardsTable).where(eq(recordCardsTable.id, q.recordCardId));
  // SECURITY: hide answer from single-question GET as well
  res.json(serializeQuestion(q, card, { hideAnswer: true }));
});

// ── Validate a question's answer ───────────────────────────────────────────────
// Deprecated: answer validation now happens through the match flow
router.post("/questions/:id/validate", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid question ID" });

  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!q) return res.status(404).json({ error: "Not found" });

  // SECURITY: only return validity + steps, never correctAnswer outside match context
  res.json({ valid: true, steps: q.steps });
});

// ── Provider status ────────────────────────────────────────────────────────────

router.get("/providers", async (_req, res) => {
  res.json(getAllProviders());
});

// ── Serializer ────────────────────────────────────────────────────────────────

function serializeQuestion(q: any, card?: any, opts: { hideAnswer?: boolean } = {}) {
  const out: any = {
    id:               q.id,
    recordCardId:     q.recordCardId,
    templateId:       q.templateId ?? null,
    roundName:        q.roundName,
    topic:            q.topic,
    difficulty:       q.difficulty,
    scenario:         q.scenario,
    questionText:     q.questionText,
    options:          q.options,
    steps:            opts.hideAnswer ? [] : (q.steps ?? []),  // hide steps until answered
    knockoutChallenge: q.knockoutChallenge ?? null,
    hash:             q.hash,
    validated:        q.validated,
    timeLimitSeconds: q.timeLimitSeconds,
    pointValue:       q.pointValue,
    createdAt:        q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
  };

  // CRITICAL: never expose correctAnswer to clients — only returned after submission
  if (!opts.hideAnswer) {
    out.correctAnswer = q.correctAnswer;
  }

  if (card) {
    out.recordCard = {
      id:            card.id,
      title:         card.title,
      holder:        card.holder ?? null,
      value:         Number(card.value),
      previousValue: card.previousValue ? Number(card.previousValue) : null,
      unit:          card.unit,
      category:      card.category,
      subcategory:   card.subcategory ?? null,
      difficulty:    card.difficulty,
      source:        card.source,
      verified:      card.verified,
      recordDate:    card.recordDate ?? null,
      location:      card.location ?? null,
      createdAt:     card.createdAt instanceof Date ? card.createdAt.toISOString() : card.createdAt,
    };
  }

  return out;
}

export { serializeQuestion };
export default router;
