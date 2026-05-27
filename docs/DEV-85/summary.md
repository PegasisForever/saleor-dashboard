# Summary: DEV-85 — Copy order link button in order details TopNav

## What shipped

Order managers can now copy a shareable link to the current order page directly from the order details TopNav. A secondary icon button placed immediately before the metadata button copies `window.location.href` on click, shows a check icon and updated label for two seconds on success, and falls back silently on clipboard failure. The feature reuses the existing `useClipboard` hook and `ClipboardCopyIcon` component, includes full i18n, unit tests, Playwright E2E (`TC: SALEOR_218`), and Storybook state coverage.

## Architectural decisions (worth preserving)

- **Current URL over canonical path:** `window.location.href` preserves query-driven modal/view state the sharer may intend to include; canonical `orderUrl(id)` was rejected per PRD.
- **Container/content split:** `OrderCopyLinkButton` wires clipboard side effects; `OrderCopyLinkButtonContent` is presentational — enables Storybook state stories without mocking clipboard in every story.
- **`copyGeneration` in shared hook:** Third tuple element from `useClipboard` keys the `aria-live` region so screen readers re-announce on rapid re-copy within the 2s window (iter-6 fix for desktop-ux SHOULD-FIX).
- **Story-only interaction preview:** Hover/focus/active Storybook states use `OrderCopyLinkButtonStoryPreview` with Macaw CSS variable snapshots — production files stay free of preview props.
- **Timer `clear()` before reschedule:** Shared `useClipboard` now cancels orphan timers on rapid re-copy so feedback persists 2s from the last successful copy.

## Code changes

- `src/orders/components/OrderCopyLinkButton/` (new, ~350 lines) — container, presentational layer, messages, Storybook stories + preview, unit tests
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (modified, +2) — renders `<OrderCopyLinkButton />` before metadata button
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` (new, 110 lines) — TopNav DOM-order placement test
- `src/hooks/useClipboard.ts` (modified, +7/-2) — `clear()` before reschedule, `copyGeneration` third tuple element
- `src/hooks/useClipboard.test.ts` (modified, +69) — orphan timer, generation increment, rapid re-copy tests
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` (modified, +12/-6) — optional `size`/`strokeWidth` props
- `playwright/tests/orders.spec.ts` (modified, +37) — `TC: SALEOR_218` E2E with clipboard payload + 2s revert
- `locale/defaultMessages.json` (modified, +8) — extracted message IDs `bqtu1/`, `FzcMi0`

## Deep review verdicts

- **Security**: pass — no auth bypass or new attack surface; route gated by `MANAGE_ORDERS`; 3 WARNINGs on accepted query-param sharing and shared-hook failure UX
- **Performance**: pass — +305 B gzip on orders lazy chunk; INP 40 ms; 4 WARNINGs on shared-hook re-render coupling and Form render-prop pattern
- **Correctness**: pass — all PRD ACs satisfied; iter-6 fixes verified; 2 WARNINGs on pre-existing shared-hook promise races
- **Desktop UX**: pass — aria-live + copyGeneration remount landed; 2 WARNINGs on missing keyboard/rapid-re-copy E2E
- **Mobile UX**: pass — 32×32 touch targets match TopNav convention; 2 WARNINGs on missing mobile-viewport E2E
- **Simplify**: pass — container/content split is PRD-mandated; 7 WARNINGs on useCallback debt, dead props, hook API expansion

## Open WARNINGs (non-blocking)

- **Shared `useClipboard` promise races** — out-of-order resolution and post-unmount setState (`useClipboard.ts:13-28`); tracked in [DEV-86](https://linear.app/talktomedi/issue/DEV-86)
- **Failed re-copy leaves stale success UI** — `.catch` does not reset `copied` after prior success (`useClipboard.ts:26-28`)
- **E2E coverage gaps** — no keyboard activation test, no mobile viewport, no rapid re-copy E2E (`playwright/tests/orders.spec.ts`)
- **Full URL includes query params** — accepted per tech plan; copies modal/workflow state in URL
- **Simplification debt** — ineffective `useCallback`, dead `disabled` container prop, duplicate `formatMessage`, `marginRight` vs TopNav `gap`
- **Macaw 32×32 touch target** — org-wide compact button sizing below 44×44 recommendation; tracked in [DEV-88](https://linear.app/talktomedi/issue/DEV-88)

## Out-of-scope follow-ups

- [DEV-86](https://linear.app/talktomedi/issue/DEV-86) — Harden shared `useClipboard` promise races, unmount guard, and failure-after-success reset
- [DEV-88](https://linear.app/talktomedi/issue/DEV-88) — Increase Macaw compact icon-button touch target to 44×44px (design-system)

## Pipeline metadata

- Prototype iterations: 2
- Implementation loop iterations: 7
- Deep review passes: 3
- Wall-clock: ~2026-05-27 21:00 UTC → PR open
