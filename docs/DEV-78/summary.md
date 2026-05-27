# Summary: DEV-78 — Copy order link button in order details TopNav

## What shipped

Staff users on the order details page now have a secondary icon button in the TopNav, placed immediately before the metadata button, that copies the absolute dashboard URL for the current order to the clipboard. The control reuses the existing `useClipboard` hook and `ClipboardCopyIcon`, showing inline Copy→Check feedback and updated accessible labels for ~2 seconds after a successful copy. The URL is built from `window.location.origin`, the app mount URI, and `orderPath(orderId)` with no dialog query parameters. The button is disabled when `orderId` is empty.

## Architectural decisions (worth preserving)

- **Canonical URL without query params:** Uses `orderPath(orderId)` instead of `window.location.href` so shared links omit transient dialog/modal query state.
- **Container/view split:** `OrderCopyLinkButtonView` is a presentational export so Storybook can render static states (hover/focus/copied) without mocking `useClipboard`; production wiring stays in the container.
- **Raw `orderPath` vs `encodeURIComponent`:** PRD AC#3 specifies raw `orderPath(orderId)`; sibling navigational helpers use `orderUrl` with encoding — intentional divergence documented as a WARNING.
- **Inline icon feedback vs toast:** Matches `TrackingNumberDisplay` and ticket scope; no toast on copy success or failure.
- **Storybook visual states via CSS module:** Hover/focus/active previews use `OrderCopyLinkButton.stories.module.css` with macaw tokens; production view has no story-only props.

## Code changes

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (new, 24 lines) — container wiring `useClipboard` + `getShareableOrderUrl`
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx` (new, 36 lines) — presentational secondary icon button with i18n labels
- `src/orders/components/OrderCopyLinkButton/messages.ts` (new, 14 lines) — `copyOrderLink` / `orderLinkCopied` i18n messages
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (new, 146 lines) — TopNav-context Storybook with state stories
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` (new, 14 lines) — Storybook-only hover/focus/active preview styles
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` (new, 72 lines) — click wiring and disabled-state tests
- `src/orders/utils/getShareableOrderUrl.ts` (new, 6 lines) — absolute shareable order URL helper
- `src/orders/utils/getShareableOrderUrl.test.ts` (new, 56 lines) — URL composition test
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (modified, +2/-0) — render `OrderCopyLinkButton` before metadata button
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` (new, 137 lines) — TopNav placement integration test
- `locale/defaultMessages.json` (modified) — synced message IDs `BLmn1V`, `ThVxK6`

## Deep review verdicts

- **Security**: pass — no auth bypass or credential exposure; WARNING on URL encoding parity and silent clipboard failure (inherited hook)
- **Performance**: pass — ~705 B bundle growth in orders chunk; INP 89 ms; no new dependencies
- **Correctness**: fail (WARNING-only) — all PRD ACs implemented; gaps in AC4 test coverage and URL encoding parity
- **Desktop UX**: pass — placement, keyboard, and click→copied→revert verified in Storybook
- **Mobile UX**: pass — responsive layout at 320–390px; touch uses native button path
- **Simplify**: pass — structural duplication noted (container/view, heavy page test) but no merge blockers

## Open WARNINGs (non-blocking)

- **URL encoding:** `getShareableOrderUrl.ts:5-6` — raw `orderPath(orderId)` diverges from `orderUrl`'s `encodeURIComponent`; may break links for IDs containing `/`
- **Copied state on navigation:** `OrderCopyLinkButton.tsx` / `OrderDetailsPage.tsx:211` — `copied` persists up to 2s when navigating between orders without `key={order.id}`
- **AC4 test gap:** `OrderCopyLinkButton.test.tsx` — no Jest test for post-copy aria-label/icon transition and timer revert
- **Mocked URL tests:** `OrderCopyLinkButton.test.tsx`, `getShareableOrderUrl.test.ts` — production URL shape not exercised end-to-end
- **No Playwright e2e:** `playwright/tests/orders.spec.ts` — no coverage for `copy-order-link`
- **useClipboard timer race:** `src/hooks/useClipboard.ts:18-21` — rapid re-clicks can shorten copied feedback window (pre-existing hook)
- **Silent clipboard failure:** `useClipboard.ts:23-25` — write rejection logs to console only; no user-visible error (pre-existing hook)
- **Simplify debt:** redundant disabled guard, duplicate Storybook fixtures/stories, heavy `OrderDetailsPage` test — maintenance surface only

## Out-of-scope follow-ups

Linear tickets filed for pre-existing shared-hook bugs discovered during deep review:

- [DEV-82](https://linear.app/talktomedi/issue/DEV-82/fixhooks-useclipboard-multi-copy-timeout-race-truncates-success) — fix(hooks): useClipboard multi-copy timeout race truncates success feedback
- [DEV-83](https://linear.app/talktomedi/issue/DEV-83/fixhooks-useclipboard-silent-clipboard-failure-leaves-users-without) — fix(hooks): useClipboard silent clipboard failure leaves users without feedback

## Pipeline metadata

- Prototype iterations: 2
- Implementation loop iterations: 1
- Deep review passes: 1
- Wall-clock: DEV-78 trigger → PR open (2026-05-27)
