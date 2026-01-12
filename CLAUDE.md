# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server with Turbopack (localhost:3000)
pnpm build            # Run migrations and build for production
pnpm start            # Start production server
pnpm lint             # Run Ultracite linter (npx ultracite@latest check)
pnpm format           # Auto-fix lint issues (npx ultracite@latest fix)
```

### Database Commands (Drizzle ORM with PostgreSQL)

```bash
pnpm db:migrate       # Apply database migrations
pnpm db:generate      # Generate new migration from schema changes
pnpm db:studio        # Open Drizzle Studio for database inspection
pnpm db:push          # Push schema changes directly (dev only)
```

### Testing (Playwright)

```bash
pnpm test                                    # Run all tests
npx playwright test tests/e2e/chat.test.ts  # Run a specific test file
npx playwright test --project=e2e           # Run only e2e tests
npx playwright test --project=routes        # Run only route tests
```

Tests are in `tests/` with two projects: `e2e/` (UI tests) and `routes/` (API tests). The test server auto-starts on port 3000.

## Architecture Overview

### App Structure (Next.js App Router)

- `app/(auth)/` - Authentication routes and Auth.js configuration
  - `auth.ts` - NextAuth setup with credentials + guest providers
  - `api/auth/[...nextauth]/` - Auth API routes
- `app/(chat)/` - Main chat application
  - `page.tsx` - Home page (new chat)
  - `chat/[id]/page.tsx` - Individual chat view
  - `api/chat/route.ts` - Main chat API endpoint (POST for messages, DELETE for chats)
  - `api/chat/[id]/stream/` - Resumable stream endpoint
  - `api/abm-pack/` - ABM pack generation endpoints

### AI System (`lib/ai/`)

- `providers.ts` - Model provider configuration (OpenAI, Google Gemini)
  - `myProvider` - Main language model provider
  - `geminiProvider` - For image generation
- `models.ts` - Chat model definitions and IDs
- `prompts.ts` - System prompts for chat, artifacts, code generation
- `tools/` - AI SDK tools (createDocument, updateDocument, getWeather, requestSuggestions)

### Artifacts System

Artifacts are AI-generated documents that appear in a side panel. Each artifact type has client/server handlers:

- `artifacts/text/` - Text documents (ProseMirror editor)
- `artifacts/code/` - Code snippets (CodeMirror, Python execution)
- `artifacts/sheet/` - Spreadsheets (CSV-based)
- `artifacts/image/` - Image artifacts
- `lib/artifacts/server.ts` - Document handler registration and creation flow

### Database (`lib/db/`)

- `schema.ts` - Drizzle schema definitions (user, chat, message, document, vote, suggestion, stream)
- `queries.ts` - Database query functions
- `migrations/` - SQL migration files
- Uses Neon Serverless Postgres via `POSTGRES_URL`

### Key Components

- `components/chat.tsx` - Main chat interface with useChat hook
- `components/artifact.tsx` - Artifact panel with document editing
- `components/multimodal-input.tsx` - Chat input with file attachments
- `components/messages.tsx` - Message list rendering
- `components/ui/` - shadcn/ui primitives

### State Management

- `hooks/use-artifact.ts` - Artifact visibility and state (Zustand-like)
- `components/data-stream-provider.tsx` - Real-time data stream context
- SWR for server state (chat history, votes)

## Code Style (Ultracite/Biome)

- No TypeScript enums - use `as const` objects instead
- No `any` type - use proper typing
- Use `for...of` instead of `Array.forEach`
- Use arrow functions over function expressions
- No unused imports/variables
- Use `===` instead of `==`
- Always include `type` attribute on buttons
- Use `import type` for type-only imports

## Environment Variables

Required variables (see `.env.example`):
- `AUTH_SECRET` - NextAuth secret
- `POSTGRES_URL` - Neon PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage
- `OPENAI_API_KEY` - OpenAI API key for chat models (GPT-4o, GPT-5.1)
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Gemini API key for infographic generation

Optional:
- `AI_GATEWAY_API_KEY` - For non-Vercel deployments using Vercel AI Gateway
- `REDIS_URL` - For resumable streams (optional)
