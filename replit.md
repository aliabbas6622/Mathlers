# Mathlers

AI-powered boxing-themed math competition platform where students solve questions built from real-world records (esports, sports, science) to climb the ranks and earn championship belts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mathlers run dev` — run the Vite frontend (port 18406)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the database with record cards, student, templates
- Required env: `DATABASE_URL` — Postgres connection string
- LLM keys: `GROQ_API_KEY_1`, `GROQ_API_KEY_2`, `OPENROUTER_API_KEY_1`, `OPENROUTER_API_KEY_2`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter (routing), @tanstack/react-query, recharts, lucide-react, Tailwind CSS v4
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle for server)

## Where things live

- `lib/db/src/schema/` — all Drizzle table definitions (recordCards, students, templates, questions, matches, studentPerformance, providerLogs)
- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas (do not edit manually)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/mathlers/src/pages/` — all frontend pages (home, dashboard, arena, match, result, leaderboard, training, records, admin, admin-records, profile)
- `artifacts/mathlers/src/components/` — shared components (NavBar, BeltBadge, RecordCardDisplay)
- `scripts/src/seed.ts` — database seeding script

## Architecture decisions

- **Deterministic math, AI narrative**: Math answers are computed deterministically (no LLM for answers). LLM (Groq/OpenRouter) is used only for 2-3 sentence boxing-ring scenario text. Guarantees correctness.
- **Multi-provider key rotation**: 4 LLM keys (Groq ×2, OpenRouter ×2) rotated via round-robin. Falls back to pre-built narrative if all fail.
- **Contract-first API**: OpenAPI spec → codegen → Zod schemas + React Query hooks. Never write fetch calls manually.
- **Hash deduplication**: Each generated question gets a SHA-256 hash of `recordCardId + topic + questionText`. Prevents duplicate questions.
- **Single student (STUDENT_ID=1)**: Hardcoded for now. Auth/multi-user is a future extension.
- **5-round boxing format**: Warmup → Jab → Hook → Uppercut → Knockout. Each round escalates difficulty/stakes.
- **Belt system**: bronze → silver → gold → platinum → diamond → champion → legend, driven by ELO.

## Product

- **Home**: Hero, belt rank showcase, feature cards, sample record cards, CTA
- **Dashboard**: ELO, streak, accuracy, win rate stats + topic mastery radar chart + daily challenge + recent matches
- **Arena**: Choose match mode (Practice only active; Sparring/Ranked/Tournament coming soon), difficulty, topics
- **Match**: 5-round live boxing match with timer, combo multiplier, real-time scoring, AI-generated narrative
- **Result**: Post-match summary with round breakdown, score, accuracy
- **Leaderboard**: ELO rankings with podium display, period/scope filters
- **Training**: Topic mastery bars + accuracy chart + recommendations
- **Records**: Filterable/searchable record card library (15 seed records)
- **Admin**: Platform analytics, 30-day trend charts, LLM provider status
- **Admin Records**: Add/scrape record cards

## User preferences

- White + light color scheme, forced light-only (no dark mode)
- Primary: hsl(348 80% 54%) — arena crimson
- Secondary: hsl(38 92% 62%) — championship gold
- Future-proof for mobile (responsive layouts throughout)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after editing schema files
- Never use `console.log` in server code — use `req.log` in routes, `logger` elsewhere
- Math answers are computed server-side, never by LLM — do not add LLM math calls
- The match flow creates matches first, then assigns questions. A match with `currentQuestionId: null` means no questions existed at match creation time (run the seed first)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/index.ts`
