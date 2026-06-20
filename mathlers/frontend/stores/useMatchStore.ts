import { create } from 'zustand'

interface MatchState {
  score: number
  combo: number
  currentRoundIndex: number
  timeLeft: number
  isMatchActive: boolean

  actions: {
    startMatch: () => void
    endMatch: () => void
    tick: () => void
    addScore: (points: number) => void
    incrementCombo: () => void
    resetCombo: () => void
    nextRound: () => void
  }
}

export const useMatchStore = create<MatchState>((set) => ({
  score: 0,
  combo: 1,
  currentRoundIndex: 0,
  timeLeft: 60,
  isMatchActive: false,

  actions: {
    startMatch: () => set({ isMatchActive: true, score: 0, combo: 1, currentRoundIndex: 0, timeLeft: 60 }),
    endMatch: () => set({ isMatchActive: false }),
    tick: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
    addScore: (points) => set((state) => ({ score: state.score + points * state.combo })),
    incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),
    resetCombo: () => set({ combo: 1 }),
    nextRound: () => set((state) => ({ currentRoundIndex: state.currentRoundIndex + 1, timeLeft: 60 })),
  }
}))
