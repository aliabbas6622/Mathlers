import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateMatch } from "@workspace/api-client-react";
import { Shield, Swords, Trophy, Users, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "practice",    label: "Practice",       icon: Shield,  desc: "Solo vs AI. Any difficulty. No ELO at stake.",          available: true },
  { id: "sparring",    label: "Sparring",        icon: Swords,  desc: "1v1 friendly match against another student.",           available: false },
  { id: "ranked",      label: "Ranked",          icon: Trophy,  desc: "Competitive ELO-based matchmaking. Earn your rank.",    available: false },
  { id: "tournament",  label: "Tournament",      icon: Users,   desc: "Join weekly championships and bracket tournaments.",    available: false },
];

const DIFFICULTIES = [
  { id: "easy",   label: "Warmup",    desc: "Ages 8-10 · Arithmetic & basic percentages",  color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  { id: "medium", label: "Contender", desc: "Ages 11-13 · Ratios, algebra & statistics",   color: "border-blue-200 bg-blue-50 text-blue-800" },
  { id: "hard",   label: "Champion",  desc: "Ages 14-16 · Geometry & probability",         color: "border-violet-200 bg-violet-50 text-violet-800" },
  { id: "expert", label: "Legend",    desc: "Ages 16+ · All topics, maximum difficulty",   color: "border-red-200 bg-red-50 text-red-800" },
] as const;

const TOPICS = ["arithmetic", "algebra", "percentages", "ratios", "statistics", "probability", "geometry"];

export default function Arena() {
  const [, nav] = useLocation();
  const [mode, setMode]         = useState("practice");
  const [difficulty, setDiff]   = useState("medium");
  const [topics, setTopics]     = useState<string[]>([]);
  const createMatch = useCreateMatch();

  function toggleTopic(t: string) {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function startMatch() {
    try {
      const match = await createMatch.mutateAsync({
        data: { studentId: 1, mode, difficulty, topics: topics.length > 0 ? topics : undefined },
      });
      nav(`/match?id=${match.id}`);
    } catch {
      nav(`/match?mode=${mode}&difficulty=${difficulty}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Enter the Arena</h1>
        <p className="text-muted-foreground text-sm">Choose your mode and difficulty. Step through the ropes.</p>
      </div>

      {/* Mode selection */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Match Mode</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MODES.map(({ id, label, icon: Icon, desc, available }) => (
            <button
              key={id}
              onClick={() => available && setMode(id)}
              className={cn(
                "relative rounded-xl border-2 p-4 text-left transition-all",
                available ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed opacity-50",
                mode === id && available ? "border-primary bg-primary/5 shadow-md" : "border-border bg-white"
              )}
            >
              {!available && <Lock className="absolute top-3 right-3 w-3 h-3 text-muted-foreground" />}
              <Icon className={cn("w-5 h-5 mb-3", mode === id && available ? "text-primary" : "text-muted-foreground")} />
              <div className={cn("text-sm font-bold mb-1", mode === id && available ? "text-primary" : "text-foreground")}>{label}</div>
              <div className="text-xs text-muted-foreground leading-tight">{desc}</div>
              {!available && <span className="text-xs text-muted-foreground font-medium">Coming soon</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Difficulty</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DIFFICULTIES.map(({ id, label, desc, color }) => (
            <button
              key={id}
              onClick={() => setDiff(id)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all hover:shadow-md cursor-pointer",
                difficulty === id ? `${color} border-current shadow-md` : "border-border bg-white"
              )}
            >
              <div className={cn("text-sm font-bold mb-1", difficulty === id ? "" : "text-foreground")}>{label}</div>
              <div className={cn("text-xs leading-tight", difficulty === id ? "opacity-70" : "text-muted-foreground")}>
                {desc ?? ""}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Topics <span className="normal-case font-normal">(optional — all topics if none selected)</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(t => (
            <button
              key={t}
              onClick={() => toggleTopic(t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize",
                topics.includes(t)
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div>
          <div className="font-bold text-foreground capitalize">{mode} · {difficulty}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {topics.length > 0 ? topics.join(", ") : "All topics"} · 5 rounds
          </div>
        </div>
        <button
          onClick={startMatch}
          disabled={createMatch.isPending}
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-md"
        >
          {createMatch.isPending ? "Preparing..." : "Start Match"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
