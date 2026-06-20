"use client"

import { useUserStore } from "@/stores/useUserStore"
import Link from "next/link"
import { Sword, Target, Trophy, Settings } from "lucide-react"
import { usePathname } from "next/navigation"

export function Navigation() {
  const { user } = useUserStore()
  const pathname = usePathname()

  const navItems = [
    { label: "Dashboard", icon: <Target className="w-5 h-5" />, href: "/" },
    { label: "Arena", icon: <Sword className="w-5 h-5" />, href: "/arena" },
    { label: "Training", icon: <Trophy className="w-5 h-5" />, href: "/training" },
  ]

  if (!user) return null

  return (
    <nav className="h-16 bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-xl italic group-hover:bg-emerald-700 transition-colors">M</div>
            <span className="font-black text-xl tracking-tighter text-slate-900">MATHLERS</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  pathname === item.href
                    ? 'bg-slate-50 text-emerald-600'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-black text-slate-900 leading-none">{user.username}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.belt} Belt</span>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">
            <Settings className="w-5 h-5" />
          </div>
        </div>
      </div>
    </nav>
  )
}
