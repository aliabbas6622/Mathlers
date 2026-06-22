import { Link } from "wouter";
import { useGetStudentMastery, useGetStudentStats, useGetTopicBreakdown } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, Minus, Clock, Target, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const STUDENT_ID = 1;
const TOPICS = ["arithmetic", "algebra", "percentages", "ratios", "statistics", "probability", "geometry"];
const TOPIC_COLORS: Record<string, string> = {
  arithmetic:   "bg-blue-500",
  algebra:      "bg-violet-500",
  percentages:  "bg-emerald-500",
  ratios:       "bg-orange-500",
  statistics:   "bg-pink-500",
  probability:  "bg-cyan-500",
  geometry:     "bg-yellow-500",
};

function MasteryBar({ mastery }: { mastery: number }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${mastery}%` }} />
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up")   return <TrendingUp   className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === "down") return <TrendingDown  className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function Training() {
  const { data: mastery = [] } = useGetStudentMastery(STUDENT_ID);
  const { data: stats }        = useGetStudentStats(STUDENT_ID);
  const { data: breakdown = [] } = useGetTopicBreakdown();

  const masteryMap = Object.fromEntries(mastery.map(m => [m.topic, m]));

  const chartData = breakdown.map(b => ({
    name: b.topic.slice(0, 5),
    accuracy: Math.round(b.accuracy * 100),
    attempts: b.totalAttempts,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Training Room</h1>
          <p className="text-sm text-muted-foreground">Track your mastery across every math topic</p>
        </div>
        <Link href="/arena" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors">
          <Target className="w-4 h-4" /> Practice Now
        </Link>
      </div>

      {/* Overview stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Questions Solved",  value: stats.totalQuestions },
            { label: "Correct Answers",   value: stats.correctAnswers },
            { label: "Overall Accuracy",  value: `${((stats.accuracy ?? 0) * 100).toFixed(1)}%` },
            { label: "Avg Response Time", value: `${(stats.avgResponseTime ?? 0).toFixed(1)}s` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-xs text-center">
              <div className="text-xl font-black text-foreground tabular-nums">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic mastery cards */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-wide text-muted-foreground mb-4">Topic Mastery</h2>
          {TOPICS.map(topic => {
            const m = masteryMap[topic];
            return (
              <div key={topic} className="rounded-xl border border-border bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", TOPIC_COLORS[topic])} />
                    <span className="font-semibold text-sm text-foreground capitalize">{topic}</span>
                    {m && <TrendIcon trend={m.trend} />}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {m && (
                      <>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.avgResponseTime.toFixed(1)}s</span>
                        <span>{m.questionsAttempted} questions</span>
                        <span className="font-bold text-foreground">{Math.round(m.mastery)}%</span>
                      </>
                    )}
                    {!m && <span className="text-muted-foreground/60">No data yet</span>}
                  </div>
                </div>
                <MasteryBar mastery={m?.mastery ?? 0} />
                {m && (
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Accuracy: {(m.accuracy * 100).toFixed(0)}%</span>
                    <Link href={`/arena?topic=${topic}`} className="text-primary font-semibold hover:underline flex items-center gap-1">
                      Practice <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Accuracy chart */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-xs h-fit">
          <h2 className="font-bold text-sm text-foreground mb-4">Accuracy by Topic</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={40} />
                <Tooltip formatter={(v) => [`${v}%`, "Accuracy"]} />
                <Bar dataKey="accuracy" fill="hsl(348 80% 54%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm text-center">
              Complete matches to see accuracy data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
