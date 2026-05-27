# Summary: DEV-75 — Order details copy-link button

## What shipped

Staff can copy a shareable order URL directly from the order details TopNav without touching the browser address bar. A new icon button sits immediately left of the existing metadata button; one click writes an absolute dashboard URL (`{origin}{mountUri}/orders/{encodedOrderId}`) to the clipboard and shows copy-to-check icon feedback for ~2 seconds via the existing `useClipboard` hook. The button is fully internationalized, keyboard-accessible, and wired into production `OrderDetailsPage` as well as Storybook TopNav placement stories.

## Architectural decisions (worth preserving)

- **`orderPath` over `orderUrl`**: Share links use `orderPath(encodeURIComponent(orderId))` so copied URLs never include dialog/query params (e.g. open-metadata modal state).
- **`getAppMountUriForRedirect()` for mount URI**: Matches auth/staff absolute-URL pattern so non-default `APP_MOUNT_URI` deployments produce correct share links.
- **`previewState` prop for Storybook static states**: Production component accepts an optional Storybook-only prop with CSS mirror classes (`.buttonPreviewHover/Focus/Active`) so each visual state renders a distinct static canvas without story-isolated CSS — intentional tradeoff documented in ui-design.
- **Reuse existing clipboard stack**: No new hook or icon — `useClipboard` + `ClipboardCopyIcon` match patterns in `OrderCustomer`, `TrackingNumberDisplay`, etc.
- **Focus/active styles in production CSS module**: `:focus-visible` ring and `:active` scale live in `OrderCopyLinkButton.module.css`, not story-only stylesheets.

## Code changes

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (new, 59 lines) — icon button with clipboard handler, i18n labels, optional Storybook `previewState`
- `src/orders/components/OrderCopyLinkButton/getOrderAbsoluteUrl.ts` (new, 11 lines) — absolute URL builder using origin + mount URI + encoded order path
- `src/orders/components/OrderCopyLinkButton/messages.ts` (new, 14 lines) — `copyOrderLink` and `orderLinkCopied` i18n messages
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` (new, 18 lines) — focus ring, active scale, Storybook preview mirror classes
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (new, 103 lines) — six static state stories in TopNavShell wrapper
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (modified, +2 lines) — renders `<OrderCopyLinkButton orderId={order.id} />` before metadata button
- `locale/defaultMessages.json` (modified, +8 lines) — extracted copy-link message strings

## Deep review verdicts

- **Security**: pass — same-origin URL, no secrets, auth boundary unchanged; copied links still require staff login + `MANAGE_ORDERS`
- **Performance**: pass — ~1.7 KiB bundle delta, sub-5ms click handler, no network on copy
- **Correctness**: pass (WARNINGs only) — all 9 PRD ACs satisfied; mechanical test-coverage checks fail but no production BLOCKERs
- **Desktop UX**: pass — click/keyboard copy, 2s feedback, TopNav placement verified via Storybook + source review
- **Mobile UX**: pass — 32×32 touch targets, no overflow at 320–390px, correct focus order
- **Simplify**: pass — well-factored reuse of existing abstractions; minor Storybook coupling WARNINGs

## Open WARNINGs (non-blocking)

- **No unit test for `getOrderAbsoluteUrl`** — `src/orders/components/OrderCopyLinkButton/getOrderAbsoluteUrl.ts` — URL builder (mount URI, encoding, no query params) lacks Jest coverage
- **No Playwright E2E for copy-link** — PRD AC5 specifies `data-test-id="copy-order-link"` but no Playwright spec asserts button presence or copy behavior on order details
- **Storybook Default story lacks interactive copy play** — `OrderCopyLinkButton.stories.tsx:55-57` — primary click→clipboard→2s-revert flow not automated in CI
- **Storybook plays use hardcoded English strings** — `OrderCopyLinkButton.stories.tsx:64,73,100-101` — should assert `messages.*.defaultMessage` instead of literals
- **`previewState` expands production component API** — `OrderCopyLinkButton.tsx:12-43` — Storybook-only prop/type/CSS ships in production bundle (intentional per ui-design)
- **Redundant Hover/Focus/Active story play functions** — `OrderCopyLinkButton.stories.tsx:59-83` — duplicate low-value assertions that don't guard state-specific visuals

## Out-of-scope follow-ups

Linear tickets filed for pre-existing or platform-level issues discovered during review:

- [DEV-76](https://linear.app/talktomedi/issue/DEV-76) — i18n: hardcoded "Edit order metadata" title on OrderDetailsPage metadata button (pre-existing)
- [DEV-77](https://linear.app/talktomedi/issue/DEV-77) — design-system: macaw secondary button border contrast 1.35:1 below WCAG 3:1 non-text UI threshold (platform-wide)

## Pipeline metadata

- Prototype iterations: 3
- Implementation loop iterations: 2
- Deep review passes: 1
- Wall-clock: DEV-75 trigger → PR open (~2026-05-27)
