import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMatch, useSubmitAnswer, useCompleteMatch, useGenerateQuestion } from "@workspace/api-client-react";
import { RecordCardDisplay } from "@/components/RecordCardDisplay";
import { MathText, SolutionSteps } from "@/components/Math";
import { Clock, Zap, Target, ChevronRight, CheckCircle, XCircle, Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUND_NAMES  = ["Warmup", "Jab", "Hook", "Uppercut", "Knockout"];
const ROUND_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-orange-500", "bg-red-500"];
const ROUND_GLOWS  = ["shadow-emerald-200", "shadow-blue-200", "shadow-violet-200", "shadow-orange-200", "shadow-red-200"];

function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct    = Math.max(0, (seconds / total) * 100);
  const urgent = pct < 30;
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", urgent ? "bg-red-500" : "bg-primary")}
        style={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "linear" }}
      />
    </div>
  );
}

function RoundDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i < current - 1 ? "w-2 h-2 bg-primary/40" : i === current - 1 ? "w-3 h-3 bg-primary" : "w-2 h-2 bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

export default function Match() {
  const [, nav]    = useLocation();
  const search     = useSearch();
  const params     = new URLSearchParams(search);
  const matchId    = params.get("id") ? Number(params.get("id")) : null;
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: match, refetch } = useGetMatch(matchId!, {
    query: { enabled: !!matchId, refetchInterval: false } as any,
  });
  const submitAnswer   = useSubmitAnswer();
  const completeMatch  = useCompleteMatch();
  const generateQuestion = useGenerateQuestion();

  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult]     = useState<{ correct: boolean; correctAnswer: string; explanation: string; steps: string[]; pointsEarned: number } | null>(null);
  const [timeLeft, setTime]     = useState(60);
  const [timeTotal, setTotal]   = useState(60);
  const [comboMult, setCombo]   = useState(1);
  const [showCombo, setShowCombo] = useState(false);

  // Standalone question when no matchId
  const [standaloneQ, setStandaloneQ] = useState<any>(null);

  // If match has no currentQuestion, poll until it resolves (server auto-assigns)
  useEffect(() => {
    if (!matchId) return;
    if (match?.currentQuestion) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    if (!pollRef.current) {
      pollRef.current = setInterval(() => { refetch(); }, 1500);
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [matchId, match?.currentQuestion]);

  // Standalone question generation
  useEffect(() => {
    if (!matchId && !standaloneQ && !generateQuestion.isPending) {
      generateQuestion.mutateAsync({
        data: { recordCardId: 1, difficulty: params.get("difficulty") ?? "medium", topic: "arithmetic" },
      }).then(q => setStandaloneQ(q)).catch(() => {});
    }
  }, [matchId]);

  const question = (match as any)?.currentQuestion ?? standaloneQ;

  // Timer
  useEffect(() => {
    if (!question) return;
    const t = question.timeLimitSeconds ?? 60;
    setTime(t); setTotal(t); setSelected(null); setResult(null);
    const id = setInterval(() => setTime(prev => { if (prev <= 1) { clearInterval(id); return 0; } return prev - 1; }), 1000);
    return () => clearInterval(id);
  }, [question?.id]);

  // Combo flash
  useEffect(() => {
    if (comboMult > 1) { setShowCombo(true); setTimeout(() => setShowCombo(false), 1200); }
  }, [comboMult]);

  async function handleSubmit(option: string) {
    if (selected || !question) return;
    setSelected(option);
    if (matchId) {
      // All answer validation is server-side — never check client-side
      const res = await submitAnswer.mutateAsync({
        id: matchId,
        data: { questionId: question.id, selectedAnswer: option, responseTimeMs: (timeTotal - timeLeft) * 1000 },
      });
      setResult({ correct: res.correct, correctAnswer: res.correctAnswer, explanation: res.explanation ?? "", steps: (res.steps as string[]) ?? [], pointsEarned: res.pointsEarned ?? 0 });
      setCombo(res.comboMultiplier ?? 1);
      if (res.matchComplete) {
        setTimeout(() => nav(`/result?id=${matchId}`), 2200);
      } else {
        setTimeout(async () => {
          await refetch();
          setSelected(null); setResult(null);
        }, 2600);
      }
    } else {
      // Standalone mode: show placeholder — no answer reveal without server validation
      setResult({ correct: false, correctAnswer: "—", explanation: "Submit through a match to validate answers.", steps: [], pointsEarned: 0 });
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-xl">🥊</span>
          </div>
          <div>
            <p className="font-bold text-foreground">Loading your match…</p>
            <p className="text-sm text-muted-foreground mt-1">Generating the first question</p>
          </div>
        </div>
      </div>
    );
  }

  const roundIdx  = match ? Math.min((match.currentRound ?? 1) - 1, 4) : 0;
  const roundName = ROUND_NAMES[roundIdx];
  const roundColor = ROUND_COLORS[roundIdx];
  const roundGlow  = ROUND_GLOWS[roundIdx];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full">

      {/* ── HUD ── */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <motion.div
            key={roundName}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("px-3 py-1 rounded-full text-white text-xs font-bold shadow-md", roundColor, roundGlow)}
          >
            {roundName}
          </motion.div>
          {match && <RoundDots total={match.totalRounds ?? 5} current={match.currentRound ?? 1} />}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <motion.span
              key={match?.score}
              initial={{ scale: 1.4, color: "hsl(348 80% 54%)" }}
              animate={{ scale: 1, color: "inherit" }}
              className="font-black tabular-nums text-base"
            >
              {match?.score ?? 0}
            </motion.span>
          </div>

          <AnimatePresence>
            {comboMult > 1 && showCombo && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-black border border-amber-200"
              >
                <Flame className="w-3 h-3" /> ×{comboMult.toFixed(1)} COMBO
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground tabular-nums text-sm">
              {(Number(match?.accuracy ?? 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className={cn("w-4 h-4", timeLeft < 15 ? "text-red-500 animate-pulse" : "text-muted-foreground")} />
          <motion.span
            key={timeLeft}
            initial={timeLeft < 15 ? { scale: 1.15 } : {}}
            animate={{ scale: 1 }}
            className={cn("font-black text-xl tabular-nums w-9 text-right", timeLeft < 15 ? "text-red-500" : "text-foreground")}
          >
            {timeLeft}
          </motion.span>
        </div>
      </div>

      <TimerBar seconds={timeLeft} total={timeTotal} />

      {/* ── Record card ── */}
      {question.recordCard && (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-5 mb-4"
        >
          <RecordCardDisplay card={question.recordCard} compact />
        </motion.div>
      )}

      {/* ── Question card ── */}
      <motion.div
        key={question.id + "-q"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl border border-border bg-white p-5 mb-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {question.topic}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {question.difficulty}
          </span>
        </div>
        {question.scenario && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 italic border-l-2 border-primary/30 pl-3">
            "{question.scenario}"
          </p>
        )}
        <p className="font-bold text-foreground text-base leading-snug">
          <MathText text={question.questionText} />
        </p>
      </motion.div>

      {/* ── Answer options ── */}
      <motion.div
        key={question.id + "-opts"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
      >
        {(question.options as string[]).map((opt, i) => {
          const isSelected = selected === opt;
          const isCorrect  = result && opt === result.correctAnswer;
          const isWrong    = result && isSelected && !result.correct;
          return (
            <motion.button
              key={opt}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={!selected ? { scale: 1.02, y: -1 } : {}}
              whileTap={!selected ? { scale: 0.98 } : {}}
              onClick={() => handleSubmit(opt)}
              disabled={!!selected}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors font-medium text-sm",
                !selected && "hover:border-primary/40 hover:bg-primary/5 cursor-pointer border-border bg-white text-foreground",
                selected && !isCorrect && !isWrong && "cursor-default border-border bg-white text-foreground opacity-50",
                isCorrect  && "border-emerald-400 bg-emerald-50 text-emerald-800",
                isWrong    && "border-red-400 bg-red-50 text-red-800",
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2",
                isCorrect ? "border-emerald-400 bg-emerald-400 text-white" : isWrong ? "border-red-400 bg-red-400 text-white" : "border-border text-muted-foreground"
              )}>
                {isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : isWrong ? <XCircle className="w-3.5 h-3.5" /> : ["A","B","C","D"][i]}
              </span>
              <MathText text={opt} />
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Result panel ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn("rounded-2xl border-2 p-4 mb-4 overflow-hidden", result.correct ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50")}
          >
            <div className="flex items-center gap-2 mb-3">
              {result.correct
                ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                : <XCircle    className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <span className="font-bold text-sm">
                {result.correct
                  ? `Correct! +${result.pointsEarned} pts`
                  : <span>Incorrect — correct answer: <MathText text={result.correctAnswer} className="font-black" /></span>}
              </span>
            </div>

            {result.steps.length > 0 && (
              <div className="border-t border-current/10 pt-3 mt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Solution</p>
                <SolutionSteps steps={result.steps} />
              </div>
            )}

            {(question.knockoutChallenge && result.correct) && (
              <div className="mt-3 pt-3 border-t border-current/10">
                <Trophy className="w-4 h-4 text-primary inline mr-1" />
                <span className="text-xs font-bold text-primary">Knockout Challenge: </span>
                <MathText text={question.knockoutChallenge} className="text-xs text-foreground" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Standalone next question button ── */}
      {!matchId && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
          <button
            onClick={() => { setStandaloneQ(null); setSelected(null); setResult(null); }}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-md"
          >
            Next Question <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
