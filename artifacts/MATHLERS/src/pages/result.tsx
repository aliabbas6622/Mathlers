import { Link, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMatch } from "@workspace/api-client-react";
import { BeltBadge } from "@/components/BeltBadge";
import { MathText, SolutionSteps } from "@/components/Math";
import { Trophy, Target, Zap, ChevronRight, CheckCircle, XCircle, Flame, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUND_COLORS: Record<string, string> = {
  Warmup: "bg-emerald-100 text-emerald-700",
  Jab:    "bg-blue-100 text-blue-700",
  Hook:   "bg-violet-100 text-violet-700",
  Uppercut:"bg-orange-100 text-orange-700",
  Knockout:"bg-red-100 text-red-700",
};

export default function Result() {
  const search  = useSearch();
  const params  = new URLSearchParams(search);
  const matchId = params.get("id") ? Number(params.get("id")) : null;
  const { data: match } = useGetMatch(matchId!, { query: { enabled: !!matchId } as any });

  const rounds  = (match?.rounds ?? []) as Array<{ roundNumber: number; roundName: string; questionId: number; correct: boolean; responseTime: number; pointsEarned: number; selectedAnswer: string }>;
  const correct = rounds.filter(r => r.correct).length;
  const total   = rounds.length;
  const won     = total > 0 && correct >= Math.ceil(total / 2);
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const fastestTime = rounds.length > 0 ? Math.min(...rounds.map(r => r.responseTime)) : null;
  const longestCombo = match?.streak ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 w-full">

      {/* ── Outcome header ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
          className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg",
            won ? "bg-gradient-to-br from-amber-400 to-amber-500" : "bg-gradient-to-br from-muted to-muted-foreground/20")}
        >
          {won ? <Trophy className="w-10 h-10 text-white" /> : <Target className="w-10 h-10 text-muted-foreground" />}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn("text-4xl font-black mb-1", won ? "text-foreground" : "text-muted-foreground")}
        >
          {won ? "Victory! 🥊" : "Keep Training!"}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm">
          {won ? "You've dominated the ring — great work!" : "Every champion loses before they win. Review the steps and try again."}
        </motion.p>
      </motion.div>

      {/* ── Score summary ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-border bg-white p-6 shadow-sm mb-5"
      >
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          {[
            { icon: Zap,    label: "Score",    value: (match?.score ?? 0).toLocaleString() },
            { icon: Target, label: "Accuracy",  value: `${accuracy.toFixed(0)}%` },
            { icon: Star,   label: "Correct",   value: `${correct}/${total}` },
          ].map(({ icon: Icon, label, value }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}>
              <Icon className="w-5 h-5 text-primary mx-auto mb-1 opacity-70" />
              <div className="text-3xl font-black text-foreground tabular-nums">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Extra stats row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border text-center">
          <div>
            <Flame className="w-4 h-4 text-orange-500 mx-auto mb-0.5" />
            <div className="text-sm font-black">{longestCombo}</div>
            <div className="text-xs text-muted-foreground">Best Combo</div>
          </div>
          <div>
            <Clock className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
            <div className="text-sm font-black">{fastestTime !== null ? `${fastestTime.toFixed(1)}s` : "—"}</div>
            <div className="text-xs text-muted-foreground">Fastest Answer</div>
          </div>
          <div className="flex flex-col items-center">
            {match && <BeltBadge belt={(match as any).belt ?? "bronze"} size="md" />}
            <div className="text-xs text-muted-foreground mt-0.5">Current Belt</div>
          </div>
        </div>
      </motion.div>

      {/* ── Round breakdown ── */}
      {rounds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm mb-5"
        >
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="font-bold text-sm text-foreground">Round Breakdown</h2>
          </div>
          <div className="divide-y divide-border">
            {rounds.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                className="flex items-center gap-3 px-5 py-3"
              >
                {r.correct
                  ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  : <XCircle    className="w-5 h-5 text-red-400    flex-shrink-0" />}
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0", ROUND_COLORS[r.roundName] ?? "bg-muted text-muted-foreground")}>
                  {r.roundName}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground truncate">
                    {r.correct ? "Correct answer" : <span>Answered: <MathText text={r.selectedAnswer} /></span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                  <span>{r.responseTime.toFixed(1)}s</span>
                  <span className={cn("font-black tabular-nums", r.correct ? "text-primary" : "text-muted-foreground")}>
                    {r.correct ? `+${r.pointsEarned}` : "0"} pts
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Link href="/arena"
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-md">
          <Zap className="w-4 h-4" /> Play Again
        </Link>
        <Link href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-border text-foreground px-5 py-3 rounded-xl font-semibold text-sm hover:bg-muted transition-colors">
          <Target className="w-4 h-4" /> Dashboard
        </Link>
        <Link href="/leaderboard"
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-border text-foreground px-5 py-3 rounded-xl font-semibold text-sm hover:bg-muted transition-colors">
          <Trophy className="w-4 h-4" /> Leaderboard
        </Link>
      </motion.div>
    </div>
  );
}
