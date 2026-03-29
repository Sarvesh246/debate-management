# Debate Command

Debate Command is a debate intelligence platform built for structured, trustworthy debate prep. It takes a resolution, both sides, debate format, and audience level, then produces a usable debate workspace with:

- resolution analysis and framing
- trustworthy source retrieval with fallback
- evidence cards with credibility labels
- argument and opponent-case construction
- rebuttals and counter-rebuttals
- vulnerability scanning
- cross-ex prep
- speech drafts
- live debate mode
- judge mode
- typed practice mode
- export and print views

It is not a generic chatbot. The app is organized as a debate workspace and remains usable in deterministic mode when provider APIs are unavailable.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase Auth + Postgres + Storage
- Drizzle ORM
- Zod
- TanStack Query
- Framer Motion
- Vitest
- Playwright

## Operating modes

### 1. Provider-assisted mode

If `GEMINI_API_KEY` and optional retrieval keys are configured, Debate Command enhances speeches and coaching output and expands retrieval breadth.

### 2. Deterministic fallback mode

If model or provider keys are missing or fail, the app still works:

- criteria extraction
- framework guidance
- public-source query planning
- evidence-card creation
- argument ranking
- rebuttals
- vulnerabilities
- cross-ex prompts
- speeches
- live sheets
- judge summaries
- practice prompts

No fake citations are generated in either mode.

## Local setup

1. Install dependencies

```bash
npm install
```

2. Copy env vars

```bash
cp .env.example .env.local
```

3. Optional: configure Supabase for auth and persistence

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

4. Optional: configure provider keys

- `GEMINI_API_KEY`
- `TAVILY_API_KEY`
- `SEMANTIC_SCHOLAR_API_KEY` — retrieval still works without it (OpenAlex and Crossref are used). If you want a Semantic Scholar key, their signup flow typically requires an academic or institutional email address.

5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## No-key local mode

If Supabase and provider keys are missing, the app still boots:

- auth degrades to local workspace mode
- persistence uses `.data/mock-store.json`
- generation uses deterministic fallback
- external retrieval can be disabled for tests with `DISABLE_NETWORK_RETRIEVAL=1`

This makes the repo runnable immediately after clone while preserving the production path.

## Database and migrations

The schema lives in [`src/server/db/schema.ts`](/C:/Projects/Cursor/Debate%20Management/src/server/db/schema.ts).

Generate migrations:

```bash
npm run db:generate
```

Push schema to the configured database:

```bash
npm run db:push
```

Open Drizzle Studio:

```bash
npm run db:studio
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run check
```

## npm install notes

`package.json` includes an **`overrides`** entry for `encoding-sniffer` (^1.0.2) so Cheerio uses `@exodus/bytes` instead of the deprecated **`whatwg-encoding`** package.

You may still see deprecation warnings from **dev-only** transitive dependencies: **`@esbuild-kit/*`** (pulled in by `drizzle-kit` until Drizzle Kit 1.x is stable) and **`node-domexception`** (via **`shadcn`**’s `node-fetch`). Those are upstream; upgrading Drizzle to the 1.0 line will require a migration when you are ready.

## Testing

### Unit and integration

```bash
npm run test
```

Covered areas:

- setup validation
- capability detection
- deterministic criteria extraction
- evidence-card generation
- argument assembly
- provider failure fallback

### End-to-end

Install Playwright browsers once:

```bash
npx playwright install
```

Then run:

```bash
npm run test:e2e
```

The Playwright config starts the app with `DISABLE_NETWORK_RETRIEVAL=1`, so e2e tests do not depend on live external APIs.

## Deployment

### Vercel

1. Create a new Vercel project from this repo.
2. Add the same environment variables from `.env.local`.
3. Connect Supabase.
4. Deploy.

### Supabase

1. Create a free-tier project.
2. Copy the project URL, anon key, service role key, and Postgres connection string.
3. Run the Drizzle migration push.
4. Enable email/password and magic-link auth if desired.

## Provider and retrieval adapters

Current adapters:

- public discovery: OpenAlex, Crossref
- optional broad discovery: Tavily
- optional structured enhancement: Gemini

The app is intentionally adapter-based:

- retrieval lives in [`src/server/providers/search.ts`](/C:/Projects/Cursor/Debate%20Management/src/server/providers/search.ts)
- model enhancement lives in [`src/server/providers/model.ts`](/C:/Projects/Cursor/Debate%20Management/src/server/providers/model.ts)
- deterministic generation lives in [`src/features/debates/deterministic-engine.ts`](/C:/Projects/Cursor/Debate%20Management/src/features/debates/deterministic-engine.ts)

To swap providers later, replace the provider module without changing the workspace schema or UI contract.

## Notes

- The app never invents citations.
- Unsupported material should be treated as inference or omitted.
- The deterministic engine is the safety baseline, not a degraded afterthought.
