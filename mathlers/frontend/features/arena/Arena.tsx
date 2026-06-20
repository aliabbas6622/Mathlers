"use client"

import { useState } from "react"
import { Button } from "@/components/Button"
import { RecordCard } from "@/components/RecordCard"
import { Progress } from "@/components/Progress"
import { LoadingSpinner } from "@/components/states/LoadingSpinner"
import { ErrorState } from "@/components/states/ErrorState"
import { EmptyState } from "@/components/states/EmptyState"
import { Timer, Trophy, Zap, Info, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useArenaData } from "./useArenaData"

export default function ArenaPage() {
  const { question, isLoading, isError, refetch } = useArenaData()
  const [currentRound, setCurrentRound] = useState("Jab")
  const [timeLeft, setTimeLeft] = useState(45)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showSolution, setShowSolution] = useState(false)

  const rounds = ["Warm-up", "Jab", "Hook", "Uppercut", "Knockout"]
  const currentRoundIndex = rounds.indexOf(currentRound)

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorState onRetry={refetch} />
  if (!question) return <EmptyState title="No Questions" />

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Arena Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Round</span>
              <span className="text-xl font-black text-slate-900">{currentRound}</span>
            </div>
            <div className="flex gap-1">
              {rounds.map((r, i) => (
                <div
                  key={r}
                  className={`w-8 h-1.5 rounded-full ${i <= currentRoundIndex ? 'bg-emerald-500' : 'bg-slate-100'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time</span>
              <div className="flex items-center gap-2 text-xl font-black text-slate-900">
                <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                {timeLeft}s
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Score</span>
              <span className="text-xl font-black text-slate-900">12,450</span>
            </div>
          </div>
        </div>
        <Progress value={(currentRoundIndex + 1) * 20} className="h-1 rounded-none" />
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Question Area */}
          <div className="lg:col-span-3 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                    {question.question_text}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {question.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOption(option.id)}
                      className={`w-full p-6 text-left rounded-2xl border-2 transition-all font-bold text-lg ${
                        selectedOption === option.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button
                    className="flex-1 py-6 text-xl rounded-2xl"
                    disabled={!selectedOption}
                    onClick={() => setShowSolution(true)}
                  >
                    Submit Punch
                  </Button>
                  <Button variant="outline" className="px-6 rounded-2xl">
                    <Info className="w-6 h-6" />
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Context Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {question.record_card && (
              <RecordCard {...question.record_card} />
            )}

            <div className="arena-card p-6 bg-slate-900 text-white border-none shadow-xl shadow-slate-900/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold">Match Intel</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                You're currently on a <span className="text-white font-black">5x Combo</span>.
                Answer this correctly in the next <span className="text-white font-black">15 seconds</span> to unlock the <span className="text-emerald-400 font-black">Speed Demon</span> badge!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Solution Modal Overlay */}
      <AnimatePresence>
        {showSolution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">KNOCKOUT!</h3>
                  <p className="text-sm text-slate-500">Correct!</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                <p className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Champion's Playbook</p>
                <div className="space-y-4">
                  {question.solution_steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                      <p className="text-sm text-slate-600">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full py-4 rounded-2xl" onClick={() => setShowSolution(false)}>
                Next Round <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
