"use client"

import { MasteryChart } from "./MasteryChart"
import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { LoadingSpinner } from "@/components/states/LoadingSpinner"
import { ErrorState } from "@/components/states/ErrorState"
import { EmptyState } from "@/components/states/EmptyState"
import { ArrowUpRight, Clock, Target, Zap } from "lucide-react"
import { useMasteryData } from "./useMasteryData"

export default function MasteryPage() {
  const { mastery, isLoading, isError, refetch } = useMasteryData()

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorState onRetry={refetch} />
  if (!mastery || mastery.length === 0) return <EmptyState title="No Mastery Data" />

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Training Center</h1>
          <p className="text-slate-500">Analyze your performance and sharpen your skills.</p>
        </div>
        <Button>Start Training</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <MetricCard icon={<Target className="text-emerald-500" />} label="Overall Mastery" value="72.8%" trend="+3.2%" />
        <MetricCard icon={<Clock className="text-blue-500" />} label="Avg Response" value="4.2s" trend="-0.8s" />
        <MetricCard icon={<Zap className="text-amber-500" />} label="Power Rating" value="850" trend="+120" />
      </div>

      <div className="arena-card p-8 bg-white">
        <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          Topic Proficiency
          <Badge variant="outline">Last 30 Days</Badge>
        </h2>
        <MasteryChart data={mastery} />
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Training Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecommendationCard
            topic="Probability"
            reason="Weakest topic"
            difficulty="Medium"
          />
          <RecommendationCard
            topic="Ratios"
            reason="Declining accuracy"
            difficulty="Hard"
          />
        </div>
      </section>
    </div>
  )
}

function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="arena-card p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <span className={`text-xs font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-amber-500'}`}>
          {trend}
        </span>
      </div>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function RecommendationCard({ topic, reason, difficulty }: { topic: string, reason: string, difficulty: string }) {
  return (
    <div className="arena-card p-6 flex justify-between items-center bg-white group cursor-pointer hover:border-emerald-200">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
          <Zap className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
        </div>
        <div>
          <p className="font-bold text-slate-900">{topic}</p>
          <p className="text-xs text-slate-400">{reason} • {difficulty} Difficulty</p>
        </div>
      </div>
      <ArrowUpRight className="text-slate-300 group-hover:text-emerald-500" />
    </div>
  )
}
