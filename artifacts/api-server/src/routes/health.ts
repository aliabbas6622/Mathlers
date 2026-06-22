import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  const start = Date.now();
  let dbStatus: "ok" | "degraded" = "ok";
  let dbLatencyMs: number | null = null;

  try {
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - start;
  } catch {
    dbStatus = "degraded";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  res.status(status === "ok" ? 200 : 503).json({
    status,
    version: "v1",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
    },
  });
});

export default router;
