import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Request logging ────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Security headers ───────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// ── Rate limiting ──────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute window
  max: 300,                      // 300 req/min per IP (generous for classroom use)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/api/v1/healthz" || req.path === "/api/healthz",
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,                       // 60 question generations per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Question generation rate limit exceeded." },
});

const matchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,                      // 2 match actions per second per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many match actions. Slow down." },
});

app.use(globalLimiter);
app.use(["/api/v1/questions/generate", "/api/questions/generate"], generateLimiter);
app.use(["/api/v1/matches", "/api/matches"], matchLimiter);

// ── Routes — versioned at /api/v1, legacy /api preserved ─────────────────────
app.use("/api/v1", router);
app.use("/api",    router);          // backward-compat during rollout

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? err.statusCode ?? 500;
  const isZodError = err.name === "ZodError";

  if (status >= 500) {
    (req as any).log?.error({ err }, "Unhandled server error");
  }

  if (isZodError) {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.errors ?? err.issues,
    });
  }

  res.status(status).json({
    error: status < 500 ? (err.message ?? "Bad request") : "Internal server error",
    code: status < 500 ? "CLIENT_ERROR" : "SERVER_ERROR",
  });
});

export default app;
