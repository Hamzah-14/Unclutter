import { GoogleGenerativeAI } from '@google/generative-ai';
import { Item, CreateItemInput } from '@/types';
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const flash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
  return JSON.parse(raw.replace(/```json|```/g, '').trim()) as CreateItemInput[];
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

export async function suggestTasks(items: Item[]): Promise<string> {
  const open = items.filter(i => !i.completed && i.category === 'todo');
  if (!open.length) return 'No open tasks found.';

  const result = await flash.generateContent(`Pick the 3 most important tasks to focus on today and explain briefly why each matters.

Tasks:
${JSON.stringify(open.map(i => ({ content: i.content, priority: i.priority, due_date: i.due_date })))}

3 bullet points max. Be direct.`);

  return result.response.text();
}