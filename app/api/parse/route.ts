import { NextResponse } from 'next/server';
import { parseWhatsAppExport, generateEmbedding, findRelatedItems } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { text } = await request.json();
  const items = await parseWhatsAppExport(text);

  const withEmbeddings = await Promise.all(
    items.map(async item => ({
      ...item,
      source: 'whatsapp',
      embedding: await generateEmbedding(item.content),
    }))
  );

  const { data, error } = await supabase.from('items').insert(withEmbeddings).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await Promise.all(
    data.map(async (item: { id: string }, i: number) => {
      const related_ids = await findRelatedItems(withEmbeddings[i].embedding, item.id);
      if (related_ids.length > 0) {
        await supabase.from('items').update({ related_ids }).eq('id', item.id);
      }
    })
  );

  return NextResponse.json({ count: data.length, items: data });
}