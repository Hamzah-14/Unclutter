import { Item, Priority } from '@/types';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function isOverdue(item: Item): boolean {
  if (!item.due_date || item.completed) return false;
  return item.due_date < todayStr();
}

export function getDaysUntilDue(item: Item): number | null {
  if (!item.due_date) return null;
  const todayMs = new Date(todayStr()).getTime();
  const dueMs = new Date(item.due_date).getTime();
  return Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
}

export function isStale(item: Item): boolean {
  if (item.completed || item.due_date) return false;
  const ageMs = Date.now() - new Date(item.created_at).getTime();
  return ageMs > 21 * 24 * 60 * 60 * 1000;
}

export function getUrgencyScore(item: Item): number {
  const base: Record<Priority, number> = { 1: 70, 2: 40, 3: 10 };
  let score = base[item.priority as Priority] ?? 40;

  if (isOverdue(item)) {
    score += 30;
  } else {
    const days = getDaysUntilDue(item);
    if (days !== null && days <= 3) score += 20;
    else if (days !== null && days <= 7) score += 10;
  }

  return Math.min(score, 100);
}
