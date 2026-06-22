import { Link, useLocation } from "wouter";
import { Trophy, Zap, BarChart3, BookOpen, Shield, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Zap },
  { href: "/arena", label: "Arena", icon: Shield },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/training", label: "Training", icon: BookOpen },
  { href: "/records", label: "Records", icon: BarChart3 },
];

export function NavBar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <img src="/logo.png" alt="Mathlers" className="w-9 h-9 object-contain" />
          <span className="text-foreground">Mathlers</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                location === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded">Admin</Link>
          <Link href="/profile" className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <User className="w-4 h-4 text-primary" />
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                location === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
            <User className="w-4 h-4" />Profile
          </Link>
          <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
            Admin
          </Link>
        </div>
      )}
    </header>
  );
}
