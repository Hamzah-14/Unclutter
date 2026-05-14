import { NextResponse } from 'next/server';
import { parseWhatsAppExport, generateEmbedding, findRelatedItems } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

async function batchEmbeddings(items: Awaited<ReturnType<typeof parseWhatsAppExport>>) {
  const CHUNK = 10;
  const DELAY = 500;
  const results: { content: string; category: string; priority: number; source: string; embedding: number[] }[] = [];

  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const embedded = await Promise.all(
      chunk.map(async item => {
        let embedding: number[] = [];
        try {
          embedding = await generateEmbedding(item.content);
        } catch (e) {
          console.error('Embedding failed for item:', item.content, e);
        }
        return { ...item, source: 'whatsapp', embedding };
      })
    );
    results.push(...embedded);
    if (i + CHUNK < items.length) await new Promise(r => setTimeout(r, DELAY));
  }

  return results;
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const items = await parseWhatsAppExport(text);
    const withEmbeddings = await batchEmbeddings(items);

    const { data, error } = await supabase.from('items').insert(withEmbeddings).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await Promise.all(
      data.map(async (item: { id: string }, i: number) => {
        try {
          const related_ids = await findRelatedItems(withEmbeddings[i].embedding, item.id);
          if (related_ids.length > 0) {
            await supabase.from('items').update({ related_ids }).eq('id', item.id);
          }
        } catch {
          // non-fatal: item is already inserted, related links are best-effort
        }
      })
    );

    return NextResponse.json({ count: data.length, items: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Import failed' }, { status: 500 });
  }
}
