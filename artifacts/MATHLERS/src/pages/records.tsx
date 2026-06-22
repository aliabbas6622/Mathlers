import { useState } from "react";
import { useListRecordCards, useGetRecordCardStats } from "@workspace/api-client-react";
import { RecordCardDisplay } from "@/components/RecordCardDisplay";
import { Search, Filter } from "lucide-react";

const CATEGORIES = ["all", "esports", "sports", "gaming", "science", "entertainment"];
const DIFFICULTIES = ["all", "easy", "medium", "hard", "expert"];

export default function Records() {
  const [category, setCategory]   = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(0);
  const PAGE_SIZE = 12;

  const { data: cards = [], isLoading } = useListRecordCards({
    category:   category !== "all"   ? category   : undefined,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const { data: stats } = useGetRecordCardStats();

  const filtered = search
    ? cards.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || (c.holder ?? "").toLowerCase().includes(search.toLowerCase()))
    : cards;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground mb-1">Record Card Library</h1>
        <p className="text-sm text-muted-foreground">
          {stats ? `${stats.total.toLocaleString()} real-world records powering Mathlers questions` : "Real-world records powering every question"}
        </p>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-muted/40 border border-border">
          {stats.byCategory.map(cat => (
            <div key={cat.category} className="text-center">
              <div className="text-base font-black text-foreground tabular-nums">{cat.count}</div>
              <div className="text-xs text-muted-foreground capitalize">{cat.category}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search records..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setPage(0); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all capitalize ${category === c ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground hover:border-primary/40"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground self-center" />
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => { setDifficulty(d); setPage(0); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${difficulty === d ? "bg-foreground text-white border-foreground" : "bg-white border-border text-muted-foreground hover:border-foreground/30"}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">No records found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(card => <RecordCardDisplay key={card.id} card={card} />)}
          </div>
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors">
              Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < PAGE_SIZE}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors">
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
