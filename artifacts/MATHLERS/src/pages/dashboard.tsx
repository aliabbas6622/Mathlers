import { Link } from "wouter";
import { useGetDashboard, useGetStudentStats, useGetStudentMastery } from "@workspace/api-client-react";
import { BeltBadge } from "@/components/BeltBadge";
import { Flame, Zap, Trophy, Target, ChevronRight, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const STUDENT_ID = 1;

const TOPIC_SHORT: Record<string, string> = {
  arithmetic: "Arith", algebra: "Algebra", percentages: "Pct",
  ratios: "Ratios", statistics: "Stats", probability: "Prob", geometry: "Geo",
};

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard({ studentId: STUDENT_ID });
  const { data: stats } = useGetStudentStats(STUDENT_ID);
  const { data: mastery } = useGetStudentMastery(STUDENT_ID);

  const radarData = mastery?.map(m => ({
    topic: TOPIC_SHORT[m.topic] ?? m.topic,
    mastery: Math.round(m.mastery),
  })) ?? [];

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const student = dashboard?.student;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-foreground">
              {student ? `Welcome back, ${student.displayName}` : "Dashboard"}
            </h1>
            {student && <BeltBadge belt={student.belt} size="md" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {student ? `ELO ${student.elo} · ${student.ageGroup}` : "Track your progress"}
          </p>
        </div>
        <Link href="/arena" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors shadow-md">
          <Zap className="w-4 h-4" /> Enter Arena
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Flame,       label: "Current Streak",  value: stats?.currentStreak ?? student?.streak ?? 0,  suffix: "days" },
          { icon: Trophy,      label: "ELO Rating",       value: stats?.elo ?? student?.elo ?? 1000,             suffix: "" },
          { icon: Target,      label: "Accuracy",         value: `${((stats?.accuracy ?? 0) * 100).toFixed(1)}`, suffix: "%" },
          { icon: CheckCircle, label: "Win Rate",         value: student && student.totalMatches > 0
              ? `${Math.round((student.totalWins / student.totalMatches) * 100)}` : "0",                         suffix: "%" },
        ].map(({ icon: Icon, label, value, suffix }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <Icon className="w-4 h-4 text-primary opacity-60" />
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {value}<span className="text-sm font-medium text-muted-foreground ml-0.5">{suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic mastery radar */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5 shadow-xs">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Topic Mastery
          </h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Radar name="Mastery" dataKey="mastery" stroke="hsl(348 80% 54%)" fill="hsl(348 80% 54%)" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip formatter={(v) => [`${v}%`, "Mastery"]} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Complete matches to build your mastery map
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mastery?.slice(0, 4).map(m => (
              <div key={m.topic} className="text-center">
                <div className="text-xs text-muted-foreground capitalize mb-1">{m.topic}</div>
                <div className="text-sm font-bold text-foreground">{Math.round(m.mastery)}%</div>
                <div className={`text-xs ${m.trend === "up" ? "text-emerald-600" : m.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                  {m.trend === "up" ? "Improving" : m.trend === "down" ? "Declining" : "Stable"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4">
          {/* Daily challenge */}
          {dashboard?.recommendations?.dailyChallenge && (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-primary text-sm">Daily Challenge</h3>
                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-semibold">
                  {dashboard.recommendations.dailyChallenge.difficulty}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                {dashboard.recommendations.dailyChallenge.scenario}
              </p>
              <Link href="/arena" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                Accept Challenge <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Recent matches */}
          <div className="rounded-xl border border-border bg-white p-4 shadow-xs flex-1">
            <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Recent Matches
            </h3>
            {dashboard?.recentMatches && dashboard.recentMatches.length > 0 ? (
              <div className="flex flex-col gap-2">
                {dashboard.recentMatches.slice(0, 4).map(match => (
                  <div key={match.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div>
                      <div className="text-xs font-semibold text-foreground capitalize">{match.mode}</div>
                      <div className="text-xs text-muted-foreground">{match.difficulty}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{match.score}</div>
                      <div className={`text-xs ${match.status === "completed" ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {(Number(match.accuracy) * 100).toFixed(0)}% acc
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No matches yet — enter the arena to begin.</p>
            )}
          </div>

          {/* Upcoming events */}
          {dashboard?.upcomingEvents && dashboard.upcomingEvents.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <h3 className="font-bold text-foreground text-sm mb-3">Upcoming Events</h3>
              {dashboard.upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{ev.name}</div>
                    <div className="text-xs text-muted-foreground">{ev.participants} participants</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
