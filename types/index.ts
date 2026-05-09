export type Priority = 1 | 2 | 3; // 1 = red (high), 2 = yellow (medium), 3 = green (low)
export type Category = 'todo' | 'watch' | 'buy' | 'info' | 'note';
export type Source = 'whatsapp' | 'manual';

export interface Item {
  id: string;
  content: string;
  category: Category;
  priority: Priority;
  due_date: string | null;
  source: Source;
  completed: boolean;
  created_at: string;
  notes: string | null;
  related_ids: string[] | null;
}

export interface CreateItemInput {
  content: string;
  category: Category;
  priority: Priority;
  due_date?: string | null;
  source?: Source;
  notes?: string | null;
}