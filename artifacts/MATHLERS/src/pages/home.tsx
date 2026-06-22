import { Link } from "wouter";
import { Shield, Trophy, Zap, ChevronRight, Star, Target, Users } from "lucide-react";
import { useGetRecordCardStats, useListRecordCards } from "@workspace/api-client-react";
import { RecordCardDisplay } from "@/components/RecordCardDisplay";
import { BeltBadge } from "@/components/BeltBadge";

const BELT_RANKS = ["bronze", "silver", "gold", "platinum", "diamond", "champion", "legend"];

const FEATURES = [
  { icon: Zap,    title: "Real-World Records",  desc: "Every question is powered by genuine world records from esports, sports, science, and more." },
  { icon: Shield, title: "Boxing Ring Format",   desc: "5 rounds — Warmup, Jab, Hook, Uppercut, Knockout. Each round raises the stakes." },
  { icon: Trophy, title: "ELO Ranking System",   desc: "Compete, climb the ranks, earn championship belts, and dominate the global leaderboard." },
  { icon: Target, title: "Adaptive Difficulty",  desc: "The AI adjusts question difficulty in real time based on your performance and mastery." },
];

export default function Home() {
  const { data: stats } = useGetRecordCardStats();
  const { data: cards } = useListRecordCards({ limit: 3 });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-red-50">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(348 80% 54%) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-6">
              <Zap className="w-3 h-3" /> AI-Powered Math Competition Platform
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-foreground leading-tight tracking-tight">
              Math is a <span className="text-primary">Sport.</span><br />
              Enter the Arena.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Mathlers transforms mathematics into a boxing-ring competition. Solve questions built from real-world records. Climb the ranks. Earn your Championship Belt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/arena" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors shadow-md">
                Enter the Arena <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-white border border-border text-foreground px-6 py-3 rounded-lg font-semibold text-sm hover:bg-muted transition-colors">
                View Dashboard
              </Link>
            </div>
            {stats && (
              <div className="mt-10 flex gap-8">
                <div>
                  <div className="text-2xl font-black text-foreground">{stats.total.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Record Cards</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground">{stats.recentlyAdded}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Added This Week</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground">7</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Belt Ranks</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Belt ranks */}
      <section className="bg-white border-y border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground mr-2">BELT RANKS:</span>
            {BELT_RANKS.map(b => <BeltBadge key={b} belt={b} />)}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-black text-foreground mb-8 text-center">How Mathlers Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border p-5 bg-white hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-2">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample record cards */}
      {cards && cards.length > 0 && (
        <section className="bg-muted/40 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-foreground">Sample Record Cards</h2>
              <Link href="/records" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {cards.map(card => <RecordCardDisplay key={card.id} card={card} />)}
            </div>
          </div>
        </section>
      )}

      {/* Round breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-black text-foreground mb-8 text-center">The 5 Rounds of a Match</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {["Warmup", "Jab", "Hook", "Uppercut", "Knockout"].map((round, i) => (
            <div key={round} className="flex-1 rounded-xl border-2 border-border p-4 text-center">
              <div className="text-2xl font-black text-primary mb-1">R{i + 1}</div>
              <div className="font-bold text-sm text-foreground">{round}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {["Ease in", "Pick up pace", "Mid-range", "Advanced", "Hardest round"][i]}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <Users className="w-10 h-10 text-white/60 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Ready to Enter the Arena?</h2>
          <p className="text-white/70 max-w-md mx-auto mb-8 text-sm">Start competing, climb the leaderboard, and prove that math is your sport.</p>
          <Link href="/arena" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-bold text-sm hover:bg-white/90 transition-colors shadow-lg">
            Enter the Arena <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
