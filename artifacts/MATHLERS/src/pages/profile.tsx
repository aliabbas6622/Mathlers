import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetStudent, useGetStudentStats, useGetStudentMastery, useListMatches } from "@workspace/api-client-react";
import { BeltBadge } from "@/components/BeltBadge";
import { Trophy, Flame, Target, Zap, CheckCircle, XCircle, Edit2, MapPin, School, Calendar, Hash, Star, Award, TrendingUp, Clock, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const STUDENT_ID = 1;

const ACHIEVEMENTS = [
  { id: "first_match",   icon: "🥊", label: "First Fight",    desc: "Complete your first match",        condition: (s: any) => s.totalMatches >= 1 },
  { id: "win_streak_3",  icon: "🔥", label: "Hat Trick",      desc: "Win 3 matches in a row",           condition: (s: any) => s.streak >= 3 },
  { id: "win_streak_5",  icon: "⚡", label: "On Fire",        desc: "Win 5 matches in a row",           condition: (s: any) => s.streak >= 5 },
  { id: "ten_matches",   icon: "🏅", label: "Veteran",        desc: "Complete 10 matches",              condition: (s: any) => s.totalMatches >= 10 },
  { id: "silver_belt",   icon: "🥈", label: "Silver Ranked",  desc: "Reach Silver belt",                condition: (s: any) => ["silver","gold","platinum","diamond","champion","legend"].includes(s.belt) },
  { id: "gold_belt",     icon: "🥇", label: "Gold Ranked",    desc: "Reach Gold belt",                  condition: (s: any) => ["gold","platinum","diamond","champion","legend"].includes(s.belt) },
  { id: "accuracy_80",   icon: "🎯", label: "Sharpshooter",   desc: "Achieve 80%+ overall accuracy",    condition: (_: any, st: any) => (st?.accuracy ?? 0) >= 0.8 },
  { id: "elo_1200",      icon: "📈", label: "Rising Star",    desc: "Reach 1200 ELO",                   condition: (s: any) => s.elo >= 1200 },
  { id: "perfect",       icon: "💎", label: "Perfect Round",  desc: "100% accuracy overall",            condition: (_: any, st: any) => (st?.accuracy ?? 0) >= 1.0 },
  { id: "twenty_wins",   icon: "🏆", label: "Champion",       desc: "Win 20 matches",                   condition: (s: any) => s.totalWins >= 20 },
];

const MASTERY_COLORS: Record<string, string> = {
  arithmetic: "bg-blue-500", algebra: "bg-violet-500", percentages: "bg-emerald-500",
  ratios: "bg-orange-500", statistics: "bg-rose-500", probability: "bg-amber-500", geometry: "bg-teal-500",
};

const GRADE_OPTIONS = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","University"];
const AGE_GROUPS    = ["8-10","11-13","14-16","16+"];

const TOPICS = ["arithmetic","algebra","percentages","ratios","statistics","probability","geometry"];

export default function Profile() {
  const { data: student, refetch } = useGetStudent(STUDENT_ID);
  const { data: stats }            = useGetStudentStats(STUDENT_ID);
  const { data: mastery = [] }     = useGetStudentMastery(STUDENT_ID);
  const { data: allMatches = [] }  = useListMatches({ studentId: STUDENT_ID, limit: 20 });
  const matches = allMatches as any[];

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState<"overview"|"mastery"|"history"|"achievements">("overview");

  function openEdit() {
    setForm({
      displayName:    student?.displayName  ?? "",
      school:         (student as any)?.school ?? "",
      city:           (student as any)?.city ?? "",
      country:        (student as any)?.country ?? "",
      grade:          (student as any)?.grade ?? "",
      ageGroup:       student?.ageGroup ?? "11-13",
      parentEmail:    (student as any)?.parentEmail ?? "",
      favoriteTopics: student?.favoriteTopics ?? [],
    });
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await fetch(`/api/students/${STUDENT_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await refetch();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function toggleTopic(t: string) {
    setForm((f: any) => ({
      ...f,
      favoriteTopics: f.favoriteTopics.includes(t)
        ? f.favoriteTopics.filter((x: string) => x !== t)
        : [...f.favoriteTopics, t],
    }));
  }

  const earned = ACHIEVEMENTS.filter(a => student && a.condition(student, stats));
  const locked = ACHIEVEMENTS.filter(a => !earned.includes(a));
  const winRate = student && student.totalMatches > 0
    ? Math.round((student.totalWins / student.totalMatches) * 100) : 0;
  const s = student as any;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">

      {/* ── Header card ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-white p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
              <span className="text-3xl font-black text-primary">{s?.displayName?.[0]?.toUpperCase() ?? "?"}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs">✓</div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-foreground">{s?.displayName ?? "Champion"}</h1>
              {s && <BeltBadge belt={s.belt} size="lg" />}
              {s?.status && s.status !== "active" && (
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold",
                  s.status === "restricted" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                  {s.status}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
              <span className="font-mono text-xs">@{s?.username}</span>
              {s?.ageGroup && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Age {s.ageGroup}</span>}
              {s?.grade && <span className="font-medium text-foreground">{s.grade}</span>}
              {s?.school && <span className="flex items-center gap-1"><School className="w-3.5 h-3.5" />{s.school}</span>}
              {s?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{s.city}{s.country && s.country !== "Unknown" ? `, ${s.country}` : ""}</span>}
            </div>
            {s?.favoriteTopics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {s.favoriteTopics.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <div className="text-3xl font-black text-foreground tabular-nums">{s?.elo ?? 1000}</div>
              <div className="text-xs text-muted-foreground font-medium">ELO Rating</div>
            </div>
            {s?.enrollmentCode && (
              <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5">
                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-mono text-xs font-black tracking-widest text-foreground">{s.enrollmentCode}</span>
              </div>
            )}
            <button onClick={openEdit} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Flame,       label: "Streak",     value: stats?.currentStreak ?? s?.streak ?? 0, sub: "matches" },
          { icon: Trophy,      label: "ELO Rating", value: s?.elo ?? 1000 },
          { icon: Target,      label: "Accuracy",   value: `${((stats?.accuracy ?? 0) * 100).toFixed(1)}%` },
          { icon: CheckCircle, label: "Win Rate",   value: `${winRate}%`, sub: `${s?.totalWins ?? 0} wins` },
        ].map(({ icon: Icon, label, value, sub }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl border border-border bg-white p-4 shadow-sm text-center">
            <Icon className="w-5 h-5 text-primary mx-auto mb-2 opacity-70" />
            <div className="text-2xl font-black text-foreground tabular-nums">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</div>
            {sub && <div className="text-xs text-primary font-semibold mt-0.5">{sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl overflow-x-auto">
        {(["overview","mastery","history","achievements"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
              activeTab === tab ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab}{tab === "achievements" ? ` (${earned.length}/${ACHIEVEMENTS.length})` : ""}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {activeTab === "overview" && (
          <motion.div key="ov" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 gap-6">
            {/* Performance */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Performance</h2>
              <div className="space-y-2.5 text-sm">
                {[
                  ["Matches Played", s?.totalMatches ?? 0],
                  ["Wins",           s?.totalWins ?? 0],
                  ["Win Rate",       `${winRate}%`],
                  ["Questions Done", stats?.totalQuestions ?? 0],
                  ["Correct",        stats?.correctAnswers ?? 0],
                  ["Best Streak",    stats?.longestStreak ?? 0],
                  ["Avg Response",   stats?.avgResponseTime ? `${stats.avgResponseTime.toFixed(1)}s` : "—"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-bold text-foreground tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Student ID card */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-primary" />Student ID Card</h2>
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary/75 text-white p-5 select-none">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs opacity-60 font-medium uppercase tracking-wider mb-0.5">Mathlers Student</div>
                    <div className="font-black text-lg leading-tight">{s?.displayName ?? "—"}</div>
                    <div className="text-xs opacity-70 font-mono mt-0.5">@{s?.username}</div>
                  </div>
                  <span className="text-3xl">🥊</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
                  {[
                    ["Grade",     s?.grade ?? "—"],
                    ["Age Group", s?.ageGroup ?? "—"],
                    ["School",    s?.school ?? "Independent"],
                    ["City",      s?.city ?? "—"],
                  ].map(([k, v]) => (
                    <div key={k}><div className="opacity-50 mb-0.5">{k}</div><div className="font-semibold truncate">{v}</div></div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-white/20 pt-3">
                  <div className="text-xs"><div className="opacity-50 text-[10px]">ELO</div><div className="font-black text-xl tabular-nums">{s?.elo ?? 1000}</div></div>
                  <BeltBadge belt={s?.belt ?? "bronze"} size="md" />
                  {s?.enrollmentCode && (
                    <div className="text-right"><div className="opacity-50 text-[10px] mb-0.5">STUDENT ID</div><div className="font-mono font-bold text-sm tracking-widest">{s.enrollmentCode}</div></div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "mastery" && (
          <motion.div key="ma" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-sm mb-5 flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Topic Mastery</h2>
              <div className="space-y-5">
                {mastery.map((m, i) => (
                  <motion.div key={m.topic} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-sm font-semibold">{m.topic}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full text-white font-bold",
                          m.trend === "up" ? "bg-emerald-500" : m.trend === "down" ? "bg-red-400" : "bg-muted-foreground/50")}>
                          {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-3">
                        <span>{m.questionsAttempted} attempts</span>
                        <span className="font-black text-foreground tabular-nums">{Math.round(m.mastery)}%</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", MASTERY_COLORS[m.topic] ?? "bg-primary")}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.mastery}%` }}
                        transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Accuracy: {(m.accuracy * 100).toFixed(0)}%</span>
                      {m.avgResponseTime > 0 && <span>Avg: {m.avgResponseTime.toFixed(1)}s</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div key="hi" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="font-bold text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Match History</h2>
                <span className="text-xs text-muted-foreground">{matches.length} matches</span>
              </div>
              {matches.length === 0
                ? <div className="p-8 text-center text-muted-foreground text-sm">No matches yet — enter the arena!</div>
                : <div className="divide-y divide-border">
                    {matches.map((m: any, i: number) => {
                      const rounds  = (m.rounds ?? []) as any[];
                      const correct = rounds.filter((r: any) => r.correct).length;
                      const won     = rounds.length > 0 && correct >= Math.ceil(rounds.length / 2);
                      return (
                        <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            {m.status === "completed"
                              ? won ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                              : <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground flex-shrink-0" />}
                            <div>
                              <div className="text-sm font-semibold capitalize">
                                {m.mode} · <span className="text-muted-foreground">{m.difficulty}</span>
                                {m.status === "completed" && <span className={cn("ml-2 text-xs font-black", won ? "text-emerald-600" : "text-red-500")}>{won ? "WIN" : "LOSS"}</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {rounds.length > 0 ? `${correct}/${rounds.length} correct` : "In progress"} · {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black tabular-nums">{m.score} pts</div>
                            <div className="text-xs text-muted-foreground">{(Number(m.accuracy) * 100).toFixed(0)}% acc</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>}
            </div>
          </motion.div>
        )}

        {activeTab === "achievements" && (
          <motion.div key="ac" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-sm flex items-center gap-2"><Star className="w-4 h-4 text-primary" />Achievements</h2>
                <span className="text-xs text-muted-foreground font-medium">{earned.length} / {ACHIEVEMENTS.length} unlocked</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[...earned, ...locked].map((a, i) => {
                  const isEarned = earned.includes(a);
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                      className={cn("rounded-xl border-2 p-3 text-center",
                        isEarned ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-45 grayscale")}>
                      <div className="text-2xl mb-1">{a.icon}</div>
                      <div className={cn("text-xs font-bold mb-0.5 leading-tight", isEarned ? "text-foreground" : "text-muted-foreground")}>{a.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{a.desc}</div>
                      {isEarned && <div className="mt-1.5 text-[10px] text-primary font-bold">✓ Earned</div>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setEditing(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-lg">Edit Profile</h2>
                <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                {[
                  { key: "displayName", label: "Display Name *", type: "text" },
                  { key: "school",      label: "School / Institution", type: "text" },
                  { key: "city",        label: "City", type: "text" },
                  { key: "country",     label: "Country", type: "text" },
                  { key: "parentEmail", label: "Parent / Guardian Email", type: "email" },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}</label>
                    <input type={type} value={form[key] ?? ""} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Grade</label>
                    <select value={form.grade ?? ""} onChange={e => setForm((f: any) => ({ ...f, grade: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Select…</option>
                      {GRADE_OPTIONS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Age Group</label>
                    <select value={form.ageGroup ?? "11-13"} onChange={e => setForm((f: any) => ({ ...f, ageGroup: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {AGE_GROUPS.map(g => <option key={g} value={g}>Ages {g}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Favourite Topics</label>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map(t => (
                      <button key={t} type="button" onClick={() => toggleTopic(t)}
                        className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize border-2 transition-all",
                          (form.favoriteTopics ?? []).includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted">Cancel</button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
