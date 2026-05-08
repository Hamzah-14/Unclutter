'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateItemInput, Category, Priority } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (item: CreateItemInput) => void;
}

export function AddItemModal({ open, onClose, onAdd }: Props) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('todo');
  const [priority, setPriority] = useState<Priority>(2);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onAdd({ content: content.trim(), category, priority, due_date: dueDate || null });
    setContent(''); setCategory('todo'); setPriority(2); setDueDate('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add item</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <Input
            placeholder="What do you need to remember?"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <div className="flex gap-3">
            <Select value={category} onValueChange={v => setCategory(v as Category)}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="watch">Watch</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(priority)} onValueChange={v => setPriority(Number(v) as Priority)}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">🔴 High</SelectItem>
                <SelectItem value="2">🟡 Medium</SelectItem>
                <SelectItem value="3">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!content.trim()}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}