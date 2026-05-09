import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
  if (!ids.length) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('items').select('id, content, category').in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
