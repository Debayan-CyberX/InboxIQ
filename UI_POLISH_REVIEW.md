# InboxIQ application polish

Branch: `ui/premium-polish`

The existing application had small metadata, a constrained conversation list, and limited distinction between permanent and floating surfaces. This pass refines those areas while preserving the current layouts and product flows.

## Changes

- Refined the existing dark tokens, retained the sage accent, and preserved light mode. Workspace surfaces stay opaque; dialogs, search, menus, and the assistant use selective frosting with an opaque fallback.
- Improved typography, numeric alignment, table spacing, conversation selection, empty states, form focus, and restrained interaction feedback. Reduced-motion and compact-density preferences remain supported.
- Added a keyboard-accessible, draggable conversation divider using the already-installed panel library. Its size persists locally. Mailbox navigation is 170px on larger screens; the folder picker takes over at tablet widths. Mobile retains list-to-reader navigation.
- Kept conversation panes independently scrollable, constrained reading width, enlarged email text, and made plain-text web addresses clickable without rendering untrusted HTML.
- Improved the overview's context panel and quiet queue state, draft editing space, assistant readability, and shared floating components. Compose actions remain visible while the form scrolls on short screens.
- Added accessible labels to icon-only pipeline links and preserved navigation position during sidebar collapse.

The landing experience and orb assets are intact. No dependencies, backend code, API contracts, database schemas, authentication logic, Gmail processing, AI pipelines, or runtime configuration changed. Application screens still render their existing data sources.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` / final ESLint JSON report | 0 errors; the same 7 existing Fast Refresh warnings as baseline |
| `npm run type:check` | Passed, including app, tooling, and server TypeScript projects |
| `npm test` | 15 passed, 2 existing database integration tests skipped without their opt-in environment |
| `npm run build` | Passed |
| Browser matrix | 66 screenshots, widths 320, 390, 768, 1024, and 1440; desktop and mobile light mode; no horizontal document overflow |
| Browser interactions | No page errors; mouse/keyboard resizing and persistence, pane scrolling, search/filter/sort, mobile reader/back, search shortcuts, sidebar collapse, lead stages, draft edit/review/confirmation, report export, settings, assistant, and fixture sign-in passed |
| Accessibility | Visible button/link names checked across the six main pages; keyboard focus, reduced motion, touch targets, and mobile dialog bounds checked |
| Edge states | Connected workspace with no queued work, disconnected onboarding, empty pages, loading, retryable errors, long subjects, long email bodies, and escaped HTML checked |

Browser data and API responses were isolated test fixtures outside the application source. No real messages were sent and no production records were modified. The existing database integration tests were not enabled for this frontend pass.

Local review artifacts are in the workspace's `.deployment-tools/polish-before`, `.deployment-tools/polish-after`, and `.deployment-tools/polish-extra` directories. This pass was first verified locally; production publishing is validated separately through the existing Git deployment pipeline.
