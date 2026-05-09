import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateDailyDigest } from '@/lib/claude';
import { Item } from '@/types';

export async function GET() {
  const { data, error } = await supabase.from('items').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const digest = await generateDailyDigest(data as Item[]);
  return NextResponse.json({ digest });
}
