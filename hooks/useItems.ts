import { useState, useCallback, useEffect } from 'react';
import { Item, CreateItemInput } from '@/types';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/items');
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async (input: CreateItemInput) => {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    fetchItems();
  };

  const handleEdit = async (id: string, content: string) => {
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    fetchItems();
  };

  const handleComplete = async (id: string, completed: boolean) => {
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  return {
    items, loading, searchTerm, setSearchTerm,
    fetchItems, handleAdd, handleEdit, handleComplete, handleDelete,
  };
}
