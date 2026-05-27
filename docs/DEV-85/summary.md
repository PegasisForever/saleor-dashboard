# Summary: DEV-85 — Copy order link button in order details TopNav

## What shipped

Order details now includes a one-click **Copy order link** icon button in the TopNav, placed immediately before the metadata button. Clicking copies the current page URL (`window.location.href`) to the clipboard; on success the icon switches to a check mark and the accessible name updates to "Order link copied" for two seconds, then reverts. The feature reuses `useClipboard`, `ClipboardCopyIcon`, and react-intl messages, with container/presentational split for Storybook. Iteration-6 loop-back fixes hardened the shared hook (timer `clear()` before reschedule, `copyGeneration` for screen-reader re-announce on rapid re-copy) and extended Playwright `TC: SALEOR_218` to assert clipboard payload and 2s revert.

## Architectural decisions (worth preserving)

- **Current URL over canonical path:** `window.location.href` preserves query-driven view state the user may want to share; canonical `orderUrl(id)` was rejected in tech plan.
- **Icon + label feedback only (no toast):** Matches existing orders-domain clipboard patterns (`CopyableText`, `TrackingNumberDisplay`).
- **Container/content split:** `OrderCopyLinkButton` wires clipboard; `OrderCopyLinkButtonContent` is presentational — enables Storybook state stories without mocking clipboard in every story.
- **`copyGeneration` in shared `useClipboard`:** Third tuple element increments on each successful write so `aria-live` region remounts on rapid re-copy within the 2s window (desktop-ux pass-002 SHOULD-FIX).
- **Story-only interaction preview:** Hover/focus/active Storybook states use `OrderCopyLinkButtonStoryPreview` + CSS module Macaw token snapshots because static Storybook cannot persist pseudo-states from play functions.

## Code changes

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (new, 29 lines) — container; `useClipboard` + optional `url` for tests/stories
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` (new, 54 lines) — secondary icon button, `aria-live` live region keyed by `copyGeneration`
- `src/orders/components/OrderCopyLinkButton/messages.ts` (new, 14 lines) — `copyOrderLink` / `orderLinkCopied` i18n
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` (new, 127 lines) — unit tests mirroring `CopyableText` pattern
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (new, 78 lines) — state coverage + TopNav composition story
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` (new, 35 lines) — story-only hover/focus/active wrapper
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` (new, 17 lines) — story-only Macaw token snapshots
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` (new, 11 lines) — visually hidden live region
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (modified, +2) — renders `<OrderCopyLinkButton />` before metadata button
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` (new, 110 lines) — TopNav DOM order assertion
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` (modified, +12/-6) — optional `size` / `strokeWidth` props
- `src/hooks/useClipboard.ts` (modified, +7/-4) — `clear()` before reschedule, `copyGeneration`, 3-tuple return
- `src/hooks/useClipboard.test.ts` (modified, +69) — timer orphan + generation tests
- `playwright/tests/orders.spec.ts` (modified, +37) — `TC: SALEOR_218` clipboard payload + 2s revert
- `playwright/pages/ordersPage.ts` (modified, +2) — `copyOrderLinkButton` locator
- `locale/defaultMessages.json` (modified, +8) — extracted message catalog entries

## Deep review verdicts

- **Security**: pass — no auth bypass or new attack surface; copies current URL behind existing `MANAGE_ORDERS` gates (3 WARNINGs on accepted PRD tradeoffs + shared-hook edge case)
- **Performance**: pass — negligible bundle delta; iter-6 timer fix removes orphan-timeout churn (4 WARNINGs on Form render-prop coupling and hook API expansion)
- **Correctness**: pass — all PRD ACs satisfied in source; E2E statically verified (2 WARNINGs on pre-existing shared-hook promise/unmount races)
- **Desktop UX**: pass — iter-6 SR re-announce + E2E clipboard/revert landed (2 WARNINGs on keyboard/rapid-re-copy E2E gaps)
- **Mobile UX**: pass — touch targets and placement correct; iter-6 timer fix helps double-tap (2 WARNINGs on mobile viewport E2E + Storybook proxy fidelity)
- **Simplify**: pass — PRD-mandated split is intentional; remaining debt is style/API WARNINGs only

## Open WARNINGs (non-blocking)

Twenty WARNINGs across pass-003 (0 BLOCKER / 0 SHOULD-FIX). Highlights for human review:

- **Shared `useClipboard` races** (`useClipboard.ts:13-28`): out-of-order `writeText` resolution can desync timer/`copyGeneration`; late resolution after unmount can call `setState`; failed re-copy after prior success leaves stale success UI — filed as out-of-scope follow-up
- **E2E coverage gaps**: no keyboard-activation or rapid-re-copy E2E (`desktop-ux` F-001/F-002); no mobile viewport run (`mobile-ux` F-001)
- **Intentional PRD choices**: full URL includes query params (`security` F-001); no toast on clipboard failure (`security` F-003 partial — hook-level stale UI is separate)
- **Simplification debt**: ineffective `useCallback`, dead `disabled` prop in production, `marginRight` vs TopNav `gap`, fragmented Storybook surface (`simplify` F-001–F-007)
- **Pre-existing TopNav a11y**: Lighthouse flags unnamed `app-header-back-button` in TopNav stories — not introduced by copy button; filed as out-of-scope follow-up

## Out-of-scope follow-ups

Linear tickets filed for pre-existing / shared-infrastructure bugs discovered during review:

- [DEV-86](https://linear.app/talktomedi/issue/DEV-86/fixhooks-harden-useclipboard-promise-races-unmount-guard-and-failure) — Harden shared `useClipboard` (promise ordering, unmount guard, failure-after-success reset)
- [DEV-87](https://linear.app/talktomedi/issue/DEV-87/fixa11y-add-accessible-name-to-topnav-back-button-app-header-back) — TopNav `app-header-back-button` missing accessible name (pre-existing Lighthouse finding)

## Pipeline metadata

- Prototype iterations: 2
- Implementation loop iterations: 6
- Deep review passes: 3
- Wall-clock: planning trigger → PR open (invocation 1)
