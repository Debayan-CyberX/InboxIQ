# InboxIQ

Turn connected email conversations into a reviewable lead workflow, with opportunity detection, contextual drafts, and explicit approval before sending.

**Status:** Live application · AI-assisted drafts · Human-reviewed sending.

[Live demo](https://inboxiq-psi.vercel.app) · [Portfolio case study](https://debayan-cyberx.github.io/Deb-s-Portfolio.github.io/#project-inbox)

![Actual application interface](docs/screenshots/preview.png)

## Problem and intended user

Help a small business identify promising email conversations and prepare relevant next steps without losing control of outgoing messages.

## My implementation

I designed and implemented the application across the React workspace, authentication, database-backed workflows, Gmail integration, and draft-review experience.

## Stack and workflow

React, TypeScript, Express, Better Auth, Supabase.

```mermaid
flowchart LR
  A["Connect"] --> B
  B["Identify"] --> C
  C["Draft"] --> D
  D["Review"]
```

## Walkthrough

1. Connect an authorized Gmail account and sync recent conversations into the workspace.
2. Review detected opportunities and their context; adjust lead stages and next steps.
3. Generate or edit a contextual reply, then save and review the authoritative draft.
4. Choose Send explicitly. The backend uses the connected account and updates delivery state after provider acceptance.

## Run locally

Install Node.js and npm, clone this repository, and install the locked dependencies:

```sh
npm ci
```

Configure your own `.env.local` before running both services. The current server loads `.env.local` and then `.env`. Set the database connection, Better Auth settings, and the client/server origins for your environment. Gmail requires your own OAuth application and authorized account; AI assistance requires the configured provider key. Keep server credentials out of `VITE_` variables and version control.

Read [CORE_WORKFLOW.md](CORE_WORKFLOW.md) for current Gmail, AI, database-migration, and pooling requirements. Database migrations must be applied to your own configured database before exercising the complete workflow.

```sh
npm run dev:all
```

Use the frontend URL printed by Vite. `npm run dev` runs only the frontend; `npm run dev:auth` runs the Express service. A frontend preview alone does not verify authentication, Gmail, or database connectivity.

```sh
npm test
npm run type:check
npm run build
```

Database integration tests are opt-in and require the dedicated variables described in the workflow document. Provider simulations do not send messages to real contacts.

## Technical decision and tradeoff

Persist drafts and require an explicit send action. When AI is unavailable, labeled rules and template drafts keep the workflow understandable, at the cost of less tailored suggestions.

## Current limitations

Gmail requires account authorization. Analysis resumes while the workspace is open, rather than running continuously in the background. Sending supports one recipient and plain text, without attachments or delivery/open tracking.

## Validation scope

Repository tests include provider simulations for ownership isolation, repeated analysis, drafts, and send-state handling. Simulated transport tests do not establish real inbox delivery. Validation commands are provided for reproduction; this documentation update does not claim new test runs or production measurements.

