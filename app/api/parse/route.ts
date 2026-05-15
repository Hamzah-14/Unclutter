import { NextResponse } from 'next/server';
import { parseWhatsAppExport, generateEmbedding, findRelatedItems } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

async function generateEmbeddingsInBackground(items: { id: string; content: string }[]) {
  for (const item of items) {
    try {
      const embedding = await generateEmbedding(item.content);
      await supabase.from('items').update({ embedding }).eq('id', item.id);
      const related_ids = await findRelatedItems(embedding, item.id);
      if (related_ids.length > 0) {
        await supabase.from('items').update({ related_ids }).eq('id', item.id);
      }
    } catch (e) {
      console.error(`Embedding failed for item ${item.id}:`, e);
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const parsed = await parseWhatsAppExport(text);
    const rows = parsed.map(item => ({ ...item, source: 'whatsapp' }));

    const { data, error } = await supabase.from('items').insert(rows).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    void generateEmbeddingsInBackground(data);

    return NextResponse.json({ count: data.length, items: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Import failed' }, { status: 500 });
  }
}
