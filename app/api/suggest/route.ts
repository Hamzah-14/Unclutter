import { NextResponse } from 'next/server';
import { suggestTasks } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: items } = await supabase.from('items').select('*');
  const suggestions = await suggestTasks(items || []);
  return NextResponse.json({ suggestions });
}