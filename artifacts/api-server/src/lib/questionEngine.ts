/**
 * Mathlers Question Engine v2
 *
 * 6–7 variants per topic × 15 record cards = 630+ unique questions.
 * Each variant has a stable type-string included in its hash, so different
 * variants for the same card+topic can coexist in the DB.
 *
 * Steps are written with LaTeX markers:
 *   $...$  → inline math (rendered by the MathText component)
 *   $$...$$ → display math (rendered by the Math component)
 */

import crypto from "crypto";
import { db, questionsTable, recordCardsTable } from "@workspace/db";
import { eq, notInArray, inArray } from "drizzle-orm";
import { callLLMWithFallback } from "./providers";

// ── Utility helpers ───────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

function simplifyRatio(a: number, b: number): [number, number] {
  const g = gcd(Math.abs(a), Math.abs(b));
  return [a / g, b / g];
}

function niceDivisors(n: number): number[] {
  const candidates = [2, 3, 4, 5, 6, 8, 10, 12, 25, 50, 100];
  return candidates.filter(d => n % d === 0 && n / d > 0);
}

function pickDivisor(n: number): number {
  const opts = niceDivisors(n);
  return opts.length > 0 ? opts[Math.floor(Math.random() * opts.length)] : (n > 100 ? 10 : 2);
}

function fmt(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
}

function wrongOptions(correct: number, n = 3): number[] {
  const deltas = [
    Math.max(1, Math.round(correct * 0.10)),
    Math.max(1, Math.round(correct * 0.15)),
    Math.max(1, Math.round(correct * 0.20)),
    Math.max(1, Math.round(correct * 0.25)),
    Math.max(1, Math.round(correct * 0.30)),
  ];
  const pool = [
    correct + deltas[0], correct - deltas[0],
    correct + deltas[1], correct - deltas[1],
    correct + deltas[2], correct - deltas[2],
    correct + deltas[3], correct - deltas[3],
    correct + deltas[4], correct - deltas[4],
  ].filter(v => v > 0 && v !== correct);
  return [...new Set(pool)].slice(0, n);
}

function wrongPct(correct: number, n = 3): string[] {
  return wrongOptions(correct, n + 2)
    .slice(0, n)
    .map(v => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`);
}

// ── Question variant type ─────────────────────────────────────────────────────

export interface VariantResult {
  variantType:  string;
  questionText: string;
  answer:       string;
  options:      string[];
  steps:        string[];
}

type Card = {
  id: number; title: string; value: string | number; previousValue?: string | number | null;
  unit: string; holder?: string | null; category?: string | null; description?: string | null;
};

// ── ARITHMETIC variants ───────────────────────────────────────────────────────

function arithVariants(card: Card): VariantResult[] {
  const val  = Math.round(Number(card.value));
  const prev = card.previousValue ? Math.round(Number(card.previousValue)) : null;
  const u    = card.unit;
  const t    = card.title;
  const results: VariantResult[] = [];

  // Variant 1: split among teams
  const d1 = pickDivisor(val);
  if (d1 > 0 && val / d1 >= 1) {
    const each = Math.round(val / d1);
    results.push({
      variantType: "arith_divide",
      questionText: `The record "${t}" stands at ${fmt(val)} ${u}. If this is split equally among ${d1} competing teams, how much does each team get?`,
      answer: fmt(each),
      options: shuffle([fmt(each), ...wrongOptions(each).map(fmt)]),
      steps: [
        `Each share $= \\frac{\\text{total}}{\\text{teams}}$`,
        `$= \\frac{${fmt(val)}}{${d1}}$`,
        `$$= ${fmt(each)} \\text{ ${u}}$$`,
      ],
    });
  }

  // Variant 2: daily average over N days
  const days2 = [7, 30, 365].find(d => val % d === 0) ?? (val > 365 ? 30 : 7);
  if (val > days2) {
    const daily = Math.round(val / days2);
    results.push({
      variantType: "arith_dailyavg",
      questionText: `${t}: a total of ${fmt(val)} ${u} was accumulated over ${days2} days. What was the daily average?`,
      answer: fmt(daily),
      options: shuffle([fmt(daily), ...wrongOptions(daily).map(fmt)]),
      steps: [
        `Daily average $= \\frac{\\text{total}}{\\text{days}}$`,
        `$= \\frac{${fmt(val)}}{${days2}}$`,
        `$$= ${fmt(daily)} \\text{ ${u} per day}$$`,
      ],
    });
  }

  // Variant 3: double the record
  const doubled = val * 2;
  results.push({
    variantType: "arith_double",
    questionText: `If the record "${t}" of ${fmt(val)} ${u} were doubled, what would the new record be?`,
    answer: fmt(doubled),
    options: shuffle([fmt(doubled), ...wrongOptions(doubled).map(fmt)]),
    steps: [
      `New record $= 2 \\times \\text{current}$`,
      `$= 2 \\times ${fmt(val)}$`,
      `$$= ${fmt(doubled)} \\text{ ${u}}$$`,
    ],
  });

  // Variant 4: difference from previous (if available)
  if (prev && prev !== val) {
    const diff = Math.abs(val - prev);
    const direction = val > prev ? "more" : "less";
    results.push({
      variantType: "arith_difference",
      questionText: `The "${t}" record changed from ${fmt(prev)} to ${fmt(val)} ${u}. By how much did the record change?`,
      answer: fmt(diff),
      options: shuffle([fmt(diff), ...wrongOptions(diff).map(fmt)]),
      steps: [
        `Change $= |\\text{new} - \\text{old}|$`,
        `$= |${fmt(val)} - ${fmt(prev)}|$`,
        `$$= ${fmt(diff)} \\text{ ${u}}$$`,
      ],
    });
  }

  // Variant 5: express in thousands/millions
  if (val >= 1000) {
    const scale = val >= 1_000_000 ? 1_000_000 : 1000;
    const label = scale === 1_000_000 ? "million" : "thousand";
    const expressed = +(val / scale).toFixed(2);
    results.push({
      variantType: "arith_express",
      questionText: `${t} has a value of ${fmt(val)} ${u}. Express this value in ${label}s (rounded to 2 decimal places).`,
      answer: fmt(expressed),
      options: shuffle([fmt(expressed), ...wrongOptions(Math.round(expressed * 100) / 100, 3).map(v => fmt(v))]),
      steps: [
        `$\\text{Value in ${label}s} = \\frac{${fmt(val)}}{${fmt(scale)}}$`,
        `$$= ${fmt(expressed)} \\text{ ${label}s}$$`,
      ],
    });
  }

  // Variant 6: rate per hour (if unit is seconds-based)
  const d6 = pickDivisor(val);
  if (d6 > 0 && val >= 10) {
    const rate = Math.round(val / d6);
    results.push({
      variantType: "arith_rate",
      questionText: `If "${t}" (${fmt(val)} ${u}) grows at a constant rate and reaches its total in ${d6} equal intervals, what is the value per interval?`,
      answer: fmt(rate),
      options: shuffle([fmt(rate), ...wrongOptions(rate).map(fmt)]),
      steps: [
        `Rate $= \\frac{\\text{total}}{\\text{intervals}} = \\frac{${fmt(val)}}{${d6}}$`,
        `$$= ${fmt(rate)} \\text{ ${u}/interval}$$`,
      ],
    });
  }

  return results;
}

// ── PERCENTAGES variants ──────────────────────────────────────────────────────

function pctVariants(card: Card): VariantResult[] {
  const val  = Number(card.value);
  const prev = card.previousValue ? Number(card.previousValue) : null;
  const u    = card.unit;
  const t    = card.title;
  const results: VariantResult[] = [];

  if (prev && prev > 0) {
    // Variant 1: % change
    const change = ((val - prev) / prev) * 100;
    const direction = change >= 0 ? "increase" : "decrease";
    const ans1 = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
    results.push({
      variantType: "pct_change",
      questionText: `"${t}" changed from ${fmt(prev)} to ${fmt(val)} ${u}. What is the percentage ${direction}?`,
      answer: ans1,
      options: shuffle([ans1, ...wrongPct(change)]),
      steps: [
        `% change $= \\frac{\\text{new} - \\text{old}}{\\text{old}} \\times 100$`,
        `$= \\frac{${fmt(val)} - ${fmt(prev)}}{${fmt(prev)}} \\times 100$`,
        `$= \\frac{${(val - prev).toFixed(2)}}{${fmt(prev)}} \\times 100$`,
        `$$= ${change.toFixed(2)}\\%$$`,
      ],
    });

    // Variant 2: % increase question
    const boostPct = Math.round(change > 0 ? change * 1.5 : 25);
    const boosted  = Math.round(val * (1 + boostPct / 100));
    results.push({
      variantType: "pct_increase",
      questionText: `The current record "${t}" is ${fmt(val)} ${u}. If it increases by ${boostPct}%, what will the new value be?`,
      answer: fmt(boosted),
      options: shuffle([fmt(boosted), ...wrongOptions(boosted).map(fmt)]),
      steps: [
        `New value $= \\text{original} \\times (1 + \\frac{p}{100})$`,
        `$= ${fmt(val)} \\times (1 + \\frac{${boostPct}}{100})$`,
        `$= ${fmt(val)} \\times ${(1 + boostPct / 100).toFixed(2)}$`,
        `$$= ${fmt(boosted)} \\text{ ${u}}$$`,
      ],
    });

    // Variant 3: X% of what?
    const knownPct = Math.round(Math.abs(change));
    if (knownPct > 0) {
      const original = Math.round((val / knownPct) * 100);
      results.push({
        variantType: "pct_ofwhat",
        questionText: `${fmt(val)} ${u} is ${knownPct}% of some target value. What is that target value?`,
        answer: fmt(original),
        options: shuffle([fmt(original), ...wrongOptions(original).map(fmt)]),
        steps: [
          `If $x$ is the target: $${knownPct}\\% \\times x = ${fmt(val)}$`,
          `$x = \\frac{${fmt(val)}}{${knownPct}\\%} = \\frac{${fmt(val)}}{${knownPct / 100}}$`,
          `$$x = ${fmt(original)}$$`,
        ],
      });
    }

    // Variant 4: after X% decrease
    const dropPct = Math.round(Math.abs(change));
    const dropped = Math.round(val * (1 - dropPct / 100));
    if (dropped > 0) {
      results.push({
        variantType: "pct_decrease",
        questionText: `The record "${t}" stands at ${fmt(val)} ${u}. If it decreases by ${dropPct}%, what would the remaining value be?`,
        answer: fmt(dropped),
        options: shuffle([fmt(dropped), ...wrongOptions(dropped).map(fmt)]),
        steps: [
          `Remaining $= \\text{original} \\times (1 - \\frac{p}{100})$`,
          `$= ${fmt(val)} \\times (1 - \\frac{${dropPct}}{100})$`,
          `$= ${fmt(val)} \\times ${(1 - dropPct / 100).toFixed(2)}$`,
          `$$= ${fmt(dropped)} \\text{ ${u}}$$`,
        ],
      });
    }

    // Variant 5: what % is old of new?
    const ratio = (prev / val) * 100;
    results.push({
      variantType: "pct_fraction",
      questionText: `The previous record was ${fmt(prev)} ${u} and the current is ${fmt(val)} ${u}. The old record is what percentage of the new one?`,
      answer: `${ratio.toFixed(1)}%`,
      options: shuffle([`${ratio.toFixed(1)}%`, ...wrongPct(ratio)]),
      steps: [
        `Percentage $= \\frac{\\text{old}}{\\text{new}} \\times 100$`,
        `$= \\frac{${fmt(prev)}}{${fmt(val)}} \\times 100$`,
        `$$= ${ratio.toFixed(2)}\\%$$`,
      ],
    });
  } else {
    // No previous value — use a constructed percentage scenario
    const halfPct = 50;
    const half = Math.round(val / 2);
    results.push({
      variantType: "pct_change",
      questionText: `${t} has a record value of ${fmt(val)} ${u}. What is 50% of this record?`,
      answer: fmt(half),
      options: shuffle([fmt(half), ...wrongOptions(half).map(fmt)]),
      steps: [
        `$50\\% \\text{ of } ${fmt(val)} = \\frac{${fmt(val)}}{2}$`,
        `$$= ${fmt(half)} \\text{ ${u}}$$`,
      ],
    });
    results.push({
      variantType: "pct_increase",
      questionText: `The record "${t}" is ${fmt(val)} ${u}. If it grows by 20%, what will the new value be?`,
      answer: fmt(Math.round(val * 1.2)),
      options: shuffle([fmt(Math.round(val * 1.2)), ...wrongOptions(Math.round(val * 1.2)).map(fmt)]),
      steps: [
        `New $= ${fmt(val)} \\times 1.20$`,
        `$$= ${fmt(Math.round(val * 1.2))} \\text{ ${u}}$$`,
      ],
    });
  }

  return results;
}

// ── ALGEBRA variants ──────────────────────────────────────────────────────────

function algVariants(card: Card): VariantResult[] {
  const val = Math.round(Number(card.value));
  const t   = card.title;
  const u   = card.unit;
  const results: VariantResult[] = [];

  // Pick k so that val/k is a clean integer
  const divs = niceDivisors(val);
  const k    = divs.length > 0 ? divs[Math.floor(Math.random() * divs.length)] : Math.max(2, Math.floor(val / 100));

  // Variant 1: kx = val
  const x1 = Math.round(val / k);
  results.push({
    variantType: "alg_linear",
    questionText: `A mathematician models "${t}" with the equation $${k}x = ${fmt(val)}$. Solve for $x$.`,
    answer: fmt(x1),
    options: shuffle([fmt(x1), ...wrongOptions(x1).map(fmt)]),
    steps: [
      `$${k}x = ${fmt(val)}$`,
      `$x = \\frac{${fmt(val)}}{${k}}$`,
      `$$x = ${fmt(x1)}$$`,
    ],
  });

  // Variant 2: x + k = val
  const k2 = Math.round(val * 0.3);
  const x2 = val - k2;
  results.push({
    variantType: "alg_additive",
    questionText: `A training score starts at $x$ and after gaining ${fmt(k2)} ${u} reaches the record "${t}" of ${fmt(val)} ${u}. Find $x$.`,
    answer: fmt(x2),
    options: shuffle([fmt(x2), ...wrongOptions(x2).map(fmt)]),
    steps: [
      `$x + ${fmt(k2)} = ${fmt(val)}$`,
      `$x = ${fmt(val)} - ${fmt(k2)}$`,
      `$$x = ${fmt(x2)}$$`,
    ],
  });

  // Variant 3: 2x + k = val
  const k3 = niceDivisors(val - 2).length > 0 ? Math.round(val * 0.1) : 0;
  const x3 = Math.round((val - k3) / 2);
  results.push({
    variantType: "alg_twostep",
    questionText: `The equation $2x + ${fmt(k3)} = ${fmt(val)}$ models a competition round based on "${t}". What is $x$?`,
    answer: fmt(x3),
    options: shuffle([fmt(x3), ...wrongOptions(x3).map(fmt)]),
    steps: [
      `$2x + ${fmt(k3)} = ${fmt(val)}$`,
      `$2x = ${fmt(val)} - ${fmt(k3)} = ${fmt(val - k3)}$`,
      `$x = \\frac{${fmt(val - k3)}}{2}$`,
      `$$x = ${fmt(x3)}$$`,
    ],
  });

  // Variant 4: x / k = val
  const x4 = val * k;
  results.push({
    variantType: "alg_inverse",
    questionText: `A scorer's full season total (which equals ${fmt(x4)} ${u}) is divided equally into ${k} rounds, matching the per-round record "${t}" of ${fmt(val)} ${u}. Write this as $\\frac{x}{${k}} = ${fmt(val)}$ and find $x$.`,
    answer: fmt(x4),
    options: shuffle([fmt(x4), ...wrongOptions(x4).map(fmt)]),
    steps: [
      `$\\frac{x}{${k}} = ${fmt(val)}$`,
      `$x = ${fmt(val)} \\times ${k}$`,
      `$$x = ${fmt(x4)}$$`,
    ],
  });

  // Variant 5: N - x = k (find the deficit)
  const k5 = Math.round(val * 0.4);
  const x5 = val - k5;
  results.push({
    variantType: "alg_deficit",
    questionText: `A competitor needs to close a gap: the record "${t}" is ${fmt(val)} ${u}, and they've already achieved ${fmt(k5)} ${u}. The equation ${fmt(val)}$ - x = ${fmt(k5)}$ gives the shortfall. Wait — solve $${fmt(val)} - x = ${fmt(k5)}$ for $x$.`,
    answer: fmt(x5),
    options: shuffle([fmt(x5), ...wrongOptions(x5).map(fmt)]),
    steps: [
      `$${fmt(val)} - x = ${fmt(k5)}$`,
      `$x = ${fmt(val)} - ${fmt(k5)}$`,
      `$$x = ${fmt(x5)}$$`,
    ],
  });

  // Variant 6: sum of consecutive integers
  if (val % 2 !== 0 && val >= 5) {
    // val = n + (n+1) + ... for pairs; simple: sum of n consecutive starting from 1
    const n6 = Math.round(val / (val % 3 === 0 ? 3 : 2));
    results.push({
      variantType: "alg_consecutive",
      questionText: `Two consecutive whole numbers sum to ${fmt(val)}. What is the larger number?`,
      answer: fmt(Math.ceil(val / 2)),
      options: shuffle([fmt(Math.ceil(val / 2)), ...wrongOptions(Math.ceil(val / 2)).map(fmt)]),
      steps: [
        `Let the numbers be $n$ and $n+1$`,
        `$n + (n+1) = ${fmt(val)}$`,
        `$2n + 1 = ${fmt(val)}$`,
        `$n = \\frac{${fmt(val)} - 1}{2} = ${Math.floor(val / 2)}$`,
        `$$\\text{Larger} = ${Math.ceil(val / 2)}$$`,
      ],
    });
  }

  return results;
}

// ── RATIOS variants ───────────────────────────────────────────────────────────

function ratioVariants(card: Card): VariantResult[] {
  const val  = Math.round(Number(card.value));
  const prev = card.previousValue ? Math.round(Number(card.previousValue)) : null;
  const u    = card.unit;
  const t    = card.title;
  const results: VariantResult[] = [];

  // Variant 1: split among D
  const d1 = pickDivisor(val);
  const each1 = Math.round(val / d1);
  results.push({
    variantType: "ratio_split",
    questionText: `"${t}" achieved ${fmt(val)} ${u}. This is split in the ratio ${d1}:1 between winners and runners-up. How much does the winner's group get? (Hint: divide total by ${d1 + 1} then multiply by ${d1}.)`,
    answer: fmt(Math.round(val * d1 / (d1 + 1))),
    options: shuffle([fmt(Math.round(val * d1 / (d1 + 1))), ...wrongOptions(Math.round(val * d1 / (d1 + 1))).map(fmt)]),
    steps: [
      `Total parts $= ${d1} + 1 = ${d1 + 1}$`,
      `Winner's share $= \\frac{${d1}}{${d1 + 1}} \\times ${fmt(val)}$`,
      `$$= ${fmt(Math.round(val * d1 / (d1 + 1)))} \\text{ ${u}}$$`,
    ],
  });

  // Variant 2: simplify ratio (if prev available)
  if (prev && prev > 0 && val !== prev) {
    const [sa, sb] = simplifyRatio(val, prev);
    results.push({
      variantType: "ratio_simplify",
      questionText: `The old record was ${fmt(prev)} ${u} and the new record is ${fmt(val)} ${u} for "${t}". Express the ratio new:old in its simplest form as "A:B".`,
      answer: `${sa}:${sb}`,
      options: shuffle([`${sa}:${sb}`, `${Math.round(sa * 1.5)}:${Math.round(sb * 1.5)}`, `${val}:${prev}`, `${sb}:${sa}`]),
      steps: [
        `Ratio $= ${fmt(val)} : ${fmt(prev)}$`,
        `$\\text{GCD}(${fmt(val)}, ${fmt(prev)}) = ${gcd(val, prev)}$`,
        `$= \\frac{${fmt(val)}}{${gcd(val, prev)}} : \\frac{${fmt(prev)}}{${gcd(val, prev)}}$`,
        `$$= ${sa} : ${sb}$$`,
      ],
    });
  }

  // Variant 3: A:B share — given total, find A's portion
  const aRatio = 3, bRatio = 2, total3 = val;
  const aPart  = Math.round(total3 * aRatio / (aRatio + bRatio));
  results.push({
    variantType: "ratio_share",
    questionText: `The prize pool "${t}" of ${fmt(val)} ${u} is split in a ${aRatio}:${bRatio} ratio between two groups. How much does the larger group receive?`,
    answer: fmt(aPart),
    options: shuffle([fmt(aPart), ...wrongOptions(aPart).map(fmt)]),
    steps: [
      `Larger group $= \\frac{${aRatio}}{${aRatio + bRatio}} \\times ${fmt(val)}$`,
      `$= \\frac{${aRatio} \\times ${fmt(val)}}{${aRatio + bRatio}}$`,
      `$$= ${fmt(aPart)} \\text{ ${u}}$$`,
    ],
  });

  // Variant 4: scale — if halved, what's the new ratio value?
  const d4 = 2;
  const scaled = Math.round(val / d4);
  results.push({
    variantType: "ratio_scale",
    questionText: `If the record "${t}" (${fmt(val)} ${u}) is halved to create a junior division benchmark, what is the junior target in ${u}?`,
    answer: fmt(scaled),
    options: shuffle([fmt(scaled), ...wrongOptions(scaled).map(fmt)]),
    steps: [
      `Junior target $= \\frac{${fmt(val)}}{2}$`,
      `$$= ${fmt(scaled)} \\text{ ${u}}$$`,
    ],
  });

  // Variant 5: equal share across N groups
  const d5 = [3, 4, 5].find(d => val % d === 0) ?? 4;
  const share5 = Math.round(val / d5);
  results.push({
    variantType: "ratio_equal",
    questionText: `"${t}" of ${fmt(val)} ${u} is distributed equally among ${d5} countries. What does each country receive?`,
    answer: fmt(share5),
    options: shuffle([fmt(share5), ...wrongOptions(share5).map(fmt)]),
    steps: [
      `Per country $= \\frac{${fmt(val)}}{${d5}}$`,
      `$$= ${fmt(share5)} \\text{ ${u}}$$`,
    ],
  });

  return results;
}

// ── STATISTICS variants ───────────────────────────────────────────────────────

function statVariants(card: Card): VariantResult[] {
  const val  = Math.round(Number(card.value));
  const prev = card.previousValue ? Math.round(Number(card.previousValue)) : null;
  const u    = card.unit;
  const t    = card.title;
  const results: VariantResult[] = [];

  const c = prev ?? Math.round(val * 0.8);

  // Variant 1: mean of two
  const mean2 = Math.round((val + c) / 2);
  results.push({
    variantType: "stat_mean2",
    questionText: `The old record for "${t}" was ${fmt(c)} ${u}, and the new record is ${fmt(val)} ${u}. What is the mean (average) of these two values?`,
    answer: fmt(mean2),
    options: shuffle([fmt(mean2), ...wrongOptions(mean2).map(fmt)]),
    steps: [
      `Mean $= \\frac{\\text{sum}}{\\text{count}} = \\frac{${fmt(val)} + ${fmt(c)}}{2}$`,
      `$= \\frac{${fmt(val + c)}}{2}$`,
      `$$= ${fmt(mean2)} \\text{ ${u}}$$`,
    ],
  });

  // Variant 2: mean of three (add a constructed third value)
  const third = Math.round(val * 0.9);
  const mean3 = Math.round((val + c + third) / 3);
  results.push({
    variantType: "stat_mean3",
    questionText: `Three records for "${t}" were measured: ${fmt(c)} ${u}, ${fmt(third)} ${u}, and ${fmt(val)} ${u}. Find the mean.`,
    answer: fmt(mean3),
    options: shuffle([fmt(mean3), ...wrongOptions(mean3).map(fmt)]),
    steps: [
      `Sum $= ${fmt(c)} + ${fmt(third)} + ${fmt(val)} = ${fmt(c + third + val)}$`,
      `Mean $= \\frac{${fmt(c + third + val)}}{3}$`,
      `$$= ${fmt(mean3)} \\text{ ${u}}$$`,
    ],
  });

  // Variant 3: find the other given mean
  results.push({
    variantType: "stat_findother",
    questionText: `Two attempts for "${t}" have a mean of ${fmt(mean2)} ${u}. One attempt was ${fmt(c)} ${u}. What was the other?`,
    answer: fmt(val),
    options: shuffle([fmt(val), ...wrongOptions(val).map(fmt)]),
    steps: [
      `Sum $= \\text{mean} \\times 2 = ${fmt(mean2)} \\times 2 = ${fmt(mean2 * 2)}$`,
      `Other $= ${fmt(mean2 * 2)} - ${fmt(c)}$`,
      `$$= ${fmt(val)} \\text{ ${u}}$$`,
    ],
  });

  // Variant 4: range
  const lo = Math.round(val * 0.7), hi = val;
  const range4 = hi - lo;
  results.push({
    variantType: "stat_range",
    questionText: `Across multiple competitions, "${t}" has varied between ${fmt(lo)} ${u} and ${fmt(hi)} ${u}. What is the range?`,
    answer: fmt(range4),
    options: shuffle([fmt(range4), ...wrongOptions(range4).map(fmt)]),
    steps: [
      `Range $= \\text{max} - \\text{min}$`,
      `$= ${fmt(hi)} - ${fmt(lo)}$`,
      `$$= ${fmt(range4)} \\text{ ${u}}$$`,
    ],
  });

  // Variant 5: median of 5 values
  const vals5 = [Math.round(val * 0.75), Math.round(val * 0.88), val, Math.round(val * 1.05), Math.round(val * 1.12)].sort((a, b) => a - b);
  const median5 = vals5[2];
  results.push({
    variantType: "stat_median",
    questionText: `Five measurements related to "${t}" were recorded (in ${u}): ${vals5.map(fmt).join(", ")}. What is the median?`,
    answer: fmt(median5),
    options: shuffle([fmt(median5), fmt(vals5[1]), fmt(vals5[3]), fmt(Math.round((median5 + vals5[3]) / 2))]),
    steps: [
      `Sorted: ${vals5.map(v => `$${fmt(v)}$`).join(", ")}`,
      `Median = middle value (position 3 of 5)`,
      `$$\\text{Median} = ${fmt(median5)} \\text{ ${u}}$$`,
    ],
  });

  return results;
}

// ── PROBABILITY variants ──────────────────────────────────────────────────────

function probVariants(card: Card): VariantResult[] {
  const val = Math.round(Number(card.value));
  const t   = card.title;
  const u   = card.unit;
  const results: VariantResult[] = [];

  const total1 = Math.max(val * 2, 100);
  const fav1   = val;
  const p1     = +(fav1 / total1).toFixed(2);

  // Variant 1: basic P = fav/total
  results.push({
    variantType: "prob_basic",
    questionText: `In a competition inspired by "${t}", ${fmt(fav1)} out of ${fmt(total1)} attempts are successful. What is the probability of success? (Express as a decimal to 2 dp.)`,
    answer: String(p1),
    options: shuffle([String(p1), String(+(p1 + 0.1).toFixed(2)), String(+(Math.max(0, p1 - 0.1)).toFixed(2)), String(+(p1 + 0.05).toFixed(2))]),
    steps: [
      `$P(\\text{success}) = \\frac{\\text{favourable}}{\\text{total}}$`,
      `$= \\frac{${fmt(fav1)}}{${fmt(total1)}}$`,
      `$$= ${p1}$$`,
    ],
  });

  // Variant 2: complement
  const pComp = +(1 - p1).toFixed(2);
  results.push({
    variantType: "prob_complement",
    questionText: `The probability of winning in a "${t}"-themed challenge is ${p1}. What is the probability of NOT winning?`,
    answer: String(pComp),
    options: shuffle([String(pComp), String(p1), String(+(pComp + 0.1).toFixed(2)), String(+(Math.max(0, pComp - 0.1)).toFixed(2))]),
    steps: [
      `$P(\\text{not win}) = 1 - P(\\text{win})$`,
      `$= 1 - ${p1}$`,
      `$$= ${pComp}$$`,
    ],
  });

  // Variant 3: scale to new total
  const newTotal = total1 * 2;
  const newFav   = fav1 * 2; // same probability, larger sample
  results.push({
    variantType: "prob_scaled",
    questionText: `In a larger tournament with ${fmt(newTotal)} rounds (double the original), and the same success rate as "${t}", how many rounds are expected to succeed?`,
    answer: fmt(newFav),
    options: shuffle([fmt(newFav), ...wrongOptions(newFav).map(fmt)]),
    steps: [
      `Success rate $= \\frac{${fmt(fav1)}}{${fmt(total1)}} = ${p1}$`,
      `Expected successes $= ${p1} \\times ${fmt(newTotal)}$`,
      `$$= ${fmt(newFav)}$$`,
    ],
  });

  // Variant 4: fraction form
  const g = gcd(fav1, total1);
  const [sn, sd] = [fav1 / g, total1 / g];
  results.push({
    variantType: "prob_fraction",
    questionText: `In the "${t}" challenge, ${fmt(fav1)} out of ${fmt(total1)} events are successes. Express this probability as a simplified fraction.`,
    answer: `${sn}/${sd}`,
    options: shuffle([`${sn}/${sd}`, `${fav1}/${total1}`, `${sn + 1}/${sd}`, `${sn}/${sd + 1}`]),
    steps: [
      `$P = \\frac{${fmt(fav1)}}{${fmt(total1)}}$`,
      `$\\text{GCD}(${fmt(fav1)}, ${fmt(total1)}) = ${g}$`,
      `$$= \\frac{${sn}}{${sd}}$$`,
    ],
  });

  // Variant 5: two independent events
  const p5a = p1;
  const p5b = +(p1 * 0.8).toFixed(2);
  const pBoth = +(p5a * p5b).toFixed(4);
  results.push({
    variantType: "prob_independent",
    questionText: `Event A (inspired by "${t}") has probability ${p5a}. Event B has probability ${p5b}. Assuming independence, what is P(A and B)? Round to 4 decimal places.`,
    answer: String(pBoth),
    options: shuffle([String(pBoth), String(+(pBoth + 0.05).toFixed(4)), String(+(Math.max(0, pBoth - 0.05)).toFixed(4)), String(+(p5a + p5b).toFixed(4))]),
    steps: [
      `$P(A \\cap B) = P(A) \\times P(B)$ (independence)`,
      `$= ${p5a} \\times ${p5b}$`,
      `$$= ${pBoth}$$`,
    ],
  });

  return results;
}

// ── GEOMETRY variants ─────────────────────────────────────────────────────────

function geoVariants(card: Card): VariantResult[] {
  const val = Math.round(Number(card.value));
  const t   = card.title;
  const u   = card.unit;
  const results: VariantResult[] = [];

  const side = Math.round(Math.sqrt(val));

  // Variant 1: area → side length
  results.push({
    variantType: "geo_sqrt",
    questionText: `A competition arena has an area of ${fmt(val)} square metres, inspired by the record "${t}". If the arena is square, what is the side length (in whole metres)?`,
    answer: `${side} m`,
    options: shuffle([`${side} m`, `${side + 1} m`, `${Math.max(1, side - 1)} m`, `${side + 2} m`]),
    steps: [
      `Area $= \\text{side}^2$`,
      `$\\text{side} = \\sqrt{${fmt(val)}}$`,
      `$$\\approx ${side} \\text{ m}$$`,
    ],
  });

  // Variant 2: square perimeter from area
  const perim = 4 * side;
  results.push({
    variantType: "geo_perimeter",
    questionText: `An arena modelled on "${t}" has an area of ${fmt(val)} sq. m. What is the perimeter of this square arena?`,
    answer: `${perim} m`,
    options: shuffle([`${perim} m`, `${perim + 4} m`, `${Math.max(4, perim - 4)} m`, `${perim + 8} m`]),
    steps: [
      `Side $= \\sqrt{${fmt(val)}} \\approx ${side}$ m`,
      `Perimeter $= 4 \\times \\text{side} = 4 \\times ${side}$`,
      `$$= ${perim} \\text{ m}$$`,
    ],
  });

  // Variant 3: rectangle area
  const w3 = side, h3 = side + Math.round(side * 0.5);
  const area3 = w3 * h3;
  results.push({
    variantType: "geo_rectangle",
    questionText: `A Mathlers scoreboard inspired by "${t}" is ${fmt(w3)} m wide and ${fmt(h3)} m tall. What is its area?`,
    answer: `${fmt(area3)} m²`,
    options: shuffle([`${fmt(area3)} m²`, `${fmt(area3 + w3)} m²`, `${fmt(area3 - h3)} m²`, `${fmt(area3 * 2)} m²`]),
    steps: [
      `Area $= \\text{width} \\times \\text{height}$`,
      `$= ${fmt(w3)} \\times ${fmt(h3)}$`,
      `$$= ${fmt(area3)} \\text{ m}^2$$`,
    ],
  });

  // Variant 4: circumference from diameter
  const diameter4 = side;
  const circ4     = +(Math.PI * diameter4).toFixed(1);
  results.push({
    variantType: "geo_circumference",
    questionText: `A circular arena themed on "${t}" has a diameter of ${fmt(diameter4)} m. What is its circumference? (Use $\\pi \\approx 3.14$, round to 1 dp.)`,
    answer: `${(3.14 * diameter4).toFixed(1)} m`,
    options: shuffle([
      `${(3.14 * diameter4).toFixed(1)} m`,
      `${(3.14 * diameter4 + 3.14).toFixed(1)} m`,
      `${(3.14 * diameter4 - 3.14).toFixed(1)} m`,
      `${(3.14 * diameter4 * 2).toFixed(1)} m`,
    ]),
    steps: [
      `$C = \\pi d$`,
      `$= 3.14 \\times ${fmt(diameter4)}$`,
      `$$= ${(3.14 * diameter4).toFixed(1)} \\text{ m}$$`,
    ],
  });

  // Variant 5: volume of cube
  const cubeSide = Math.max(2, Math.round(Math.cbrt(val)));
  const vol5     = Math.pow(cubeSide, 3);
  results.push({
    variantType: "geo_volume",
    questionText: `A cube trophy designed for "${t}" has a side length of ${cubeSide} units. What is its volume?`,
    answer: `${fmt(vol5)} cubic units`,
    options: shuffle([`${fmt(vol5)} cubic units`, `${fmt(vol5 + cubeSide * cubeSide)} cubic units`, `${fmt(vol5 - cubeSide)} cubic units`, `${fmt(Math.pow(cubeSide + 1, 3))} cubic units`]),
    steps: [
      `Volume $= \\text{side}^3$`,
      `$= ${cubeSide}^3$`,
      `$$= ${fmt(vol5)} \\text{ cubic units}$$`,
    ],
  });

  // Variant 6: triangle area
  const base6   = side;
  const height6 = Math.round(side * 0.75);
  const triArea = Math.round(0.5 * base6 * height6);
  results.push({
    variantType: "geo_triangle",
    questionText: `A triangular flag celebrating "${t}" has a base of ${fmt(base6)} m and a height of ${fmt(height6)} m. What is its area?`,
    answer: `${fmt(triArea)} m²`,
    options: shuffle([`${fmt(triArea)} m²`, `${fmt(triArea + base6)} m²`, `${fmt(Math.max(1, triArea - height6))} m²`, `${fmt(base6 * height6)} m²`]),
    steps: [
      `Area $= \\frac{1}{2} \\times \\text{base} \\times \\text{height}$`,
      `$= \\frac{1}{2} \\times ${fmt(base6)} \\times ${fmt(height6)}$`,
      `$$= ${fmt(triArea)} \\text{ m}^2$$`,
    ],
  });

  return results;
}

// ── Topic dispatcher ──────────────────────────────────────────────────────────

function getVariants(card: Card, topic: string): VariantResult[] {
  try {
    switch (topic) {
      case "arithmetic":   return arithVariants(card);
      case "percentages":  return pctVariants(card);
      case "algebra":      return algVariants(card);
      case "ratios":       return ratioVariants(card);
      case "statistics":   return statVariants(card);
      case "probability":  return probVariants(card);
      case "geometry":     return geoVariants(card);
      default:             return arithVariants(card);
    }
  } catch {
    return arithVariants(card);
  }
}

// ── Hash ──────────────────────────────────────────────────────────────────────

function makeHash(cardId: number, topic: string, variantType: string): string {
  return crypto.createHash("sha256").update(`${cardId}-${topic}-${variantType}`).digest("hex");
}

// ── LLM narrative ─────────────────────────────────────────────────────────────

function buildNarrativePrompt(card: Card, topic: string, difficulty: string, roundName: string, questionText: string): string {
  return `You are the Mathlers boxing-ring narrator. Create a SHORT, exciting 2-sentence intro that sets up this math question in a boxing/competition context.

Record: "${card.title}" — ${Number(card.value).toLocaleString()} ${card.unit}${card.holder ? ` by ${card.holder}` : ""}
Topic: ${topic} | Difficulty: ${difficulty} | Round: ${roundName}
Question context: ${questionText.slice(0, 120)}

Rules:
- Exactly 2 sentences
- Exciting, punchy, boxing-ring commentary style
- Mention the record/athlete name if available
- Do NOT reveal or calculate the answer
- No markdown, no quotes around the text

Return only the 2-sentence narrative:`;
}

// ── Main API: generate a question ─────────────────────────────────────────────

const ROUND_NAMES = ["Warmup", "Jab", "Hook", "Uppercut", "Knockout"];
const DIFFICULTY_TIME: Record<string, number> = { easy: 90, medium: 60, hard: 45, expert: 30 };
const DIFFICULTY_PTS:  Record<string, number> = { easy: 50, medium: 100, hard: 150, expert: 200 };

export async function generateQuestion(params: {
  card: Card;
  topic: string;
  difficulty: string;
  roundName?: string;
  logger?: any;
}): Promise<any> {
  const { card, topic, difficulty, roundName = ROUND_NAMES[Math.floor(Math.random() * ROUND_NAMES.length)], logger } = params;

  // Get all available variants for this card+topic
  const variants = getVariants(card, topic);
  if (variants.length === 0) throw new Error(`No variants for topic ${topic}`);

  // Check which variants already exist in DB
  const hashes = variants.map(v => makeHash(card.id, topic, v.variantType));
  const existing = await db.select().from(questionsTable).where(
    // drizzle doesn't have a direct "in hashes" for text arrays, use raw approach
    inArray(questionsTable.hash, hashes)
  ).catch(() => [] as any[]);

  const usedHashes = new Set((existing as any[]).map((q: any) => q.hash));
  const fresh = variants.filter(v => !usedHashes.has(makeHash(card.id, topic, v.variantType)));

  // Prefer a fresh variant; fall back to any variant (return cached)
  const chosen = fresh.length > 0
    ? fresh[Math.floor(Math.random() * fresh.length)]
    : variants[Math.floor(Math.random() * variants.length)];

  const hash = makeHash(card.id, topic, chosen.variantType);

  // Return existing if already in DB
  const cached = (existing as any[]).find((q: any) => q.hash === hash);
  if (cached) {
    const [c] = await db.select().from(recordCardsTable).where(eq(recordCardsTable.id, cached.recordCardId));
    return serializeQ(cached, c);
  }

  // AI narrative
  let scenario = `Step into the ring! "${card.title}" — ${Number(card.value).toLocaleString()} ${card.unit}. Can you solve it?`;
  let providerId: string | null = null;
  try {
    const llm = await callLLMWithFallback(buildNarrativePrompt(card, topic, difficulty, roundName, chosen.questionText), logger);
    if (llm) { scenario = llm.text.trim(); providerId = llm.providerId; }
  } catch {}

  const [question] = await db.insert(questionsTable).values({
    recordCardId: card.id, templateId: null,
    roundName, topic, difficulty,
    scenario, questionText: chosen.questionText,
    options: chosen.options,
    correctAnswer: chosen.answer,
    steps: chosen.steps,
    hash, validated: true,
    timeLimitSeconds: DIFFICULTY_TIME[difficulty] ?? 60,
    pointValue: DIFFICULTY_PTS[difficulty] ?? 100,
    providerId,
  }).returning();

  return serializeQ(question, card);
}

function serializeQ(q: any, card?: any) {
  return {
    ...q,
    createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
    recordCard: card ? {
      ...card,
      value: Number(card.value),
      previousValue: card.previousValue ? Number(card.previousValue) : null,
      createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : card.createdAt,
    } : undefined,
  };
}

// ── Smart match question picker ───────────────────────────────────────────────
// Picks a question for a match round, avoiding:
//   1. Questions already used in this match (by ID)
//   2. Record cards already used in this match
//   3. Topics already used in consecutive rounds

export async function pickMatchQuestion(params: {
  difficulty: string;
  topics: string[];
  usedQuestionIds: number[];
  usedCardIds: number[];
  roundIndex: number;
  logger?: any;
}): Promise<any | null> {
  const { difficulty, topics, usedQuestionIds, usedCardIds, roundIndex, logger } = params;

  // Get all record cards
  const allCards = await db.select().from(recordCardsTable);
  if (allCards.length === 0) return null;

  // Prefer unused cards first
  const unusedCards = allCards.filter(c => !usedCardIds.includes(c.id));
  const cardPool    = unusedCards.length > 0 ? unusedCards : allCards;

  // Cycle topics deterministically by round
  const TOPICS = ["arithmetic", "percentages", "algebra", "ratios", "statistics", "probability", "geometry"];
  const filteredTopics = topics.length > 0 ? topics.filter(t => TOPICS.includes(t)) : TOPICS;
  const topic = filteredTopics[roundIndex % filteredTopics.length];

  // Try up to 8 cards to find one with a fresh variant
  const candidates = shuffle([...cardPool]).slice(0, 8);
  for (const card of candidates) {
    try {
      const q = await generateQuestion({
        card: card as any, topic, difficulty,
        roundName: ["Warmup", "Jab", "Hook", "Uppercut", "Knockout"][Math.min(roundIndex, 4)],
        logger,
      });
      if (!usedQuestionIds.includes(q.id)) return q;
    } catch {}
  }

  // Last resort: any question from DB not in used list
  const rows = await db.select().from(questionsTable);
  const fresh = rows.filter(q => !usedQuestionIds.includes(q.id));
  if (fresh.length > 0) {
    const q = fresh[Math.floor(Math.random() * fresh.length)];
    const [c] = await db.select().from(recordCardsTable).where(eq(recordCardsTable.id, q.recordCardId));
    return serializeQ(q, c);
  }

  return null;
}
