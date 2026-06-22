import { Router } from "express";
import { db, competitionsTable, competitionEntriesTable, studentsTable, schoolsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// ── Schools ──────────────────────────────────────────────────────────────────

router.get("/schools", async (req, res) => {
  const { city, country } = req.query as Record<string, string>;
  let rows = await db.select().from(schoolsTable);
  if (city)    rows = rows.filter(s => s.city.toLowerCase().includes(city.toLowerCase()));
  if (country) rows = rows.filter(s => s.country.toLowerCase() === country.toLowerCase());
  res.json(rows);
});

router.post("/schools", async (req, res) => {
  const { name, city, state, country, district, code } = req.body;
  if (!name || !city) return res.status(400).json({ error: "name and city are required" });
  const [school] = await db.insert(schoolsTable).values({ name, city, state, country: country ?? "Unknown", district, code }).returning();
  res.status(201).json(school);
});

// ── Competitions ─────────────────────────────────────────────────────────────

router.get("/competitions", async (req, res) => {
  const { city, status, scope } = req.query as Record<string, string>;
  let rows = await db.select().from(competitionsTable).orderBy(sql`start_at desc`);
  if (city)   rows = rows.filter(c => c.city?.toLowerCase().includes(city.toLowerCase()));
  if (status) rows = rows.filter(c => c.status === status);
  if (scope)  rows = rows.filter(c => c.scope === scope);
  res.json(rows.map(serializeComp));
});

router.post("/competitions", async (req, res) => {
  const { name, type = "city", scope = "city", city, state, country, schoolId, maxParticipants = 64, startAt, endAt, prizeDescription, difficulty = "medium", ageGroup, topics = [] } = req.body;
  if (!name || !startAt) return res.status(400).json({ error: "name and startAt are required" });

  const [comp] = await db.insert(competitionsTable).values({
    name, type, scope, city, state, country, schoolId,
    maxParticipants, status: "upcoming",
    startAt: new Date(startAt), endAt: endAt ? new Date(endAt) : undefined,
    prizeDescription, difficulty, ageGroup, topics,
  }).returning();
  res.status(201).json(serializeComp(comp));
});

router.get("/competitions/:id", async (req, res) => {
  const [comp] = await db.select().from(competitionsTable).where(eq(competitionsTable.id, Number(req.params.id)));
  if (!comp) return res.status(404).json({ error: "Not found" });

  const entries = await db.select().from(competitionEntriesTable).where(eq(competitionEntriesTable.competitionId, comp.id));
  const studentIds = entries.map(e => e.studentId);
  const students: any[] = studentIds.length > 0
    ? await db.select().from(studentsTable)
    : [];
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  res.json({
    ...serializeComp(comp),
    leaderboard: entries
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({
        rank: i + 1,
        student: studentMap[e.studentId] ? { id: e.studentId, username: studentMap[e.studentId].username, displayName: studentMap[e.studentId].displayName, elo: studentMap[e.studentId].elo } : null,
        score: e.score,
        matchesPlayed: e.matchesPlayed,
        eliminated: e.eliminated,
      })),
  });
});

router.post("/competitions/:id/join", async (req, res) => {
  const compId    = Number(req.params.id);
  const studentId = req.body.studentId ?? 1;

  const [comp] = await db.select().from(competitionsTable).where(eq(competitionsTable.id, compId));
  if (!comp) return res.status(404).json({ error: "Competition not found" });
  if (comp.currentParticipants >= comp.maxParticipants) return res.status(409).json({ error: "Competition is full" });

  const existing = await db.select().from(competitionEntriesTable).where(
    and(eq(competitionEntriesTable.competitionId, compId), eq(competitionEntriesTable.studentId, studentId))
  );
  if (existing.length > 0) return res.status(409).json({ error: "Already enrolled" });

  const [entry] = await db.insert(competitionEntriesTable).values({ competitionId: compId, studentId }).returning();
  await db.update(competitionsTable).set({ currentParticipants: sql`current_participants + 1` }).where(eq(competitionsTable.id, compId));
  res.status(201).json(entry);
});

router.patch("/competitions/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["upcoming", "active", "completed", "cancelled"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  const [comp] = await db.update(competitionsTable).set({ status }).where(eq(competitionsTable.id, Number(req.params.id))).returning();
  res.json(serializeComp(comp));
});

// ── City leaderboard ─────────────────────────────────────────────────────────

router.get("/leaderboards/city", async (req, res) => {
  const { city, limit = "20" } = req.query as Record<string, string>;
  let students = await db.select().from(studentsTable).orderBy(sql`elo desc`).limit(Number(limit));
  if (city) students = students.filter(s => s.city?.toLowerCase().includes(city.toLowerCase()));

  res.json(students.map((s, i) => ({
    rank: i + 1,
    student: {
      id: s.id, username: s.username, displayName: s.displayName,
      elo: s.elo, belt: s.belt, city: s.city, school: s.school,
      totalMatches: s.totalMatches, totalWins: s.totalWins,
    },
    score: s.elo,
  })));
});

function serializeComp(c: any) {
  return {
    ...c,
    startAt: c.startAt instanceof Date ? c.startAt.toISOString() : c.startAt,
    endAt: c.endAt instanceof Date ? c.endAt.toISOString() : c.endAt,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

export default router;
