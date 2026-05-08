import { NextResponse } from 'next/server';
import { queryItems } from '@/lib/claude';

export async function POST(request: Request) {
  const { query } = await request.json();
  const answer = await queryItems(query);
  return NextResponse.json({ answer });
}