import { Router } from "express";
import { db, studentsTable, studentPerformanceTable, matchesTable } from "@workspace/db";
import { eq, sql, ilike, count, avg } from "drizzle-orm";
import { CreateStudentBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_STUDENT = {
  username: "champion",
  displayName: "Champion",
  ageGroup: "11-13" as const,
  favoriteTopics: [] as string[],
};

async function getOrAutoCreateStudent(id: number) {
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, id));
  if (s) return s;
  const [created] = await db.insert(studentsTable).values(DEFAULT_STUDENT).returning();
  return created;
}

function serializeStudent(s: any) {
  return {
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    lastActiveAt: s.lastActiveAt instanceof Date ? s.lastActiveAt.toISOString() : s.lastActiveAt,
  };
}

// ── GET /students ─────────────────────────────────────────────────────────────

router.get("/students", async (req, res) => {
  const { limit = "20", offset = "0", city } = req.query as Record<string, string>;
  const safeLimit = Math.min(100, Number(limit));

  // Use SQL-level filtering — no in-memory scan
  const query = db.select().from(studentsTable).limit(safeLimit).offset(Number(offset));
  const students = city
    ? await db.select().from(studentsTable)
        .where(ilike(studentsTable.city!, `%${city}%`))
        .limit(safeLimit).offset(Number(offset))
    : await query;

  res.json(students.map(serializeStudent));
});

// ── POST /students ────────────────────────────────────────────────────────────

router.post("/students", async (req, res) => {
  const body = CreateStudentBody.parse(req.body);
  const [student] = await db.insert(studentsTable).values({
    username: body.username, displayName: body.displayName,
    email: body.email, ageGroup: body.ageGroup,
    school: body.school, favoriteTopics: body.favoriteTopics ?? [],
  }).returning();
  res.status(201).json(serializeStudent(student));
});

// ── GET /students/:id ─────────────────────────────────────────────────────────

router.get("/students/:id", async (req, res) => {
  const s = await getOrAutoCreateStudent(Number(req.params.id));
  res.json(serializeStudent(s));
});

// ── PATCH /students/:id ───────────────────────────────────────────────────────

router.patch("/students/:id", async (req, res) => {
  const allowed = ["displayName", "school", "city", "country", "ageGroup", "favoriteTopics", "grade", "parentEmail", "adminNotes"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  const [s] = await db.update(studentsTable).set(updates)
    .where(eq(studentsTable.id, Number(req.params.id))).returning();
  if (!s) return res.status(404).json({ error: "Not found" });
  res.json(serializeStudent(s));
});

// ── GET /students/:id/stats ───────────────────────────────────────────────────

router.get("/students/:id/stats", async (req, res) => {
  const studentId = Number(req.params.id);
  const s = await getOrAutoCreateStudent(studentId);

  // Aggregated in one query
  const [perfAgg] = await db.select({
    totalQ:    count(),
    correct:   sql<number>`SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int`,
    avgTimeMs: avg(studentPerformanceTable.responseTimeMs),
  }).from(studentPerformanceTable).where(eq(studentPerformanceTable.studentId, studentId));

  const totalQ   = Number(perfAgg.totalQ);
  const correct  = Number(perfAgg.correct);
  const accuracy = totalQ > 0 ? correct / totalQ : 0;
  const avgTime  = perfAgg.avgTimeMs ? Number(perfAgg.avgTimeMs) / 1000 : 0;

  // Win rate from completed matches (server-computed, never client-trusted)
  const completedMatches = await db.select({ rounds: matchesTable.rounds })
    .from(matchesTable)
    .where(sql`student_id = ${studentId} AND status = 'completed'`);

  const totalCompleted = completedMatches.length;
  const wins = completedMatches.filter(m => {
    const rounds = (m.rounds as any[]) ?? [];
    const c = rounds.filter((r: any) => r.correct).length;
    return c >= Math.ceil(rounds.length / 2);
  }).length;
  const winRate = totalCompleted > 0 ? wins / totalCompleted : 0;

  res.json({
    studentId, totalQuestions: totalQ, correctAnswers: correct, accuracy,
    avgResponseTime: avgTime,
    currentStreak: s.streak, longestStreak: s.streak,
    elo: s.elo, belt: s.belt, weeklyGrowth: 0,
    totalMatches: s.totalMatches, totalWins: s.totalWins, winRate,
    city: s.city, school: s.school,
  });
});

// ── GET /students/:id/mastery ─────────────────────────────────────────────────

router.get("/students/:id/mastery", async (req, res) => {
  const studentId = Number(req.params.id);
  await getOrAutoCreateStudent(studentId);

  // Single aggregated query per topic
  const topicRows = await db.select({
    topic:     studentPerformanceTable.topic,
    total:     count(),
    correct:   sql<number>`SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int`,
    avgTimeMs: avg(studentPerformanceTable.responseTimeMs),
    lastCorrect: sql<boolean>`(array_agg(correct ORDER BY created_at DESC))[1]`,
  })
    .from(studentPerformanceTable)
    .where(eq(studentPerformanceTable.studentId, studentId))
    .groupBy(studentPerformanceTable.topic);

  const topicMap = Object.fromEntries(topicRows.map(r => [r.topic, r]));
  const allTopics = ["arithmetic", "algebra", "percentages", "ratios", "statistics", "probability", "geometry"];

  const result = allTopics.map(topic => {
    const r    = topicMap[topic];
    const tot  = r ? Number(r.total)   : 0;
    const cor  = r ? Number(r.correct) : 0;
    const acc  = tot > 0 ? cor / tot : 0;
    const mastery = Math.min(100, acc * 100 * (1 + Math.log10(Math.max(1, tot)) / 5));
    const trend   = !r || tot < 2 ? "stable" : (r.lastCorrect ? "up" : "down");
    return {
      topic, mastery, accuracy: acc,
      avgResponseTime: r?.avgTimeMs ? Number(r.avgTimeMs) / 1000 : 0,
      questionsAttempted: tot, trend,
    };
  });

  res.json(result);
});

// ── GET /students/:id/recommendations ────────────────────────────────────────

router.get("/students/:id/recommendations", async (req, res) => {
  const studentId = Number(req.params.id);
  const s = await getOrAutoCreateStudent(studentId);

  const topicRows = await db.select({
    topic:   studentPerformanceTable.topic,
    total:   count(),
    correct: sql<number>`SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int`,
  })
    .from(studentPerformanceTable)
    .where(eq(studentPerformanceTable.studentId, studentId))
    .groupBy(studentPerformanceTable.topic);

  const weakAreas = topicRows
    .filter(r => Number(r.total) >= 3 && Number(r.correct) / Number(r.total) < 0.6)
    .map(r => r.topic);

  const practiceTopics = weakAreas.length > 0 ? weakAreas.slice(0, 3) : ["arithmetic", "algebra"];
  const nextDifficulty = s.elo < 1100 ? "easy" : s.elo < 1300 ? "medium" : s.elo < 1600 ? "hard" : "expert";

  res.json({ practiceTopics, nextDifficulty, dailyChallenge: null, weakAreas });
});

// ── GET /students/:id/match-history ──────────────────────────────────────────

router.get("/students/:id/match-history", async (req, res) => {
  const studentId = Number(req.params.id);
  const { limit = "10" } = req.query as Record<string, string>;

  const matches = await db.select().from(matchesTable)
    .where(eq(matchesTable.studentId, studentId))
    .orderBy(sql`created_at DESC`)
    .limit(Math.min(50, Number(limit)));

  res.json(matches.map(m => ({
    ...m,
    accuracy:        Number(m.accuracy),
    comboMultiplier: Number(m.comboMultiplier),
    createdAt:       m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    completedAt:     m.completedAt instanceof Date ? m.completedAt.toISOString() : m.completedAt,
    // Compute win server-side — client never derives this
    won: m.status === "completed" ? (() => {
      const rounds = (m.rounds as any[]) ?? [];
      const c = rounds.filter((r: any) => r.correct).length;
      return c >= Math.ceil(rounds.length / 2);
    })() : null,
  })));
});

export default router;
