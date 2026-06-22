import { useState } from "react";
import { useListRecordCards, useCreateRecordCard, useScrapeRecordCards } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListRecordCardsQueryKey, getGetRecordCardStatsQueryKey } from "@workspace/api-client-react";
import { Plus, RefreshCw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES  = ["esports", "sports", "gaming", "science", "entertainment"];
const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

export default function AdminRecords() {
  const queryClient = useQueryClient();
  const { data: cards = [], isLoading } = useListRecordCards({ limit: 50 });
  const createCard  = useCreateRecordCard();
  const scrape      = useScrapeRecordCards();
  const [form, setForm]     = useState<Record<string, string>>({});
  const [showForm, setShow] = useState(false);
  const [saved, setSaved]   = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createCard.mutateAsync({ data: {
      title: form.title!, value: Number(form.value), unit: form.unit!,
      category: form.category!, difficulty: form.difficulty ?? "medium",
      source: form.source!, holder: form.holder, sourceUrl: form.sourceUrl,
      previousValue: form.previousValue ? Number(form.previousValue) : undefined,
    }});
    await queryClient.invalidateQueries({ queryKey: getListRecordCardsQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getGetRecordCardStatsQueryKey() });
    setForm({}); setShow(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleScrape() {
    await scrape.mutateAsync({ data: { sources: ["guinness", "esports-charts", "speedrun"], categories: CATEGORIES } });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Manage Record Cards</h1>
          <p className="text-sm text-muted-foreground">Add, edit, and scrape real-world records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleScrape} disabled={scrape.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60">
            <RefreshCw className={cn("w-4 h-4", scrape.isPending && "animate-spin")} />
            {scrape.isPending ? "Scraping..." : "Scrape Records"}
          </button>
          <button onClick={() => setShow(s => !s)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Record card saved successfully.
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-border bg-white p-5 shadow-xs mb-6">
          <h2 className="font-bold text-foreground mb-4 text-sm">New Record Card</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "title",         label: "Title *",          type: "text",   required: true },
              { key: "holder",        label: "Record Holder",     type: "text",   required: false },
              { key: "value",         label: "Value *",           type: "number", required: true },
              { key: "unit",          label: "Unit *",            type: "text",   required: true },
              { key: "previousValue", label: "Previous Value",    type: "number", required: false },
              { key: "source",        label: "Source *",          type: "text",   required: true },
              { key: "sourceUrl",     label: "Source URL",        type: "url",    required: false },
            ].map(({ key, label, type, required }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                <input type={type} required={required} value={form[key] ?? ""} onChange={e => set(key, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category *</label>
              <select required value={form.category ?? ""} onChange={e => set("category", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Difficulty</label>
              <select value={form.difficulty ?? "medium"} onChange={e => set("difficulty", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={createCard.isPending}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {createCard.isPending ? "Saving..." : "Save Record"}
            </button>
            <button type="button" onClick={() => setShow(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* Records table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground">All Records ({cards.length})</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Title", "Holder", "Value", "Category", "Difficulty", "Verified"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cards.map(card => (
                  <tr key={card.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground text-sm max-w-[200px] truncate">{card.title}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{card.holder ?? "—"}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">{Number(card.value).toLocaleString()} {card.unit}</td>
                    <td className="px-4 py-3 capitalize text-xs">{card.category}</td>
                    <td className="px-4 py-3 capitalize text-xs">{card.difficulty}</td>
                    <td className="px-4 py-3">
                      {card.verified ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
