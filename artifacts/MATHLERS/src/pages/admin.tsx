import { useGetAnalyticsOverview, useGetPerformanceTrend, useGetTopicBreakdown, useGetDifficultyDistribution, useListProviders, useGetProviderUsage } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Users, Target, Zap, BookOpen, CheckCircle, XCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Admin() {
  const { data: overview }     = useGetAnalyticsOverview();
  const { data: trend = [] }   = useGetPerformanceTrend({ days: 30 });
  const { data: topics = [] }  = useGetTopicBreakdown();
  const { data: providers = [] } = useListProviders();
  const { data: provUsage }    = useGetProviderUsage();

  const topicChartData = topics.map(t => ({
    topic: t.topic.slice(0, 5),
    accuracy: Math.round(t.accuracy * 100),
    attempts: t.totalAttempts,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform analytics and system management</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/students" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm">
            Student Controls
          </Link>
          <Link href="/admin/records" className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">
            Manage Records
          </Link>
        </div>
      </div>

      {/* Overview stats */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users,    label: "Total Students",    value: overview.totalStudents.toLocaleString() },
            { icon: Zap,      label: "Total Matches",     value: overview.totalMatches.toLocaleString() },
            { icon: BookOpen, label: "Questions",          value: overview.totalQuestions.toLocaleString() },
            { icon: Target,   label: "Avg Accuracy",      value: `${((overview.avgAccuracy ?? 0) * 100).toFixed(1)}%` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary opacity-70" />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
              <div className="text-2xl font-black text-foreground tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance trend */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-xs">
          <h2 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> 30-Day Performance Trend
          </h2>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  type="monotone" dataKey="matchesPlayed" stroke="hsl(348 80% 54%)" strokeWidth={2} dot={false} name="Matches" />
                <Line yAxisId="right" type="monotone" dataKey="avgAccuracy"   stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} name="Accuracy" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No trend data yet</div>
          )}
        </div>

        {/* Topic breakdown */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-xs">
          <h2 className="font-bold text-sm text-foreground mb-4">Topic Accuracy Breakdown</h2>
          {topicChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topicChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="topic" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, "Accuracy"]} />
                <Bar dataKey="accuracy" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No topic data yet</div>
          )}
        </div>
      </div>

      {/* LLM Providers */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm text-foreground">LLM Provider Status</h2>
          {provUsage && (
            <div className="text-xs text-muted-foreground">
              {provUsage.successfulRequests}/{provUsage.totalRequests} successful requests
            </div>
          )}
        </div>
        {providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No providers configured</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {providers.map(p => (
              <div key={p.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-foreground">{p.name}</span>
                  <div className="flex items-center gap-1.5">
                    {p.status === "active"
                      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    <span className={cn("text-xs font-medium", p.status === "active" ? "text-emerald-600" : "text-red-500")}>{p.status}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{p.model}</div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.requestCount} requests</span>
                  <span className="text-muted-foreground">{p.avgLatencyMs?.toFixed(0) ?? "—"}ms avg</span>
                  <span className={cn("font-medium", p.errorRate > 0.1 ? "text-red-500" : "text-emerald-600")}>
                    {(p.errorRate * 100).toFixed(1)}% err
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick overview tiles */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
            <div className="text-xs text-muted-foreground mb-1">Active Today</div>
            <div className="text-xl font-black text-foreground">{overview.activeToday}</div>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
            <div className="text-xs text-muted-foreground mb-1">Questions Generated Today</div>
            <div className="text-xl font-black text-foreground">{overview.questionsGeneratedToday}</div>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
            <div className="text-xs text-muted-foreground mb-1">Top Category</div>
            <div className="text-xl font-black text-foreground capitalize">{overview.topCategory ?? "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
