---
agent: step-1-planning
sequence: 1
input_branch: 45b5cef8f4ddd1d99d7a2a497bb055d6bb3f2634
status: DONE
---

## Summary

Planned DEV-85 (copy-link button in order details TopNav): wrote project context, PRD, UI design, and tech plan; built `OrderCopyLinkButton` with Storybook state stories; integrated into `OrderDetailsPage`; published Storybook to a long-living deploy URL.

## Decisions made independently

- **Copy `window.location.href`:** Preserves query params and current view context; canonical `orderUrl(id)` would drop them.
- **Icon+label feedback only (no toast):** Matches existing orders-domain clipboard patterns (`TrackingNumberDisplay`, `CopyableText`).
- **Split presentational `OrderCopyLinkButtonContent`:** Enables reliable static Storybook state snapshots without story-only CSS modules diverging from production.
- **Placement before metadata button:** Matches Linear ticket spec and keeps high-frequency action left of editor tools.
- **Extended `ClipboardCopyIcon` with optional size props:** Backward-compatible; aligns TopNav icon sizing with metadata button (`iconSize.medium`).

## Files / sections inspected

- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:209-231`: TopNav action area; metadata button pattern for secondary icon Button
- `src/hooks/useClipboard.ts`: 2s copied reset, console.warn on failure
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: existing copy/check icon toggle
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx`: orders-domain copy button precedent
- `src/components/CopyableText/CopyableText.tsx`: shared copy-with-feedback pattern
- `src/orders/urls.ts:192-235`: `orderPath` / `orderUrl` helpers (chose href over canonical path)
- `package.json`: confirmed Storybook scripts present (`storybook`, `build-storybook`)
- `.storybook/preview.tsx`: global Intl/Apollo/Router decorators
- `AGENTS.md`, `CLAUDE.md`: conventions for macaw-ui-next, i18n, CSS modules, no barrels

## Considered then dropped

- **StateTrigger + play functions for Storybook states:** Static deployed Storybook does not run `play`/`beforeEach`; caused Copied/Hover stories to render identically to Default. Replaced with `OrderCopyLinkButtonContent` + `interactionPreview` props.
- **Story-only CSS modules for hover/focus:** Rejected to avoid story-vs-production divergence per mechanical definition of done.
- **Toast on copy success:** Rejected; ticket only requires "feedback when copied" and existing patterns use icon swap.

## Dead ends and retries

- **pnpm install EACCES on default store:** Fixed with `--store-dir` inside repo (`.pnpm-store`).
- **Storybook publish 409 on re-upload:** Allocated fresh UUID subpaths for each rebuild (final: `3d437e55-da44-4c10-8c48-a9859a99dad2`).
- **StateTrigger unstable `onTrigger` callback:** Caused effect re-run loops; replaced with `mode` enum.
- **React Strict Mode clearing setTimeout in StateTrigger:** Delayed interactions never fired; abandoned interaction-based approach for static SB.
- **Focus contrast measured against button bg:** Initial 1.41:1 failed gate; corrected Focus preview to white background + 2px outline (14.86:1 vs page).

## Ambiguities encountered

- **Benchmark spec missing:** `spec/benchmarks/saleor-dashboard/SLRD-001-copy-link-order-topnav.md` not in repo; relied on Linear ticket description instead.
- **"copy-icon component" naming:** Interpreted as `ClipboardCopyIcon` (orders domain) per ticket context + existing TopNav-adjacent order components.

## Concerns / warnings

- Production macaw `Button` focus ring is subtle in computed styles; Focus story uses measured preview styles. QA should verify real keyboard focus in browser during integration.
- No unit test yet for `OrderCopyLinkButton` — noted in tech plan risks for integration pass.

## Did not do (out of scope or deferred)

- **Unit tests:** Deferred to integration tasks per tech plan risk note.
- **Changeset:** Internal prototype/planning iteration; user-facing feature will need changeset at PR time.
- **Human Linear questions:** No uncertainties survived decision threshold.
