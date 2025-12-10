# Project Explainer

## Purpose
- Next.js App Router AI chatbot extended with an ABM (Account-Based Marketing) pack generator.
- Generates CFO-ready ABM packs with structured JSON outputs, supporting US and UK variants, plus optional infographic prompt generation.

## Architecture (high level)
- **Frontend**: Next.js 15 App Router (React 19 RC), shadcn/ui components, Tailwind utility classes. Deployed via Vercel.
- **State/UX**: Client components for branding overrides and ABM generation (`components/abm-page-client.tsx`, `ABMPackGenerator`).
- **Backend**: Route handler `app/(chat)/api/abm-pack/route.ts` using Vercel AI SDK `generateText` with structured outputs, Zod validation, and request logging.
- **Schema/Contracts**: Zod schemas in `app/(chat)/api/abm-pack/schema.ts`, converted to JSON Schema for strict model responses and frontend typing.
- **Prompts**: Large system prompts for ABM generation (US/UK) inside the route; meta image prompt in `lib/prompts/meta-image-prompt.ts` for infographic creation.
- **Auth/Rate Limits**: Auth via `auth()` session, user-type entitlements via `entitlementsByUserType`, message counts via `getMessageCountByUserId`.
- **Persistence/Infra (template defaults)**: Drizzle ORM with Postgres (Neon), Vercel Blob for files, Vercel deployment defaults from upstream template.

## Key flows
- **ABM pack generation (server)**:
  - Accepts multipart form (brand, region, optional notes/attachments).
  - Validates with `abmPackRequestSchema`; enriches notes with extracted attachment text.
  - Builds region-specific user prompt plus large system prompt; enforces JSON schema for outputs via OpenAI Structured Outputs.
  - Normalizes model output (`normalizeAbmPackOutput`), returns `AbmPackOutput` payload with research, modelling, outputs, appendices.
  - Logging includes request IDs, schema keys, token usage, and structural sanity checks; rate limits per user type.
- **Frontend ABM page**:
  - `AbmPageClient` renders hero copy and embeds `ABMPackGenerator`.
  - Local branding overrides stored in `localStorage` with simple settings drawer (tool name, tagline, subtext).
  - ABM generator component (not shown here) consumes `brandingOverride` to render/generate packs.
- **Infographic prompt generation**:
  - `lib/prompts/meta-image-prompt.ts` defines the meta prompt to turn ABM JSON into a text-to-image brief (HyperFinity brand accents + client brand styling).

## Configuration & environment
- Core scripts: `pnpm dev`, `pnpm build` (runs `tsx lib/db/migrate`), `pnpm start`, `pnpm lint` (`ultracite check`), `pnpm format`.
- Env vars: follow `.env.example` (AI gateway keys, Auth.js, database/Blob). For non-Vercel deploys set `AI_GATEWAY_API_KEY`.
- Package manager: `pnpm@9.12.3`; React 19 RC and Next 15.6.0-canary; Biome/Ultracite for lint/format.

## Current work / notes
- ABM route is long but structured with extensive prompts and schema enforcement; supports both US and UK rule sets and the £/£2m vs $/$2m threshold logic.
- Structured outputs depend on JSON Schema derived from Zod; logs warn if schema properties are missing.
- Attachments support via multipart; text extraction handled before prompt assembly.
- Branding overrides are client-only and persisted locally; no server write.

