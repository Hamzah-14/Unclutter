'use client';
import { useState, useEffect } from 'react';
import { CheckSquare, Eye, ShoppingCart, Info, FileText } from 'lucide-react';
import { Item, Priority, Category } from '@/types';
import { isOverdue, getDaysUntilDue, isStale } from '@/lib/intelligence';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface RelatedItem {
  id: string;
  content: string;
  category: Category;
}

const priorityConfig: Record<Priority, { bar: string; badge: string; label: string }> = {
  1: { bar: 'bg-red-500',     badge: 'bg-red-500/10 text-red-400 border-red-500/20',             label: 'High' },
  2: { bar: 'bg-amber-400',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       label: 'Med'  },
  3: { bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Low'  },
};

const categoryConfig: Record<Category, { badge: string; label: string; Icon: React.ElementType }> = {
  todo:  { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',       label: 'Todo',  Icon: CheckSquare  },
  watch: { badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20', label: 'Watch', Icon: Eye          },
  buy:   { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Buy',   Icon: ShoppingCart },
  info:  { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',       label: 'Info',  Icon: Info         },
  note:  { badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',       label: 'Note',  Icon: FileText     },
};

interface Props {
  item: Item;
  onComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}

export function ItemCard({ item, onComplete, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);

  const idsKey = item.related_ids?.join(',') ?? '';

  useEffect(() => {
    if (!idsKey) return;
    fetch(`/api/items/related?ids=${idsKey}`)
      .then(r => r.json())
      .then(setRelatedItems)
      .catch(() => {});
  }, [idsKey]);

  const scrollToItem = (id: string) => {
    document.querySelector(`[data-item-id="${id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const p = priorityConfig[item.priority as Priority];
  const c = categoryConfig[item.category];
  const { Icon } = c;

  const overdue = isOverdue(item);
  const days = getDaysUntilDue(item);
  const dueSoon = !overdue && days !== null && days <= 3;
  const stale = isStale(item);

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.content) onEdit(item.id, trimmed);
    setEditing(false);
  };

  return (
    <Card data-item-id={item.id} className={`relative overflow-hidden flex flex-col gap-4 p-5 min-h-[110px] transition-all duration-200 hover:bg-muted/10 hover:border-border/70 ${item.completed ? 'opacity-40' : ''}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${p.bar}`} />

      <div className="pl-3 flex items-start justify-between gap-3">
        {editing ? (
          <input
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
            className="flex-1 bg-transparent text-base font-medium outline-none border-b border-border/60 pb-0.5 text-foreground"
          />
        ) : (
          <p
            onDoubleClick={() => !item.completed && setEditing(true)}
            title={item.completed ? '' : 'Double-click to edit'}
            className={`flex-1 text-base leading-relaxed select-none ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground/90 font-medium'}`}
          >
            {item.content}
          </p>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="text-muted-foreground hover:text-foreground transition-colors duration-200">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 text-lg leading-none text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-200 mt-[-2px]"
          >×</button>
        )}
      </div>

      <div className="pl-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-xs flex items-center gap-1 px-2.5 py-1 ${c.badge}`}>
            <Icon size={11} />
            {c.label}
          </Badge>
          <Badge variant="outline" className={`text-xs px-2.5 py-1 ${p.badge}`}>
            {p.label}
          </Badge>
          {overdue && (
            <Badge variant="outline" className="text-xs px-2.5 py-1 bg-red-500/10 text-red-400 border-red-500/20">
              Overdue
            </Badge>
          )}
          {dueSoon && (
            <Badge variant="outline" className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
              Due soon
            </Badge>
          )}
          {stale && (
            <Badge variant="outline" className="text-xs px-2.5 py-1 bg-zinc-500/10 text-zinc-400/60 border-zinc-500/15">
              Stale
            </Badge>
          )}
          {item.due_date && (
            <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground border-border/40">
              {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Badge>
          )}
          {item.source === 'whatsapp' && (
            <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground/50 border-border/30">
              WA
            </Badge>
          )}
        </div>

        <button
          onClick={() => onComplete(item.id, !item.completed)}
          className={`text-xs px-3 py-1 rounded-full border transition-all duration-200 ${
            item.completed
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'text-muted-foreground border-border/40 hover:border-emerald-500/30 hover:text-emerald-400'
          }`}
        >
          {item.completed ? '✓ Done' : 'Mark done'}
        </button>
      </div>

      {relatedItems.length > 0 && (
        <div className="pl-3 pt-1 border-t border-border/20 flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground/50">Related</p>
          <div className="flex flex-wrap gap-1.5">
            {relatedItems.map(r => (
              <button
                key={r.id}
                onClick={() => scrollToItem(r.id)}
                className="text-xs px-2 py-0.5 rounded border border-border/30 text-muted-foreground/60 hover:text-foreground hover:border-border/60 transition-colors duration-200 max-w-[180px] truncate"
              >
                {r.content.length > 30 ? r.content.slice(0, 30) + '…' : r.content}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
