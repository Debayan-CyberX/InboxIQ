# InboxIQ product redesign audit

## Application and source
React 18 + TypeScript + Vite 5, React Router, Tailwind, Radix/shadcn primitives, Lucide, Framer Motion, next-themes. Existing Express/Better Auth API on Render and Supabase PostgreSQL remain in place. No framework or hosting migration.

## Route inventory
- `/`: public marketing; isolated illustrative product demo.
- `/sign-in`, `/sign-up`: Better Auth email/password forms.
- `/dashboard`: live leads, action queue, pipeline summary, connected-email onboarding.
- `/inbox`: email threads, classification filters, search, archive, reply/forward/compose.
- `/leads`: lead filtering/sorting, detection, follow-up generation, update/delete.
- `/drafts`: draft filtering, editing, regeneration, explicit review/send, delete.
- `/analytics`: real period-based email counts and pipeline statistics, CSV export.
- `/settings`: persisted account, appearance, email connections, preferences.
- `/test` and fallback routes retained.

## API contracts to retain
`/api/auth/*`, `/api/emails*`, `/api/email-connections/*` (including OAuth callbacks), `/api/leads/*`, `/api/action-queue`, `/api/insights/generate`, `/api/chat`, `/gmail/sync`, `/health`; existing Supabase RPCs for user mapping, leads, threads, drafts, statistics, insights and settings. No migrations or credential disclosure.

## Findings
- Thread unread/star/importance values were placeholders, without persisted database fields. Avoid presenting them as working server features.
- Draft confidence had a hardcoded 85 percent. Remove fabricated confidence; use actual nullable classification confidence when present.
- Assistant used a floating bubble. Move entry into the shell, retain the authenticated chat endpoint and visible request feedback.
- Search returned entities but ignored their identity on navigation. Carry selected entity identifiers into target routes.
- Settings persisted theme but did not apply it. Connect appearance controls to the actual theme provider.
- Root Supabase `ReturnType<typeof createClient>` erased schema types and caused many `never` errors. Introduce an explicit schema contract without changing API calls.
- Existing lint/type failures include generated build output, switch scoping, legacy JSON boundaries, animation types and optional database insert fields. Validate and resolve them during implementation.

## System
Neutral near-black landing (#0B0D10), white (#F5F5F4), graphite (#181B20), muted grey (#969BA5). Inter, one muted teal accent. Workspace light/dark tokens, 1px separators, compact data views, accessible dialogs, 180ms common transitions and reduced-motion support. No 3D dependency: product interaction is more useful for this narrative.

## Verification plan
Production build, lint, application/server type checks, meaningful workflow tests, authenticated desktop/tablet/mobile browser review, real sign-in/session persistence, data controls, safe send confirmation, command navigation, appearance and CSV export. Never send verification email to a real recipient. Clean up temporary test fixtures.

## Completed validation
- Application, Vite configuration and Express server TypeScript checks pass.
- Production lint: zero errors; standard shadcn Fast Refresh export warnings remain. Redesigned pages pass with zero warnings.
- Three regression tests cover HTML escaping, CSV quoting and report date boundaries.
- Production build passes; initial application JavaScript approximately 371 kB before gzip with protected routes loaded separately.
- 33 browser captures: desktop 1440, tablet 1024 and mobile 390, both workspace themes, populated and empty states. No horizontal overflow or runtime errors.
- Browser flows verify lead mutations, command search/navigation, draft edit/save/review/confirmation, date filters/CSV, preferences and contextual assistant. Email sends are mocked.
- Existing limitations: AI and mail providers require service credentials; direct IMAP setup and Outlook synchronization were not functional backend features and are described honestly. No provider account was connected or real email sent during design verification.
