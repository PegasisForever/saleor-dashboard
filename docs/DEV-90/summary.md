# Summary: DEV-90 — Copy order link button in order details TopNav

## What shipped

Staff users on order details can copy a shareable absolute URL for the current order from a new secondary icon button in the TopNav, placed immediately before the metadata control. One click writes the URL to the clipboard via the existing `useClipboard` hook; success is shown with a copy→check icon swap, updated `aria-label`/`title`, and a polite `aria-live` status region for ~2 seconds. The button is omitted when `order.id` is missing and remounts on order navigation (`key={order.id}`) so copied feedback never carries across orders. A shared-hook fix clears pending reset timers on rapid re-clicks so the 2s feedback window always starts from the latest copy.

## Architectural decisions (worth preserving)

- **`key={order.id}` remount over `useEffect` reset:** Guarantees fresh `useClipboard` state on in-app order navigation without coupling the button to parent lifecycle details; matches `CustomerOrders` list precedent.
- **`clear()` at start of `useClipboard.copy()`:** Fixes timer overlap for all clipboard consumers when users double-click; localized one-line change in the shared hook rather than debouncing only this button.
- **Dual SR feedback (button label + `role="status"` live region):** Mouse users and users who move focus after click get spoken confirmation; accepts possible duplicate announcement on some mobile SR engines as a known follow-up.
- **`:active svg` icon darken in CSS module:** Macaw `default2` icon on `default3` pressed background fails WCAG 2.5.5 non-text contrast; production and Storybook `forceActive` share the same rule.
- **`getShareableOrderUrl` colocated with the button:** Composes `orderUrl` + `getAppMountUriForRedirect` + `window.location.origin` the same way auth redirect URLs are built; unit-tested for default mount, subpath mount, and encoded IDs.

## Code changes

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (new, 67 lines) — TopNav copy button with i18n labels, clipboard handler, aria-live region
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` (new, 51 lines) — hover/focus/active/disabled styles and sr-only status region
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` (new, 9 lines) — absolute shareable URL builder
- `src/orders/components/OrderCopyLinkButton/messages.ts` (new, 14 lines) — `orderCopyLinkButtonMessages` i18n catalog
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` (new, 231 lines) — mock + real-hook transition + remount tests
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` (new, 77 lines) — URL builder unit tests
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (new, 123 lines) — state stories and TopNav composition stories
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (modified, +2 lines) — render `OrderCopyLinkButton` before metadata with `key={order.id}`
- `src/hooks/useClipboard.ts` (modified, +1 line) — `clear()` before scheduling reset on successful copy
- `src/hooks/useClipboard.test.ts` (modified, +39 lines) — rapid re-click timer extension test

## Deep review verdicts

- **Security**: pass — no new findings; clipboard path reuses established patterns, no XSS/open-redirect/session leakage in diff
- **Performance**: pass — INP ~52 ms on copy click; aria-live mount and `key` remount are intentional negligible tradeoffs
- **Correctness**: pass — URL encoding, click payload, remount guard, and real-hook AC3 transition test verified; open test-gap WARNINGs deferred OOS
- **Desktop UX**: pass — TopNav placement and feedback states verified in Storybook; keyboard works at runtime, Enter/Space test deferred OOS
- **Mobile UX**: pass — 32×32 touch target matches siblings; cosmetic hover-stickiness and duplicate SR announce deferred as polish
- **Simplify**: pass — Storybook `force*` props and minor duplication are maintainer ergonomics only; no runtime defects

## Open WARNINGs (non-blocking)

- `desktop-ux/F-002` — TopNav tab order shifts when copy button mounts after `order.id` resolves (`OrderDetailsPage.tsx:211`)
- `mobile-ux/F-001` — sticky `:hover` background on touch devices (`OrderCopyLinkButton.module.css:1-3`)
- `mobile-ux/F-002` — duplicate "Order link copied" from button label + live region (`OrderCopyLinkButton.tsx:56-64`)
- `mobile-ux/F-003` — narrow Storybook story understates production title crowding at 320px
- `performance/F-001` — ambient Form render-prop re-renders on metadata keystrokes (sibling TopNav pattern)
- `performance/F-002` — aria-live span mounts each copy cycle (intentional a11y tradeoff)
- `performance/F-003` — `key={order.id}` remount on order navigation (correctness tradeoff, negligible cost)
- `simplify/F-001`–`F-006` — Storybook `force*` props, duplicate `formatMessage`, test stub duplication, colocation preference (maintainer polish)

## Out-of-scope follow-ups

Linear tickets filed for deferred deep-review test hardening:
- [DEV-91](https://linear.app/talktomedi/issue/DEV-91) — keyboard Enter/Space activation test (`desktop-ux/F-001`)
- [DEV-92](https://linear.app/talktomedi/issue/DEV-92) — `OrderDetailsPage` TopNav placement integration test (`correctness/F-001`)
- [DEV-93](https://linear.app/talktomedi/issue/DEV-93) — Playwright E2E copy-order-link flow (`correctness/F-002`)

## Pipeline metadata

- Prototype iterations: 2
- Implementation loop iterations: 7
- Deep review passes: 4
- Wall-clock: planning → PR open (DEV-90 benchmark run, May 2026)
