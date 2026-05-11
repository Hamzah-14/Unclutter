'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (count: number) => void;
}

export function ImportModal({ open, onClose, onImport }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!text.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const raw = await res.text();
      if (!raw) throw new Error('Server returned an empty response');
      const data = JSON.parse(raw);
      if (!res.ok) throw new Error(data.error || 'Import failed');
      onImport(data.count);
      setText(''); onClose();
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Import from WhatsApp</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-muted-foreground">
            In WhatsApp: open chat → ⋮ → More → Export chat → Without media. Then upload the .txt file.
          </p>
          <input
            type="file" accept=".txt" onChange={handleFile}
            className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:text-sm file:bg-background hover:file:bg-accent cursor-pointer"
          />
          {text && (
            <Textarea
              value={text.slice(0, 600) + (text.length > 600 ? '...' : '')}
              readOnly rows={4}
              className="text-xs text-muted-foreground font-mono resize-none"
            />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleImport} disabled={!text.trim() || loading}>
              {loading ? 'Parsing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}