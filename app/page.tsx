'use client';
import { useState } from 'react';
import { Category } from '@/types';
import { ItemCard } from '@/components/ItemCard';
import { AddItemModal } from '@/components/AddItemModal';
import { ImportModal } from '@/components/ImportModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUrgencyScore } from '@/lib/intelligence';
import { InsightPanel } from '@/components/InsightPanel';
import { useItems } from '@/hooks/useItems';
import { useInsights } from '@/hooks/useInsights';

type InsightTab = 'suggestions' | 'digest' | 'review';

const INSIGHT_TABS: { value: InsightTab; label: string }[] = [
  { value: 'suggestions', label: 'Suggestions'   },
  { value: 'digest',      label: 'Daily digest'  },
  { value: 'review',      label: 'Weekly review' },
];

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all',   label: 'All'   },
  { value: 'todo',  label: 'Todo'  },
  { value: 'watch', label: 'Watch' },
  { value: 'buy',   label: 'Buy'   },
  { value: 'info',  label: 'Info'  },
  { value: 'note',  label: 'Note'  },
];

const CATEGORY_COLORS: Record<string, string> = {
  todo: 'text-blue-400', watch: 'text-violet-400',
  buy: 'text-orange-400', info: 'text-cyan-400', note: 'text-zinc-400',
};

const CATEGORY_ACTIVE: Record<string, string> = {
  all:   'bg-foreground/10 text-foreground border-foreground/40 font-medium',
  todo:  'bg-blue-500/15 text-blue-400 border-blue-500/40 font-medium',
  watch: 'bg-violet-500/15 text-violet-400 border-violet-500/40 font-medium',
  buy:   'bg-orange-500/15 text-orange-400 border-orange-500/40 font-medium',
  info:  'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 font-medium',
  note:  'bg-zinc-500/15 text-zinc-400 border-zinc-500/40 font-medium',
};

export default function Home() {
  const {
    items, loading, searchTerm, setSearchTerm,
    fetchItems, handleAdd, handleEdit, handleComplete, handleDelete,
  } = useItems();

  const {
    suggestions, suggestLoading, handleSuggest,
    digest,
    review, reviewLoading, handleReview,
    bannerDigest, setBannerDigest,
  } = useInsights();

  const [category, setCategory] = useState<Category | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [queryAnswer, setQueryAnswer] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<InsightTab>('suggestions');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setQueryLoading(true);
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setQueryAnswer(data.answer);
    setQuery('');
    setQueryLoading(false);
  };

  const filtered = items
    .filter(i => category === 'all' || i.category === category)
    .filter(i => showCompleted || !i.completed)
    .filter(i => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return i.content.toLowerCase().includes(term) || (i.notes ?? '').toLowerCase().includes(term);
    })
    .sort((a, b) =>
      sortBy === 'priority'
        ? getUrgencyScore(b) - getUrgencyScore(a)
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const openItems = items.filter(i => !i.completed);
  const stats = CATEGORIES.slice(1).map(c => ({
    ...c,
    count: openItems.filter(i => i.category === c.value).length,
  })).filter(s => s.count > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-sm bg-indigo-500 shrink-0" />
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Focusbase</h1>
                <p className="text-xs text-muted-foreground">
                  {searchTerm ? `${filtered.length} found` : `${openItems.length} open`}
                </p>
              </div>
            </div>
            {stats.length > 0 && (
              <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-border/50">
                {stats.map(s => (
                  <span key={s.value} className={`text-xs font-medium ${CATEGORY_COLORS[s.value]}`}>
                    {s.count} {s.label.toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>Import</Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>+ Add</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-6 flex flex-col gap-6">

        {bannerDigest && (
          <div className="rounded-lg border border-border/50 border-l-2 border-l-indigo-500 bg-muted/20 pl-5 pr-10 py-3.5 text-sm relative">
            <button
              onClick={() => setBannerDigest('')}
              className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground text-xs transition-colors duration-200"
            >✕</button>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Today's briefing</p>
            <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">{bannerDigest}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Ask anything — e.g. what do I need to buy?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuery()}
            className="flex-1 h-11 bg-muted/40"
          />
          <Button variant="outline" className="h-11 px-5" onClick={handleQuery} disabled={!query.trim() || queryLoading}>
            {queryLoading ? '...' : 'Ask'}
          </Button>
        </div>

        {queryAnswer && (
          <div className="rounded-lg border border-border/50 border-l-2 border-l-indigo-500 bg-muted/20 pl-5 pr-4 py-3.5 text-sm relative">
            <button onClick={() => setQueryAnswer('')} className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground text-xs transition-colors duration-200">✕</button>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Answer</p>
            <p className="leading-relaxed text-foreground/90">{queryAnswer}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  category === c.value
                    ? CATEGORY_ACTIVE[c.value]
                    : 'text-muted-foreground border-border/50 hover:border-border hover:text-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearchTerm('')}
              className="h-8 w-44 text-xs bg-muted/30 pr-6"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 text-xs"
              >×</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={v => setSortBy(v as 'date' | 'priority')}>
              <SelectTrigger className="h-8 text-xs w-32 bg-muted/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Latest first</SelectItem>
                <SelectItem value="priority">By priority</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                showCompleted
                  ? 'bg-foreground/10 text-foreground border-foreground/40 font-medium'
                  : 'text-muted-foreground border-border/50 hover:border-border hover:text-foreground'
              }`}
            >
              {showCompleted ? 'Hide done' : 'Show done'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-h-[110px] rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <div className="w-12 h-12 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-center text-xl">◻</div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/50 mb-1">
                {searchTerm ? 'No items match your search.' : 'Nothing to show'}
              </p>
              {!searchTerm && (
                <p className="text-xs text-muted-foreground/60">Add an item manually or import from a WhatsApp export.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        <Separator className="opacity-30" />

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">AI insights</p>
          <div className="flex border-b border-border/30 mb-4">
            {INSIGHT_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors duration-200 ${
                  activeTab === tab.value
                    ? 'border-indigo-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'suggestions' && (
            <InsightPanel result={suggestions} loading={suggestLoading} buttonLabel="Suggest tasks" onGenerate={handleSuggest} />
          )}
          {activeTab === 'digest' && (
            <div className="flex flex-col gap-3">
              {digest && (
                <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3.5 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {digest}
                </div>
              )}
              <p className="text-xs text-muted-foreground/50">Updated daily — next refresh tomorrow.</p>
            </div>
          )}
          {activeTab === 'review' && (
            <InsightPanel result={review} loading={reviewLoading} buttonLabel="Generate review" onGenerate={handleReview} />
          )}
        </div>

      </main>

      <AddItemModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={count => { fetchItems(); showToast(`Imported ${count} items ✓`); }}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-sm px-4 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
