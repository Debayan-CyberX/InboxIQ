# Authenticated graphite material pass

The supplied reference informed a neutral charcoal environment, fine silver-grey edges, softly lit raised panels, and restrained texture. The existing layouts and interactions are preserved.

## Boundary and implementation

Only `src/graphite.css` and its import in `DashboardLayout.tsx` change the application. The stylesheet defines five material levels: ambient canvas, recessed navigation, standard surfaces, raised decision/context panels, and floating overlays. Rules require `.app-shell` or a body containing that shell, including portaled dialogs and toasts.

No root tokens, public-page components, shared stylesheets, assets, routes, state, handlers, API calls, dependencies, backend files, or runtime configuration changed. Landing and authentication pages retain their existing appearance. The compiled global stylesheet keeps its previous hash.

The static 160px monochrome noise tile paints behind workspace content at 2.8% opacity. Reader, writing, table, and chart surfaces remain opaque. Floating UI has an opaque fallback and uses an 18px backdrop filter only where supported. No continuous animation or new rendering library was added; the material stylesheet adds about 2.8KB compressed to authenticated routes.

## Verification

- Lint: zero errors, seven existing Fast Refresh warnings.
- Typecheck and production build: passed.
- Tests: 15 passed; two existing opt-in database integration tests skipped.
- 65 browser captures across the six main pages, widths 320–1440, light mode, overlays, empty/loading/error states, and long content. Resizing and persistence, independent scrolling, search/filter/sort, AI draft review, send confirmation cancellation, report export, settings, assistant messaging, and touch navigation passed without page errors or real email sends.
- Four additional accessibility captures. Control names, visible keyboard focus, stationary navigation during collapse, touch targets, and reduced motion passed. Measured contrast was 16.15:1 for reader text and 5.85:1 for secondary text against the brightest standard graphite tone.
- Desktop/mobile landing, sign-in, and sign-up screenshots were captured before and after forcing the new stylesheet into each public document. Every computed style, pseudo-element style, and element rectangle stayed identical. Browser gradient rasterization can differ by tiny channel values between screenshots; source and computed presentation are unchanged.

Review artifacts remain outside application source in `.deployment-tools/graphite-before`, `.deployment-tools/graphite-after`, and `.deployment-tools/graphite-accessibility`. Browser fixture data never enters the application or production database. Production publishing is checked separately through the existing deployment pipeline.
