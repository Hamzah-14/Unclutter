import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/claude';
import { CreateItemInput } from '@/types';

export async function GET() {
  const { data, error } = await supabase
    .from('items').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body: CreateItemInput = await request.json();
  const embedding = await generateEmbedding(body.content);

  const { data, error } = await supabase
    .from('items').insert({ ...body, embedding }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}