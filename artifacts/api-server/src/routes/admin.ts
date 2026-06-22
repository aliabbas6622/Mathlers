import { Router } from "express";
import { db, studentsTable, matchesTable, studentPerformanceTable, questionsTable, competitionsTable, competitionEntriesTable } from "@workspace/db";
import { eq, desc, ilike, sql, and, inArray } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function generateEnrollmentCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function eloToBelt(elo: number): string {
  if (elo >= 2200) return "legend";
  if (elo >= 1900) return "champion";
  if (elo >= 1600) return "diamond";
  if (elo >= 1300) return "platinum";
  if (elo >= 1100) return "gold";
  if (elo >= 1050) return "silver";
  return "bronze";
}

function serialize(s: any) {
  return { ...s, createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt, lastActiveAt: s.lastActiveAt instanceof Date ? s.lastActiveAt.toISOString() : s.lastActiveAt };
}

// ── Student list with full admin data ────────────────────────────────────────

router.get("/admin/students", async (req, res) => {
  const { search, status, city, school, belt, ageGroup, limit = "50", offset = "0" } = req.query as Record<string, string>;

  let rows = await db.select().from(studentsTable)
    .orderBy(desc(studentsTable.elo))
    .limit(Number(limit))
    .offset(Number(offset));

  if (search)   rows = rows.filter(s => s.displayName.toLowerCase().includes(search.toLowerCase()) || s.username.toLowerCase().includes(search.toLowerCase()) || s.enrollmentCode?.includes(search.toUpperCase()));
  if (status)   rows = rows.filter(s => s.status === status);
  if (city)     rows = rows.filter(s => s.city?.toLowerCase().includes(city.toLowerCase()));
  if (school)   rows = rows.filter(s => s.school?.toLowerCase().includes(school.toLowerCase()));
  if (belt)     rows = rows.filter(s => s.belt === belt);
  if (ageGroup) rows = rows.filter(s => s.ageGroup === ageGroup);

  res.json(rows.map(serialize));
});

// ── Full student detail (admin view) ─────────────────────────────────────────

router.get("/admin/students/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, id));
  if (!s) return res.status(404).json({ error: "Student not found" });

  const perf    = await db.select().from(studentPerformanceTable).where(eq(studentPerformanceTable.studentId, id));
  const matches = await db.select().from(matchesTable).where(eq(matchesTable.studentId, id)).orderBy(desc(matchesTable.createdAt)).limit(20);

  const correct  = perf.filter(p => p.correct).length;
  const accuracy = perf.length > 0 ? correct / perf.length : 0;

  const topicBreakdown = ["arithmetic", "algebra", "percentages", "ratios", "statistics", "probability", "geometry"].map(topic => {
    const tp = perf.filter(p => p.topic === topic);
    return { topic, attempts: tp.length, correct: tp.filter(p => p.correct).length, accuracy: tp.length > 0 ? tp.filter(p => p.correct).length / tp.length : 0 };
  });

  res.json({
    ...serialize(s),
    stats: { totalQuestions: perf.length, correctAnswers: correct, accuracy, totalMatches: matches.length },
    topicBreakdown,
    recentMatches: matches.map(m => ({
      id: m.id, mode: m.mode, difficulty: m.difficulty, score: m.score,
      accuracy: Number(m.accuracy), status: m.status,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    })),
  });
});

// ── Update student (admin) ────────────────────────────────────────────────────

router.patch("/admin/students/:id", async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["displayName", "username", "email", "parentEmail", "ageGroup", "grade", "school", "city", "country", "favoriteTopics", "adminNotes", "status"];
  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key === "displayName" ? "displayName" : key] = req.body[key];
  }

  // Remap camelCase to drizzle columns
  const mapped: any = {};
  if (update.displayName   !== undefined) mapped.displayName  = update.displayName;
  if (update.username      !== undefined) mapped.username     = update.username;
  if (update.email         !== undefined) mapped.email        = update.email;
  if (update.parentEmail   !== undefined) mapped.parentEmail  = update.parentEmail;
  if (update.ageGroup      !== undefined) mapped.ageGroup     = update.ageGroup;
  if (update.grade         !== undefined) mapped.grade        = update.grade;
  if (update.school        !== undefined) mapped.school       = update.school;
  if (update.city          !== undefined) mapped.city         = update.city;
  if (update.country       !== undefined) mapped.country      = update.country;
  if (update.favoriteTopics !== undefined) mapped.favoriteTopics = update.favoriteTopics;
  if (update.adminNotes    !== undefined) mapped.adminNotes   = update.adminNotes;
  if (update.status        !== undefined) mapped.status       = update.status;

  if (Object.keys(mapped).length === 0) return res.status(400).json({ error: "No valid fields to update" });
  const [updated] = await db.update(studentsTable).set(mapped).where(eq(studentsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Student not found" });
  res.json(serialize(updated));
});

// ── Override ELO + belt ───────────────────────────────────────────────────────

router.post("/admin/students/:id/elo", async (req, res) => {
  const id  = Number(req.params.id);
  const elo = Number(req.body.elo);
  if (isNaN(elo) || elo < 0 || elo > 9999) return res.status(400).json({ error: "ELO must be 0–9999" });
  const belt = req.body.belt ?? eloToBelt(elo);
  const [updated] = await db.update(studentsTable).set({ elo, belt }).where(eq(studentsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(serialize(updated));
});

// ── Status: restrict / ban / activate ────────────────────────────────────────

router.post("/admin/students/:id/status", async (req, res) => {
  const id     = Number(req.params.id);
  const status = req.body.status as string;
  if (!["active", "restricted", "banned", "pending"].includes(status)) {
    return res.status(400).json({ error: "status must be active | restricted | banned | pending" });
  }
  const [updated] = await db.update(studentsTable).set({ status }).where(eq(studentsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(serialize(updated));
});

// ── Enrollment code: generate / regenerate ───────────────────────────────────

router.post("/admin/students/:id/enrollment-code", async (req, res) => {
  const id = Number(req.params.id);
  let code = generateEnrollmentCode();
  // Retry until unique
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.select().from(studentsTable).where(eq(studentsTable.enrollmentCode, code));
    if (existing.length === 0) break;
    code = generateEnrollmentCode();
  }
  const [updated] = await db.update(studentsTable).set({ enrollmentCode: code }).where(eq(studentsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ id, enrollmentCode: code });
});

// ── Bulk restrict / ban by IDs ────────────────────────────────────────────────

router.post("/admin/students/bulk-status", async (req, res) => {
  const { ids, status } = req.body as { ids: number[]; status: string };
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids must be a non-empty array" });
  if (!["active", "restricted", "banned"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  await db.update(studentsTable).set({ status }).where(inArray(studentsTable.id, ids));
  res.json({ updated: ids.length });
});

// ── Reset student stats (wipe match history) ─────────────────────────────────

router.post("/admin/students/:id/reset-stats", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(studentPerformanceTable).where(eq(studentPerformanceTable.studentId, id));
  await db.update(studentsTable).set({ elo: 1000, belt: "bronze", streak: 0, totalMatches: 0, totalWins: 0 }).where(eq(studentsTable.id, id));
  res.json({ message: "Stats reset to baseline" });
});

// ── Delete student ────────────────────────────────────────────────────────────

router.delete("/admin/students/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(studentPerformanceTable).where(eq(studentPerformanceTable.studentId, id));
  await db.delete(competitionEntriesTable).where(eq(competitionEntriesTable.studentId, id)).catch(() => {});
  await db.delete(studentsTable).where(eq(studentsTable.id, id));
  res.json({ message: "Student deleted" });
});

// ── Platform overview for admin ───────────────────────────────────────────────

router.get("/admin/overview", async (req, res) => {
  const students  = await db.select().from(studentsTable);
  const matches   = await db.select().from(matchesTable);
  const questions = await db.select().from(questionsTable);

  const active     = students.filter(s => s.status === "active").length;
  const restricted = students.filter(s => s.status === "restricted").length;
  const banned     = students.filter(s => s.status === "banned").length;
  const completed  = matches.filter(m => m.status === "completed");
  const avgAcc     = completed.length > 0 ? completed.reduce((a, m) => a + Number(m.accuracy), 0) / completed.length : 0;

  const cityBreakdown: Record<string, number> = {};
  for (const s of students) {
    const c = s.city ?? "Unknown";
    cityBreakdown[c] = (cityBreakdown[c] ?? 0) + 1;
  }

  const beltBreakdown: Record<string, number> = {};
  for (const s of students) {
    beltBreakdown[s.belt] = (beltBreakdown[s.belt] ?? 0) + 1;
  }

  res.json({
    totalStudents: students.length,
    active, restricted, banned,
    totalMatches: matches.length,
    completedMatches: completed.length,
    totalQuestions: questions.length,
    avgAccuracy: avgAcc,
    cityBreakdown: Object.entries(cityBreakdown).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count),
    beltBreakdown: Object.entries(beltBreakdown).map(([belt, count]) => ({ belt, count })),
  });
});

export default router;
