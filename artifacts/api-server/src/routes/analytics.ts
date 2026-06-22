import { Router } from "express";
import { db, studentsTable, matchesTable, questionsTable, recordCardsTable, studentPerformanceTable, providerLogsTable } from "@workspace/db";
import { count, avg, sum, eq, sql } from "drizzle-orm";

const router = Router();

// ── Overview ─────────────────────────────────────────────────────────────────

router.get("/analytics/overview", async (req, res) => {
  const [[{ totalStudents }], [{ totalMatches }], [{ totalQuestions }], [{ totalRecords }]] = await Promise.all([
    db.select({ totalStudents: count() }).from(studentsTable),
    db.select({ totalMatches: count() }).from(matchesTable),
    db.select({ totalQuestions: count() }).from(questionsTable),
    db.select({ totalRecords: count() }).from(recordCardsTable),
  ]);

  // Single aggregated query — no full-table scan
  const [{ correctCount, totalCount }] = await db.select({
    correctCount: sql<number>`SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int`,
    totalCount:   count(),
  }).from(studentPerformanceTable);
  const avgAcc = totalCount > 0 ? Number(correctCount) / Number(totalCount) : 0;

  const [[{ activeToday }], [{ questionsToday }]] = await Promise.all([
    db.select({ activeToday: count() }).from(matchesTable)
      .where(sql`created_at > now() - interval '24 hours'`),
    db.select({ questionsToday: count() }).from(questionsTable)
      .where(sql`created_at > now() - interval '24 hours'`),
  ]);

  const categories = await db.select({ category: recordCardsTable.category, cnt: count() })
    .from(recordCardsTable).groupBy(recordCardsTable.category).orderBy(sql`count(*) DESC`).limit(1);
  const topCategory = categories[0]?.category ?? null;

  res.json({
    totalStudents: Number(totalStudents), totalMatches: Number(totalMatches),
    totalQuestions: Number(totalQuestions), totalRecordCards: Number(totalRecords),
    avgAccuracy: avgAcc, activeToday: Number(activeToday),
    questionsGeneratedToday: Number(questionsToday), topCategory,
  });
});

// ── Difficulty / Topic distribution ──────────────────────────────────────────

router.get("/analytics/difficulty-distribution", async (req, res) => {
  const rows = await db.select({
    difficulty:  studentPerformanceTable.difficulty,
    topic:       studentPerformanceTable.topic,
    total:       count(),
    correct:     sql<number>`SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int`,
  })
    .from(studentPerformanceTable)
    .groupBy(studentPerformanceTable.difficulty, studentPerformanceTable.topic);

  if (rows.length === 0) {
    return res.json([
      { difficulty: "easy",   topic: "arithmetic", count: 0, avgAccuracy: 0 },
      { difficulty: "medium", topic: "algebra",    count: 0, avgAccuracy: 0 },
    ]);
  }

  res.json(rows.map(r => ({
    difficulty: r.difficulty, topic: r.topic,
    count: Number(r.total),
    avgAccuracy: Number(r.total) > 0 ? Number(r.correct) / Number(r.total) : 0,
  })));
});

// ── Performance trend ─────────────────────────────────────────────────────────

router.get("/analytics/performance-trend", async (req, res) => {
  const days = Math.min(90, Math.max(1, Number((req.query as any).days ?? 30)));

  const rows = await db.select({
    date:     sql<string>`DATE(created_at)::text`,
    matchCnt: count(),
    avgScore: avg(matchesTable.score),
    avgAcc:   avg(sql<number>`accuracy::numeric`),
  })
    .from(matchesTable)
    .where(sql`created_at > now() - interval '${sql.raw(String(days))} days'`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at) ASC`);

  if (rows.length === 0) {
    return res.json([{ date: new Date().toISOString().slice(0, 10), matchesPlayed: 0, avgScore: 0, avgAccuracy: 0, newStudents: 0 }]);
  }

  res.json(rows.map(r => ({
    date: r.date, matchesPlayed: Number(r.matchCnt),
    avgScore:    r.avgScore    ? Number(r.avgScore)    : 0,
    avgAccuracy: r.avgAcc      ? Number(r.avgAcc)      : 0,
    newStudents: 0,
  })));
});

// ── Topic breakdown ───────────────────────────────────────────────────────────

router.get("/analytics/topic-breakdown", async (req, res) => {
  const rows = await db.select({
    topic:     studentPerformanceTable.topic,
    total:     count(),
    correct:   sql<number>`SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int`,
    avgTimeMs: avg(studentPerformanceTable.responseTimeMs),
  })
    .from(studentPerformanceTable)
    .groupBy(studentPerformanceTable.topic);

  if (rows.length === 0) {
    return res.json([{ topic: "arithmetic", totalAttempts: 0, correctAttempts: 0, accuracy: 0, avgTime: 0 }]);
  }

  res.json(rows.map(r => ({
    topic: r.topic,
    totalAttempts:   Number(r.total),
    correctAttempts: Number(r.correct),
    accuracy:  Number(r.total) > 0 ? Number(r.correct) / Number(r.total) : 0,
    avgTime:   r.avgTimeMs ? Number(r.avgTimeMs) / 1000 : 0,
  })));
});

// ── Provider status ───────────────────────────────────────────────────────────

router.get("/providers", async (_req, res) => {
  const rows = await db.select({
    providerId: providerLogsTable.providerId,
    total:      count(),
    errors:     sql<number>`SUM(CASE WHEN NOT success THEN 1 ELSE 0 END)::int`,
    avgLatency: avg(providerLogsTable.latencyMs),
  })
    .from(providerLogsTable)
    .groupBy(providerLogsTable.providerId);

  const providerMeta: Record<string, { name: string; model: string }> = {
    "groq-1":       { name: "Groq (Key 1)",       model: "llama-3.3-70b-versatile" },
    "groq-2":       { name: "Groq (Key 2)",        model: "llama-3.3-70b-versatile" },
    "openrouter-1": { name: "OpenRouter (Key 1)", model: "meta-llama/llama-3.3-70b-instruct" },
    "openrouter-2": { name: "OpenRouter (Key 2)", model: "mistralai/mixtral-8x7b-instruct" },
  };

  const allIds = Object.keys(providerMeta);
  const rowMap = Object.fromEntries(rows.map(r => [r.providerId, r]));

  res.json(allIds.map(id => {
    const r   = rowMap[id];
    const meta = providerMeta[id];
    return {
      id, name: meta.name, status: "active", model: meta.model,
      requestCount: r ? Number(r.total)   : 0,
      errorRate:    r ? Number(r.errors) / Number(r.total) : 0,
      avgLatencyMs: r?.avgLatency ? Number(r.avgLatency) : null,
      rateLimitRpm: 30,
    };
  }));
});

router.get("/providers/usage", async (_req, res) => {
  const [{ total, successful }] = await db.select({
    total:      count(),
    successful: sql<number>`SUM(CASE WHEN success THEN 1 ELSE 0 END)::int`,
  }).from(providerLogsTable);

  const byProvider = await db.select({
    providerId: providerLogsTable.providerId,
    cnt:        count(),
  }).from(providerLogsTable).groupBy(providerLogsTable.providerId);

  res.json({
    totalRequests:      Number(total),
    successfulRequests: Number(successful),
    failedRequests:     Number(total) - Number(successful),
    providers: byProvider.map(r => ({ id: r.providerId, requestCount: Number(r.cnt) })),
  });
});

// ── Dashboard (student-scoped) ────────────────────────────────────────────────

router.get("/dashboard", async (req, res) => {
  const studentId = Number((req.query as any).studentId ?? 1);

  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));

  if (!s) {
    const defaultTopics = ["arithmetic", "algebra", "percentages", "ratios", "statistics", "probability", "geometry"];
    return res.json({
      student: { id: studentId, username: "champion", displayName: "Champion", ageGroup: "11-13", elo: 1000, belt: "bronze", streak: 0, totalMatches: 0, totalWins: 0, favoriteTopics: [], createdAt: new Date().toISOString() },
      stats: { studentId, totalQuestions: 0, correctAnswers: 0, accuracy: 0, avgResponseTime: 0, currentStreak: 0, longestStreak: 0, elo: 1000, belt: "bronze", weeklyGrowth: 0 },
      mastery: defaultTopics.map(t => ({ topic: t, mastery: 0, accuracy: 0, avgResponseTime: 0, questionsAttempted: 0, trend: "stable" })),
      recentMatches: [],
      upcomingEvents: [
        { id: 1, name: "Weekly Tournament", startAt: new Date(Date.now() + 86400000 * 3).toISOString(), type: "tournament", participants: 64 },
        { id: 2, name: "Daily Speed Round",  startAt: new Date(Date.now() + 3600000).toISOString(),      type: "daily",      participants: 256 },
      ],
      recommendations: { practiceTopics: ["arithmetic", "algebra"], nextDifficulty: "easy", dailyChallenge: null, weakAreas: [] },
    });
  }

  // Single aggregated query for all performance stats
  const [perfStats] = await db.select({
    totalQ:    count(),
    correct:   sql<number>`SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int`,
    avgTimeMs: avg(studentPerformanceTable.responseTimeMs),
  }).from(studentPerformanceTable).where(eq(studentPerformanceTable.studentId, studentId));

  // Topic mastery in one query
  const topicRows = await db.select({
    topic:     studentPerformanceTable.topic,
    total:     count(),
    correct:   sql<number>`SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int`,
    avgTimeMs: avg(studentPerformanceTable.responseTimeMs),
  })
    .from(studentPerformanceTable)
    .where(eq(studentPerformanceTable.studentId, studentId))
    .groupBy(studentPerformanceTable.topic);

  const topicMap = Object.fromEntries(topicRows.map(r => [r.topic, r]));
  const defaultTopics = ["arithmetic", "algebra", "percentages", "ratios", "statistics", "probability", "geometry"];

  const mastery = defaultTopics.map(topic => {
    const m   = topicMap[topic];
    const tot = m ? Number(m.total)   : 0;
    const cor = m ? Number(m.correct) : 0;
    const acc = tot > 0 ? cor / tot : 0;
    return {
      topic, mastery: Math.min(100, acc * 100),
      accuracy: acc,
      avgResponseTime: m?.avgTimeMs ? Number(m.avgTimeMs) / 1000 : 0,
      questionsAttempted: tot,
      trend: "stable",
    };
  });

  const totalQ   = Number(perfStats.totalQ);
  const correct  = Number(perfStats.correct);
  const accuracy = totalQ > 0 ? correct / totalQ : 0;

  const recentMatches = await db.select().from(matchesTable)
    .where(eq(matchesTable.studentId, studentId))
    .orderBy(sql`created_at DESC`)
    .limit(5);

  const weakAreas = topicRows
    .filter(r => Number(r.total) >= 3 && Number(r.correct) / Number(r.total) < 0.6)
    .map(r => r.topic);

  res.json({
    student: { ...s, createdAt: s.createdAt.toISOString() },
    stats: {
      studentId, totalQuestions: totalQ, correctAnswers: correct, accuracy,
      avgResponseTime: perfStats.avgTimeMs ? Number(perfStats.avgTimeMs) / 1000 : 0,
      currentStreak: s.streak, longestStreak: s.streak,
      elo: s.elo, belt: s.belt, weeklyGrowth: 0,
      totalMatches: s.totalMatches, totalWins: s.totalWins,
    },
    mastery,
    recentMatches: recentMatches.map(m => ({
      ...m, accuracy: Number(m.accuracy), comboMultiplier: Number(m.comboMultiplier),
      createdAt: m.createdAt.toISOString(), completedAt: m.completedAt?.toISOString() ?? null,
    })),
    upcomingEvents: [
      { id: 1, name: "Weekly Tournament",  startAt: new Date(Date.now() + 86400000 * 3).toISOString(), type: "tournament", participants: 64 },
      { id: 2, name: "Daily Speed Round",  startAt: new Date(Date.now() + 3600000).toISOString(),      type: "daily",      participants: 256 },
    ],
    recommendations: {
      practiceTopics: weakAreas.length > 0 ? weakAreas.slice(0, 3) : ["arithmetic", "algebra"],
      nextDifficulty: s.elo < 1200 ? "easy" : s.elo < 1500 ? "medium" : "hard",
      dailyChallenge: null,
      weakAreas,
    },
  });
});

export default router;
