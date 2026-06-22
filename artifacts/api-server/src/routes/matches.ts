import { Router } from "express";
import { db, matchesTable, studentsTable, questionsTable, recordCardsTable, studentPerformanceTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateMatchBody, SubmitAnswerBody } from "@workspace/api-zod";
import { pickMatchQuestion } from "../lib/questionEngine";

const router = Router();

const ROUND_NAMES = ["Warmup", "Jab", "Hook", "Uppercut", "Knockout"];

// ── Belt / ELO ────────────────────────────────────────────────────────────────

export function eloToBelt(elo: number): string {
  if (elo >= 2200) return "legend";
  if (elo >= 1900) return "champion";
  if (elo >= 1600) return "diamond";
  if (elo >= 1300) return "platinum";
  if (elo >= 1100) return "gold";
  if (elo >= 1050) return "silver";
  return "bronze";
}

/** Server-side ELO delta — never computed client-side */
function computeEloChange(correct: number, total: number, streak: number): number {
  const base = (correct / Math.max(1, total)) * 32;
  return Math.round(base + streak * 2 - 16);
}

/** Determines whether a completed match is a "win" — pure server logic */
function isMatchWin(rounds: any[]): boolean {
  const correct = rounds.filter((r: any) => r.correct).length;
  return correct >= Math.ceil(rounds.length / 2);
}

// ── Serialization ─────────────────────────────────────────────────────────────

function serializeMatch(m: any) {
  return {
    ...m,
    accuracy:        Number(m.accuracy),
    comboMultiplier: Number(m.comboMultiplier),
    createdAt:       m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    completedAt:     m.completedAt instanceof Date ? m.completedAt.toISOString() : m.completedAt,
    currentQuestion: undefined,
  };
}

/**
 * SECURITY: Strip correctAnswer from any question sent to the client.
 * The answer is only returned in the POST /matches/:id/answer response,
 * after the student has irrevocably committed their choice.
 */
function safeQuestion(q: any): any {
  if (!q) return null;
  const { correctAnswer: _removed, ...safe } = q;
  // Also hide solution steps until after answer is submitted
  return { ...safe, steps: [] };
}

async function attachCard(q: any): Promise<any | null> {
  if (!q) return null;
  const [card] = await db.select().from(recordCardsTable).where(eq(recordCardsTable.id, q.recordCardId));
  return {
    ...q,
    createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
    recordCard: card
      ? {
          id: card.id, title: card.title, holder: card.holder ?? null,
          value: Number(card.value), previousValue: card.previousValue ? Number(card.previousValue) : null,
          unit: card.unit, category: card.category, subcategory: card.subcategory ?? null,
          difficulty: card.difficulty, source: card.source, verified: card.verified,
          recordDate: card.recordDate ?? null, location: card.location ?? null,
          createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : card.createdAt,
        }
      : null,
  };
}

async function getUsedContext(rounds: any[]): Promise<{ usedQuestionIds: number[]; usedCardIds: number[] }> {
  const usedQuestionIds = rounds.map((r: any) => r.questionId).filter(Boolean);
  if (usedQuestionIds.length === 0) return { usedQuestionIds: [], usedCardIds: [] };
  const qs = await db.select({ id: questionsTable.id, recordCardId: questionsTable.recordCardId })
    .from(questionsTable);
  const usedCardIds = qs.filter(q => usedQuestionIds.includes(q.id)).map(q => q.recordCardId);
  return { usedQuestionIds, usedCardIds };
}

// ── GET /matches ──────────────────────────────────────────────────────────────

router.get("/matches", async (req, res) => {
  const { studentId, status, limit = "20", offset = "0" } = req.query as Record<string, string>;
  let rows = await db.select().from(matchesTable).limit(Math.min(100, Number(limit))).offset(Number(offset));
  if (studentId) rows = rows.filter(m => m.studentId === Number(studentId));
  if (status)    rows = rows.filter(m => m.status === status);
  res.json(rows.map(serializeMatch));
});

// ── POST /matches ─────────────────────────────────────────────────────────────

router.post("/matches", async (req, res) => {
  const body   = CreateMatchBody.parse(req.body);
  const topics = (body.topics ?? []) as string[];

  const firstQ = await pickMatchQuestion({
    difficulty: body.difficulty, topics,
    usedQuestionIds: [], usedCardIds: [], roundIndex: 0,
    logger: req.log,
  });

  const [match] = await db.insert(matchesTable).values({
    studentId: body.studentId, mode: body.mode, difficulty: body.difficulty,
    status: "active", currentRound: 1, totalRounds: 5, score: 0,
    accuracy: "0", streak: 0, comboMultiplier: "1",
    currentQuestionId: firstQ?.id ?? null, topics,
  }).returning();

  const withCard = firstQ ? await attachCard(firstQ) : null;
  const serialized = serializeMatch(match);
  serialized.currentQuestion = safeQuestion(withCard);   // ← answer stripped
  res.status(201).json(serialized);
});

// ── GET /matches/:id ──────────────────────────────────────────────────────────

router.get("/matches/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid match ID" });

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, id));
  if (!match) return res.status(404).json({ error: "Not found" });

  const serialized = serializeMatch(match);

  if (match.status === "active" && !match.currentQuestionId) {
    const rounds = (match.rounds ?? []) as any[];
    const { usedQuestionIds, usedCardIds } = await getUsedContext(rounds);
    const q = await pickMatchQuestion({
      difficulty: match.difficulty, topics: (match.topics ?? []) as string[],
      usedQuestionIds, usedCardIds, roundIndex: rounds.length,
      logger: req.log,
    });
    if (q) {
      await db.update(matchesTable).set({ currentQuestionId: q.id }).where(eq(matchesTable.id, match.id));
      serialized.currentQuestion = safeQuestion(await attachCard(q));  // ← answer stripped
    }
  } else if (match.currentQuestionId) {
    const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, match.currentQuestionId));
    serialized.currentQuestion = safeQuestion(await attachCard(q ?? null));  // ← answer stripped
  }

  res.json(serialized);
});

// ── POST /matches/:id/answer ──────────────────────────────────────────────────

router.post("/matches/:id/answer", async (req, res) => {
  const matchId = Number(req.params.id);
  if (isNaN(matchId)) return res.status(400).json({ error: "Invalid match ID" });

  const body = SubmitAnswerBody.parse(req.body);

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) return res.status(404).json({ error: "Not found" });
  if (match.status !== "active") return res.status(409).json({ error: "Match is not active" });

  // ANTI-CHEAT: validate question belongs to this active match
  if (match.currentQuestionId !== body.questionId) {
    return res.status(409).json({ error: "Question mismatch — possible replay attack" });
  }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, body.questionId));
  if (!question) return res.status(404).json({ error: "Question not found" });

  // ANTI-CHEAT: server-side correctness check — client result is never trusted
  const correct   = body.selectedAnswer === question.correctAnswer;
  const rounds    = (match.rounds ?? []) as any[];
  const newStreak = correct ? match.streak + 1 : 0;
  const comboMult = correct ? Math.min(4, 1 + Math.floor(newStreak / 3) * 0.5) : 1;

  // ANTI-CHEAT: response time sanity check (must be positive, cap at time limit)
  const maxMs       = (question.timeLimitSeconds ?? 60) * 1000;
  const responseMs  = Math.max(100, Math.min(body.responseTimeMs, maxMs));

  const basePoints  = correct ? question.pointValue : 0;
  const speedBonus  = correct && responseMs < 10000 ? Math.round((10000 - responseMs) / 200) : 0;
  const points      = Math.round(basePoints * comboMult) + speedBonus;

  rounds.push({
    roundNumber:    match.currentRound,
    roundName:      ROUND_NAMES[match.currentRound - 1] ?? "Warmup",
    questionId:     question.id,
    correct,
    responseTime:   responseMs / 1000,
    pointsEarned:   points,
    selectedAnswer: body.selectedAnswer,
  });

  const newScore      = match.score + points;
  const totalRounds   = rounds.length;
  const correctN      = rounds.filter((r: any) => r.correct).length;
  const newAccuracy   = correctN / totalRounds;
  const nextRound     = match.currentRound + 1;
  const matchComplete = nextRound > match.totalRounds;

  // Record performance (upsert to prevent replay duplicates)
  await db.insert(studentPerformanceTable).values({
    studentId: match.studentId, questionId: question.id, matchId,
    topic: question.topic, difficulty: question.difficulty,
    correct, responseTimeMs: responseMs, pointsEarned: points,
  }).onConflictDoNothing().catch(() => {});

  // Pick next question — smart, no repeats
  let nextQuestion: any = null;
  if (!matchComplete) {
    const { usedQuestionIds, usedCardIds } = await getUsedContext(rounds);
    const next = await pickMatchQuestion({
      difficulty: match.difficulty, topics: (match.topics ?? []) as string[],
      usedQuestionIds, usedCardIds, roundIndex: rounds.length,
      logger: req.log,
    });
    if (next) nextQuestion = safeQuestion(await attachCard(next));  // ← answer stripped
  }

  await db.update(matchesTable).set({
    score:             newScore,
    accuracy:          String(newAccuracy),
    streak:            newStreak,
    comboMultiplier:   String(comboMult),
    currentRound:      nextRound,
    rounds,
    currentQuestionId: nextQuestion?.id ?? null,
    status:            matchComplete ? "completed" : "active",
    completedAt:       matchComplete ? new Date() : null,
  }).where(eq(matchesTable.id, matchId));

  // Update student ELO on match completion
  if (matchComplete) {
    const eloChange = computeEloChange(correctN, totalRounds, newStreak);
    const [student]  = await db.select().from(studentsTable).where(eq(studentsTable.id, match.studentId));
    const newElo     = (student?.elo ?? 1000) + eloChange;
    const belt       = eloToBelt(newElo);
    const won        = isMatchWin(rounds);

    await db.update(studentsTable).set({
      elo:          sql`elo + ${eloChange}`,
      belt,
      streak:       newStreak,
      totalMatches: sql`total_matches + 1`,
      totalWins:    won ? sql`total_wins + 1` : studentsTable.totalWins,
      lastActiveAt: new Date(),
    }).where(eq(studentsTable.id, match.studentId)).catch(() => {});

    await db.update(matchesTable).set({ eloChange }).where(eq(matchesTable.id, matchId)).catch(() => {});
  }

  res.json({
    correct,
    // NOW we reveal the correct answer — student has already committed
    correctAnswer:   question.correctAnswer,
    pointsEarned:    points,
    comboMultiplier: comboMult,
    explanation:     correct
      ? `Correct! +${points} pts${comboMult > 1 ? ` (×${comboMult} combo!)` : ""}`
      : `The correct answer was ${question.correctAnswer}.`,
    // Steps revealed only after submission
    steps:           question.steps ?? [],
    matchComplete,
    nextQuestion,
    // Server-computed result — client must not override this
    roundSummary: {
      round:        match.currentRound,
      roundName:    ROUND_NAMES[match.currentRound - 1] ?? "Warmup",
      correct,
      pointsEarned: points,
      newScore,
      newStreak,
      comboMultiplier: comboMult,
    },
  });
});

// ── POST /matches/:id/complete ────────────────────────────────────────────────

router.post("/matches/:id/complete", async (req, res) => {
  const matchId = Number(req.params.id);
  if (isNaN(matchId)) return res.status(400).json({ error: "Invalid match ID" });

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) return res.status(404).json({ error: "Not found" });

  await db.update(matchesTable)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(matchesTable.id, matchId));

  const rounds     = (match.rounds ?? []) as any[];
  const correct    = rounds.filter((r: any) => r.correct).length;
  const eloChange  = computeEloChange(correct, Math.max(1, rounds.length), match.streak);
  const [student]  = await db.select().from(studentsTable).where(eq(studentsTable.id, match.studentId));
  const newElo     = (student?.elo ?? 1000) + eloChange;
  const won        = isMatchWin(rounds);

  res.json({
    matchId,
    score:        match.score,
    accuracy:     Number(match.accuracy),
    belt:         eloToBelt(newElo),
    eloChange,
    newElo,
    won,
    knockouts:    rounds.filter((r: any) => r.roundName === "Knockout" && r.correct).length,
    longestCombo: match.streak,
    fastestAnswer: rounds.length > 0 ? Math.min(...rounds.map((r: any) => r.responseTime)) : 0,
    rounds,
  });
});

export default router;
