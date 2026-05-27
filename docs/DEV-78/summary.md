# Summary: DEV-78 — Copy order link button in order details TopNav

## What shipped

Order details pages now include a secondary icon button in the TopNav, placed immediately before the existing metadata button. One click copies a clean, absolute shareable URL (`origin` + mount prefix + `/orders/{id}`) to the clipboard — no modal query params. Visual feedback follows existing dashboard clipboard patterns: the icon swaps from copy to check for ~2 seconds via `useClipboard`, with i18n labels on `title` and `aria-label`. The button renders only when `order.id` is present. Storybook covers all interaction states; unit and component tests cover URL construction and click behavior.

## Architectural decisions (worth preserving)

- **Clean URL without query params:** `getOrderShareableUrl` uses `orderPath(id)` only, stripping transient modal/dialog state from the address bar so shared links land on the order page.
- **Placement before metadata button:** Copy is a lightweight, frequent action; metadata edit stays adjacent but secondary in reading order.
- **Icon-only secondary button:** Matches existing TopNav metadata `Code` button pattern; avoids crowding the title area.
- **Production CSS `:focus-visible` ring:** Macaw secondary `Button` suppresses default outline; module CSS adds a 2px token-aligned ring. Storybook settled-state previews use `[data-state]` selectors on a wrapper div.
- **Copied Storybook state via preview component:** `Copied` story renders a static preview mirroring post-copy markup rather than relying on interaction-driven clipboard mock timing.

## Code changes

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (new, 51 lines) — copy-link button with `useClipboard`, i18n labels, icon swap
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` (new, 32 lines) — focus-visible, active, disabled, Storybook `[data-state]` previews
- `src/orders/components/OrderCopyLinkButton/messages.ts` (new, 14 lines) — `orderCopyLinkButtonMessages` i18n strings
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (new, 105 lines) — Default, Hover, Focus, Active, Disabled, Copied state stories
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` (new, 82 lines) — click→clipboard, aria-label before/after copy
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (modified, +2 lines) — wire button into TopNav before metadata button
- `src/orders/urls.ts` (modified, +3 lines) — add `getOrderShareableUrl` helper
- `src/orders/urls.test.ts` (modified, +57 lines) — mount-prefix and root-deploy URL cases
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` (modified, +12/-6 lines) — optional `size` / `strokeWidth` props for TopNav sizing
- `locale/defaultMessages.json` (modified, +8 lines) — extracted copy-link message strings

## Deep review verdicts

- **Security**: pass — client-only UI, no new dependencies, auth boundary unchanged (`MANAGE_ORDERS`)
- **Performance**: pass — ~402 B gzip bundle growth, URL built on click only, sub-50 ms INP in Storybook trace
- **Correctness**: pass (WARNING-only) — implementation matches PRD; integration/title/icon-swap test gaps flagged
- **Desktop UX**: pass (WARNING-only) — keyboard and visual states work; screen-reader copy-success announcement gap
- **Mobile UX**: pass — 32×32 px matches existing TopNav icon convention, no overflow at 320–390 px widths
- **Simplify**: pass (WARNING-only) — production code lean; Storybook/CSS duplication flagged

## Open WARNINGs (non-blocking)

- `OrderCopyLinkButton.tsx` L28–30, L46–47 — Copy success may not be announced to screen readers (no `aria-live` region; dynamic `aria-label` on focused button may not re-announce)
- `OrderDetailsPage.tsx` L211–219 — TopNav integration placement/guard lacks automated test
- `OrderCopyLinkButton.test.tsx` — Component tests omit `title` attribute and icon-swap assertions
- `OrderCopyLinkButton.stories.tsx` L79–101 — Copied story duplicates production Button markup
- `OrderCopyLinkButton.stories.tsx` L48–69 — Hover/Focus/Active stories repeat identical wrapper pattern
- `OrderCopyLinkButton.module.css` L1–32 — CSS duplicates production pseudo-class rules for Storybook previews

## Out-of-scope follow-ups

- [DEV-80](https://linear.app/talktomedi/issue/DEV-80/fixdesign-system-increase-macaw-secondary-icon-button-touch-targets-to) — macaw secondary icon buttons measure 32×32 px, below WCAG 44×44 pt (pre-existing TopNav convention)
- [DEV-81](https://linear.app/talktomedi/issue/DEV-81/fixorders-align-orderpath-url-encoding-with-orderurl) — `orderPath` vs `orderUrl` encodeURIComponent inconsistency (pre-existing URL helper debt)

## Pipeline metadata

- Prototype iterations: 2
- Implementation loop iterations: 4
- Deep review passes: 1
- Wall-clock: 2026-05-27 trigger → PR open
