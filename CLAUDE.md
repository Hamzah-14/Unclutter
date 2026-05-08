# Focusbase

Personal productivity web app that centralizes fragmented notes and tasks from WhatsApp and Samsung Notes into one clean, AI-queryable dashboard. Built for a single user.

## Tech Stack
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + pgvector)
- Google Gemini API (gemini-1.5-flash + text-embedding-004)
- Deployed on Vercel

## What It Does
- Imports WhatsApp chat exports (.txt) — Gemini parses and categorizes each item
- Manual item entry
- Items stored with: content, category, priority, due_date, source, completed, embedding
- Vector similarity search via pgvector before passing context to Gemini
- Natural language query bar, AI task suggestions, filter/sort/complete/delete/edit

## File Structure
focusbase/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── layout.tsx                  # Forces dark mode via class="dark"
│   └── api/
│       ├── items/route.ts          # GET all, POST new (generates embedding)
│       ├── items/[id]/route.ts     # PATCH, DELETE
│       ├── parse/route.ts          # WhatsApp .txt → structured items + embeddings
│       ├── query/route.ts          # Vector search + Gemini answer
│       └── suggest/route.ts        # AI task suggestions
├── components/
│   ├── ItemCard.tsx                # Card: inline edit, delete confirm, priority bar, icons
│   ├── AddItemModal.tsx            # Add item modal
│   ├── ImportModal.tsx             # WhatsApp .txt upload modal
│   └── ui/                        # shadcn generated — never modify
├── lib/
│   ├── claude.ts                   # All Gemini calls: parse, embed, query, suggest
│   └── supabase.ts                 # Supabase client
└── types/
    └── index.ts                    # Item, CreateItemInput, Priority, Category, Source

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY

## Rules
- Never modify files under components/ui/
- Never modify lib/supabase.ts or types/index.ts unless explicitly asked
- All Gemini logic lives in lib/claude.ts
- API routes are thin — delegate to lib/claude.ts and supabase
- Dark mode forced — all custom badge colors use opacity variants (bg-blue-500/10 text-blue-400)
- Code must be clean, non-redundant, no inline styles

## Supabase Schema
Items table columns: id, content, category, priority, due_date, source, completed, created_at, notes, embedding (vector 768)
pgvector match function: match_items(query_embedding, match_threshold, match_count)

## Current Status
Core app is working. Next tasks:
1. UI polish (spacing, typography, card design)
2. Vercel deployment
3. Microsoft OneNote sync for Samsung Notes (v2)
