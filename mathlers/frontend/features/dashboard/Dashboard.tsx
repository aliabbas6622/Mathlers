"use client"

import { Button } from "@/components/Button"
import { RecordCard } from "@/components/RecordCard"
import { Badge } from "@/components/Badge"
import { Progress } from "@/components/Progress"
import { LoadingSpinner } from "@/components/states/LoadingSpinner"
import { ErrorState } from "@/components/states/ErrorState"
import { EmptyState } from "@/components/states/EmptyState"
import { Trophy, Flame, Target, Sword, User } from "lucide-react"
import { useDashboardData } from "./useDashboardData"
import Link from "next/link"

export default function DashboardPage() {
  const { user, records, mastery, isLoading, isError, refetch } = useDashboardData()

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorState onRetry={refetch} />
  if (!user) return <EmptyState title="User Not Found" />

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back, {user.username}.</h1>
          <div className="flex items-center gap-4">
            <Badge variant="success" className="px-3 py-1">{user.belt} Belt</Badge>
            <span className="text-sm text-slate-400 font-medium">ELO Rating: <span className="text-slate-900">{user.elo}</span></span>
          </div>
        </div>
        <Link href="/arena">
          <Button size="lg" className="rounded-2xl px-10 shadow-xl shadow-emerald-500/20">
            Enter Arena
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={<Flame className="text-orange-500" />} label="Streak" value={`${user.streak} Days`} />
            <StatCard icon={<Target className="text-blue-500" />} label="Accuracy" value="94.2%" />
            <StatCard icon={<Sword className="text-red-500" />} label="Matches" value="158" />
          </div>

          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Topic Mastery</h2>
              <Link href="/training"><Button variant="ghost" size="sm">View All</Button></Link>
            </div>
            {!mastery || mastery.length === 0 ? (
              <EmptyState description="No mastery data available yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mastery.map((m) => (
                  <MasteryItem key={m.topic} topic={m.topic} mastery={m.mastery} trend={m.trend} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Records</h2>
            {!records || records.length === 0 ? (
              <EmptyState description="No records found." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {records.map((r) => (
                  <RecordCard key={r.id} {...r} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="arena-card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Daily Leaderboard
            </h2>
            <div className="space-y-4">
              <LeaderboardRow rank={1} name="CyberPunch" elo={3120} belt="Champion" />
              <LeaderboardRow rank={2} name="MathDojo" elo={2950} belt="Black" />
              <LeaderboardRow rank={3} name="SpeedSolver" elo={2810} belt="Black" />
              <div className="pt-4 border-t border-slate-50">
                <LeaderboardRow rank={42} name="You" elo={user.elo} belt={user.belt} isUser />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="arena-card p-6 flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function MasteryItem({ topic, mastery, trend }: { topic: string, mastery: number, trend: string }) {
  return (
    <div className="arena-card p-5">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{topic}</p>
          <p className={`text-[10px] font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{trend}</p>
        </div>
        <span className="text-lg font-black text-slate-900">{mastery}%</span>
      </div>
      <Progress value={mastery} />
    </div>
  )
}

function LeaderboardRow({ rank, name, elo, belt, isUser = false }: { rank: number, name: string, elo: number, belt: string, isUser?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-2 rounded-lg ${isUser ? 'bg-emerald-50/50' : ''}`}>
      <span className="w-6 text-xs font-black text-slate-400">#{rank}</span>
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        <User className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">{name}</p>
        <p className="text-[10px] text-slate-400">{belt} Belt</p>
      </div>
      <span className="text-sm font-black text-slate-900">{elo}</span>
    </div>
  )
}
