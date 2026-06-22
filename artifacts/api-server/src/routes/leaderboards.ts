import { Router } from "express";
import { db, studentsTable, matchesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/leaderboards", async (req, res) => {
  const { limit = "50", offset = "0" } = req.query as Record<string, string>;
  const students = await db.select().from(studentsTable)
    .orderBy(desc(studentsTable.elo))
    .limit(Number(limit))
    .offset(Number(offset));

  const entries = students.map((s, i) => ({
    rank:          Number(offset) + i + 1,
    studentId:     s.id,
    username:      s.username,
    displayName:   s.displayName,
    school:        s.school ?? null,
    belt:          s.belt,
    elo:           s.elo,
    winRate:       s.totalMatches > 0 ? s.totalWins / s.totalMatches : 0,
    totalMatches:  s.totalMatches,
    streak:        s.streak,
  }));

  res.json(entries);
});

export default router;
