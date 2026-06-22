import { useState } from "react";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { BeltBadge } from "@/components/BeltBadge";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = ["daily", "weekly", "monthly", "all-time"] as const;
const SCOPES  = ["global", "school", "class", "age-group"] as const;

type Period = typeof PERIODS[number];
type Scope  = typeof SCOPES[number];

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [scope,  setScope]  = useState<Scope>("global");

  const { data: entries = [], isLoading } = useGetLeaderboard({ period, scope, limit: 50 });

  const topThree = entries.slice(0, 3);
  const rest      = entries.slice(3);

  function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground tabular-nums w-4 text-center">{rank}</span>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground mb-1">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Champions ranked by ELO and performance</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all",
                period === p ? "bg-white text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {SCOPES.map(s => (
            <button key={s} onClick={() => setScope(s)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all",
                scope === s ? "bg-white text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No rankings yet. Be the first to compete!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {topThree.length > 0 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((entry, i) => {
                const heights  = ["h-24", "h-32", "h-20"];
                const podiumPos = [2, 1, 3];
                return (
                  <div key={entry!.studentId} className="flex flex-col items-center gap-2">
                    <div className="text-center mb-1">
                      <div className="font-bold text-sm text-foreground">{entry!.displayName}</div>
                      <BeltBadge belt={entry!.belt} size="sm" />
                      <div className="text-xs text-muted-foreground mt-1 font-semibold">{entry!.elo} ELO</div>
                    </div>
                    <div className={cn("w-20 rounded-t-lg flex items-start justify-center pt-2", heights[i],
                      i === 1 ? "bg-yellow-400" : i === 0 ? "bg-slate-300" : "bg-amber-600")}>
                      <span className="text-white font-black text-lg">#{podiumPos[i]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-xs">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-12">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Student</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">ELO</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden sm:table-cell">Win Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden md:table-cell">Matches</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={entry.studentId} className={cn("border-b border-border last:border-0 hover:bg-muted/20 transition-colors", idx < 3 && "bg-yellow-50/30")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <RankIcon rank={entry.rank} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {entry.displayName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">{entry.displayName}</div>
                          <BeltBadge belt={entry.belt} size="sm" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{entry.elo}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden sm:table-cell">
                      {(entry.winRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden md:table-cell">{entry.totalMatches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
