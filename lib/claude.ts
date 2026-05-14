import { GoogleGenerativeAI } from '@google/generative-ai';
import { Item, CreateItemInput } from '@/types';
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const flash = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  );
  const data = await res.json();

  if (!res.ok || !data.embedding?.values) {
    console.error('Embedding API error:', JSON.stringify(data));
    throw new Error(data.error?.message || 'Embedding API returned no values');
  }

  return data.embedding.values;
}

export async function parseWhatsAppExport(text: string): Promise<CreateItemInput[]> {
  const result = await flash.generateContent(`Parse this WhatsApp chat export and extract every distinct item worth saving.

For each item return:
- content: the item, clean and concise (no timestamps, no sender names)
- category: exactly one of: "todo", "watch", "buy", "info", "note"
- priority: 2 by default. Use 1 if clearly urgent, 3 if low importance.

Return ONLY a valid JSON array, no markdown fences, no explanation:
[{"content":"...","category":"...","priority":2}]

Skip: greetings, reactions, casual chat, "<Media omitted>", empty lines.

Chat:
${text}`);

  const raw = result.response.text();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Gemini did not return a JSON array');
  return JSON.parse(match[0]) as CreateItemInput[];
}

export async function queryItems(query: string): Promise<string> {
  const embedding = await generateEmbedding(query);

  const { data: items, error } = await supabase.rpc('match_items', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 20,
  });

  if (error || !items?.length) return "Nothing relevant found for that query.";

  const result = await flash.generateContent(`You are a personal assistant. Answer the user's query using only the items below.

Items:
${JSON.stringify(items.map((i: Item) => ({ content: i.content, category: i.category, completed: i.completed, due_date: i.due_date })))}

Query: "${query}"

Answer naturally and concisely. If nothing is relevant, say so.`);

  return result.response.text();
}

export async function findRelatedItems(embedding: number[], excludeId?: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('match_items', {
    query_embedding: embedding,
    match_threshold: 0.65,
    match_count: 4,
  });
  if (error || !data) return [];
  return (data as { id: string }[])
    .filter(item => item.id !== excludeId)
    .slice(0, 3)
    .map(item => item.id);
}

export async function suggestTasks(items: Item[]): Promise<string> {
  const open = items.filter(i => !i.completed && i.category === 'todo');
  if (!open.length) return 'No open tasks found.';

  const result = await flash.generateContent(`Pick the 3 most important tasks to focus on today and explain briefly why each matters.

Tasks:
${JSON.stringify(open.map(i => ({ content: i.content, priority: i.priority, due_date: i.due_date })))}

3 bullet points max. Be direct.`);

  return result.response.text();
}

export async function generateDailyDigest(items: Item[]): Promise<string> {
  const open = items.filter(i => !i.completed);
  if (!open.length) return 'Nothing open. You are all caught up.';

  const today = new Date().toISOString().split('T')[0];

  const result = await flash.generateContent(`You are a personal assistant delivering a morning briefing. Today is ${today}.

Open items:
${JSON.stringify(open.map(i => ({ content: i.content, category: i.category, priority: i.priority, due_date: i.due_date, created_at: i.created_at })))}

Write a short briefing (max 150 words) covering:
1. Items overdue or due today
2. Top 3 most urgent todos
3. Any items that appear forgotten (no due date, created weeks ago)

Be direct and practical. No filler. Write as if briefing a busy person at the start of their day.`);

  return result.response.text();
}

export async function generateWeeklyReview(items: Item[]): Promise<string> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recent = items.filter(i => i.created_at >= sevenDaysAgo);
  if (!recent.length) return 'Nothing captured in the last 7 days.';

  const result = await flash.generateContent(`You are a personal assistant delivering a weekly review.

Items from the past 7 days:
${JSON.stringify(recent.map(i => ({ content: i.content, category: i.category, priority: i.priority, completed: i.completed, created_at: i.created_at })))}

Write a short weekly review (max 200 words) covering:
1. What was captured this week, by category
2. What was completed
3. What is still open and may be drifting
4. One honest observation about patterns (e.g. "mostly buy items, none completed")

Be reflective and honest. No filler. Write as if doing a personal retrospective.`);

  return result.response.text();
}