---
name: Mathlers Architecture
description: Key design decisions for the Mathlers boxing-themed math competition platform
---

# Mathlers Architecture

## Deterministic Math + AI Narrative Split
Math answers are computed server-side with pure arithmetic (never LLM). LLM (Groq/OpenRouter) generates only the 2-3 sentence boxing-ring scenario text. This guarantees correctness and allows validation at any time.

**Why:** LLMs hallucinate math. Keeping math deterministic makes the platform trustworthy for students.

**How to apply:** Any new question type must compute its answer in `computeAnswer()` in `routes/questions.ts`. Never send math computation to an LLM.

## Multi-Provider LLM Key Rotation
4 keys in round-robin: GROQ_API_KEY_1, GROQ_API_KEY_2, OPENROUTER_API_KEY_1, OPENROUTER_API_KEY_2. Falls back to pre-built narrative if all fail. Provider usage logged to `provider_logs` table.

**Why:** Rate limit avoidance and resilience. Any single Groq key has low RPM limits.

## Contract-First API (OpenAPI → Codegen)
Edit `lib/api-spec/openapi.yaml` → run codegen → Zod schemas in `lib/api-zod` + React Query hooks in `lib/api-client-react`. Never write fetch calls manually on the frontend.

**Why:** Single source of truth, type-safe end-to-end, instant client updates when API changes.

## Hash-Based Question Deduplication
Each generated question gets SHA-256 of `${recordCardId}-${topic}-${questionText}`. Duplicate hashes are returned from cache (DB), not regenerated.

**Why:** Prevents LLM costs on repeated question requests and keeps the question pool stable.

## STUDENT_ID=1 Hardcoded
Single student "Champion" for now. All routes that need a student ID use 1.

**Why:** Auth/multi-user deferred. When adding multi-user, search for hardcoded `1` and `STUDENT_ID = 1` across frontend pages.

## Match Flow
POST /api/matches → creates match with first question → GET /api/matches/:id to load → POST /api/matches/:id/answer per round → POST /api/matches/:id/complete or auto-complete after round 5. Matches with `currentQuestionId: null` mean no questions existed at creation time — seed first.
