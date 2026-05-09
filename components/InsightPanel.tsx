'use client';
import { Button } from '@/components/ui/button';

interface Props {
  result: string;
  loading: boolean;
  buttonLabel: string;
  onGenerate: () => void;
}

export function InsightPanel({ result, loading, buttonLabel, onGenerate }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onGenerate} disabled={loading}>
          {loading ? 'Thinking...' : buttonLabel}
        </Button>
      </div>
      {result && (
        <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3.5 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
          {result}
        </div>
      )}
    </div>
  );
}
