import { create } from 'zustand'

interface UserState {
  user: {
    id: string
    username: string
    belt: string
    elo: number
    streak: number
  } | null

  isAuthenticated: boolean

  actions: {
    setUser: (user: any) => void
    logout: () => void
  }
}

export const useUserStore = create<UserState>((set) => ({
  user: {
    id: "usr_123",
    username: "MathChamp2026",
    belt: "Green",
    elo: 1450,
    streak: 12
  },
  isAuthenticated: true,

  actions: {
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    logout: () => set({ user: null, isAuthenticated: false }),
  }
}))
