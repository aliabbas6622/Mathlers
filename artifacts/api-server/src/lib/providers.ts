import { db, providerLogsTable } from "@workspace/db";

export interface Provider {
  id: string;
  name: string;
  model: string;
  baseUrl: string;
  apiKey: string | undefined;
  available: boolean;
  rateLimitRpm: number;
  priority: number;
}

function buildProviders(): Provider[] {
  const raw: Omit<Provider, "available">[] = [
    // ── Groq (fast, free tier) ──────────────────────────────────────
    { id: "groq-1", name: "Groq",    model: "llama-3.3-70b-versatile",              baseUrl: "https://api.groq.com/openai/v1",          apiKey: process.env.GROQ_API_KEY_1,          rateLimitRpm: 30, priority: 1 },
    { id: "groq-2", name: "Groq",    model: "llama-3.3-70b-versatile",              baseUrl: "https://api.groq.com/openai/v1",          apiKey: process.env.GROQ_API_KEY_2,          rateLimitRpm: 30, priority: 1 },
    { id: "groq-3", name: "Groq",    model: "llama-3.3-70b-versatile",              baseUrl: "https://api.groq.com/openai/v1",          apiKey: process.env.GROQ_API_KEY_3,          rateLimitRpm: 30, priority: 1 },
    { id: "groq-4", name: "Groq",    model: "llama-3.3-70b-versatile",              baseUrl: "https://api.groq.com/openai/v1",          apiKey: process.env.GROQ_API_KEY_4,          rateLimitRpm: 30, priority: 1 },
    // ── OpenRouter ─────────────────────────────────────────────────
    { id: "openrouter-1", name: "OpenRouter", model: "meta-llama/llama-3.3-70b-instruct",    baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY_1, rateLimitRpm: 60, priority: 2 },
    { id: "openrouter-2", name: "OpenRouter", model: "meta-llama/llama-3.3-70b-instruct",    baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY_2, rateLimitRpm: 60, priority: 2 },
    { id: "openrouter-3", name: "OpenRouter", model: "mistralai/mixtral-8x7b-instruct",      baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY_3, rateLimitRpm: 60, priority: 2 },
    { id: "openrouter-4", name: "OpenRouter", model: "mistralai/mixtral-8x7b-instruct",      baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY_4, rateLimitRpm: 60, priority: 2 },
    // ── TinyFish (OpenAI-compatible endpoint) ────────────────────
    { id: "tinyfish-1", name: "TinyFish", model: process.env.TINYFISH_MODEL ?? "tinyfish-default", baseUrl: process.env.TINYFISH_BASE_URL ?? "https://api.tinyfish.io/v1", apiKey: process.env.TINYFISH_API_KEY_1, rateLimitRpm: 60, priority: 1 },
    { id: "tinyfish-2", name: "TinyFish", model: process.env.TINYFISH_MODEL ?? "tinyfish-default", baseUrl: process.env.TINYFISH_BASE_URL ?? "https://api.tinyfish.io/v1", apiKey: process.env.TINYFISH_API_KEY_2, rateLimitRpm: 60, priority: 1 },
    { id: "tinyfish-3", name: "TinyFish", model: process.env.TINYFISH_MODEL ?? "tinyfish-default", baseUrl: process.env.TINYFISH_BASE_URL ?? "https://api.tinyfish.io/v1", apiKey: process.env.TINYFISH_API_KEY_3, rateLimitRpm: 60, priority: 1 },
    // ── Together.ai ───────────────────────────────────────────────
    { id: "together-1", name: "Together.ai", model: process.env.TOGETHER_MODEL ?? "meta-llama/Llama-3-70b-chat-hf", baseUrl: "https://api.together.xyz/v1", apiKey: process.env.TOGETHER_API_KEY_1, rateLimitRpm: 60, priority: 2 },
    { id: "together-2", name: "Together.ai", model: process.env.TOGETHER_MODEL ?? "meta-llama/Llama-3-70b-chat-hf", baseUrl: "https://api.together.xyz/v1", apiKey: process.env.TOGETHER_API_KEY_2, rateLimitRpm: 60, priority: 2 },
    // ── Custom / Generic OpenAI-compatible ────────────────────────
    { id: "custom-1", name: process.env.CUSTOM_PROVIDER_1_NAME ?? "Custom-1", model: process.env.CUSTOM_PROVIDER_1_MODEL ?? "gpt-4o-mini", baseUrl: process.env.CUSTOM_PROVIDER_1_URL ?? "https://api.openai.com/v1", apiKey: process.env.CUSTOM_PROVIDER_1_KEY, rateLimitRpm: 60, priority: 3 },
    { id: "custom-2", name: process.env.CUSTOM_PROVIDER_2_NAME ?? "Custom-2", model: process.env.CUSTOM_PROVIDER_2_MODEL ?? "gpt-4o-mini", baseUrl: process.env.CUSTOM_PROVIDER_2_URL ?? "https://api.openai.com/v1", apiKey: process.env.CUSTOM_PROVIDER_2_KEY, rateLimitRpm: 60, priority: 3 },
  ];

  return raw.map(p => ({ ...p, available: !!p.apiKey })).filter(p => p.available);
}

const PROVIDERS = buildProviders();

// Simple in-memory rate-limit tracker per provider
const lastUsed: Record<string, number> = {};

let roundRobinIndex = 0;

export function getNextProvider(): Provider | null {
  if (PROVIDERS.length === 0) return null;

  // Sort by priority (lowest = first), then round-robin within same priority
  const sorted = [...PROVIDERS].sort((a, b) => a.priority - b.priority);

  // Try providers in priority order, skip recently rate-limited ones
  const now = Date.now();
  for (const p of sorted) {
    const last = lastUsed[p.id] ?? 0;
    const msSinceLast = now - last;
    const minGapMs = (60 / p.rateLimitRpm) * 1000;
    if (msSinceLast >= minGapMs) {
      lastUsed[p.id] = now;
      return p;
    }
  }

  // All rate-limited: fall back to round-robin anyway
  const p = sorted[roundRobinIndex % sorted.length];
  roundRobinIndex++;
  lastUsed[p.id] = now;
  return p;
}

export function getAllProviders(): (Provider & { requestCount: number; errorCount: number; avgLatencyMs: number | null })[] {
  const all: Omit<Provider, "available">[] = [
    { id: "groq-1", name: "Groq",   model: "llama-3.3-70b-versatile", baseUrl: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY_1, rateLimitRpm: 30, priority: 1 },
    { id: "groq-2", name: "Groq",   model: "llama-3.3-70b-versatile", baseUrl: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY_2, rateLimitRpm: 30, priority: 1 },
    { id: "groq-3", name: "Groq",   model: "llama-3.3-70b-versatile", baseUrl: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY_3, rateLimitRpm: 30, priority: 1 },
    { id: "groq-4", name: "Groq",   model: "llama-3.3-70b-versatile", baseUrl: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY_4, rateLimitRpm: 30, priority: 1 },
    { id: "openrouter-1", name: "OpenRouter", model: "meta-llama/llama-3.3-70b-instruct", baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY_1, rateLimitRpm: 60, priority: 2 },
    { id: "openrouter-2", name: "OpenRouter", model: "meta-llama/llama-3.3-70b-instruct", baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY_2, rateLimitRpm: 60, priority: 2 },
    { id: "openrouter-3", name: "OpenRouter", model: "mistralai/mixtral-8x7b-instruct",   baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY_3, rateLimitRpm: 60, priority: 2 },
    { id: "openrouter-4", name: "OpenRouter", model: "mistralai/mixtral-8x7b-instruct",   baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY_4, rateLimitRpm: 60, priority: 2 },
    { id: "tinyfish-1", name: "TinyFish", model: process.env.TINYFISH_MODEL ?? "tinyfish-default", baseUrl: process.env.TINYFISH_BASE_URL ?? "https://api.tinyfish.io/v1", apiKey: process.env.TINYFISH_API_KEY_1, rateLimitRpm: 60, priority: 1 },
    { id: "tinyfish-2", name: "TinyFish", model: process.env.TINYFISH_MODEL ?? "tinyfish-default", baseUrl: process.env.TINYFISH_BASE_URL ?? "https://api.tinyfish.io/v1", apiKey: process.env.TINYFISH_API_KEY_2, rateLimitRpm: 60, priority: 1 },
    { id: "tinyfish-3", name: "TinyFish", model: process.env.TINYFISH_MODEL ?? "tinyfish-default", baseUrl: process.env.TINYFISH_BASE_URL ?? "https://api.tinyfish.io/v1", apiKey: process.env.TINYFISH_API_KEY_3, rateLimitRpm: 60, priority: 1 },
    { id: "together-1", name: "Together.ai", model: process.env.TOGETHER_MODEL ?? "meta-llama/Llama-3-70b-chat-hf", baseUrl: "https://api.together.xyz/v1", apiKey: process.env.TOGETHER_API_KEY_1, rateLimitRpm: 60, priority: 2 },
    { id: "together-2", name: "Together.ai", model: process.env.TOGETHER_MODEL ?? "meta-llama/Llama-3-70b-chat-hf", baseUrl: "https://api.together.xyz/v1", apiKey: process.env.TOGETHER_API_KEY_2, rateLimitRpm: 60, priority: 2 },
    { id: "custom-1", name: process.env.CUSTOM_PROVIDER_1_NAME ?? "Custom-1", model: process.env.CUSTOM_PROVIDER_1_MODEL ?? "gpt-4o-mini", baseUrl: process.env.CUSTOM_PROVIDER_1_URL ?? "https://api.openai.com/v1", apiKey: process.env.CUSTOM_PROVIDER_1_KEY, rateLimitRpm: 60, priority: 3 },
    { id: "custom-2", name: process.env.CUSTOM_PROVIDER_2_NAME ?? "Custom-2", model: process.env.CUSTOM_PROVIDER_2_MODEL ?? "gpt-4o-mini", baseUrl: process.env.CUSTOM_PROVIDER_2_URL ?? "https://api.openai.com/v1", apiKey: process.env.CUSTOM_PROVIDER_2_KEY, rateLimitRpm: 60, priority: 3 },
  ];
  return all.map(p => ({
    ...p,
    available: !!p.apiKey,
    requestCount: 0,
    errorCount: 0,
    avgLatencyMs: null,
  }));
}

export async function callLLMWithFallback(prompt: string, log: any): Promise<{ text: string; providerId: string } | null> {
  const maxAttempts = Math.min(PROVIDERS.length, 3);
  const tried = new Set<string>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const provider = getNextProvider();
    if (!provider || tried.has(provider.id)) continue;
    tried.add(provider.id);

    const start = Date.now();
    try {
      const resp = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${provider.apiKey}`,
          ...(provider.name === "OpenRouter" ? { "HTTP-Referer": "https://mathlers.replit.app", "X-Title": "Mathlers" } : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 180,
          temperature: 0.75,
        }),
        signal: AbortSignal.timeout(9000),
      });

      const latency = Date.now() - start;

      if (resp.ok) {
        const data = await resp.json() as any;
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          await db.insert(providerLogsTable).values({ providerId: provider.id, model: provider.model, operation: "narrative", success: true, latencyMs: latency }).catch(() => {});
          return { text, providerId: provider.id };
        }
      } else {
        const errText = await resp.text().catch(() => "");
        log.warn({ providerId: provider.id, status: resp.status, err: errText }, "Provider returned non-OK");
        await db.insert(providerLogsTable).values({ providerId: provider.id, model: provider.model, operation: "narrative", success: false, latencyMs: latency, errorMessage: `HTTP ${resp.status}` }).catch(() => {});
      }
    } catch (err: any) {
      await db.insert(providerLogsTable).values({ providerId: provider.id, model: provider.model, operation: "narrative", success: false, latencyMs: Date.now() - start, errorMessage: String(err?.message ?? err) }).catch(() => {});
      log.warn({ err, providerId: provider.id }, "Provider call failed");
    }
  }
  return null;
}

export { PROVIDERS };
