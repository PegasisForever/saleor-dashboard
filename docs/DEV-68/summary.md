# Summary: DEV-68 — Copy order link button in order details TopNav

## What shipped

Staff viewing a normal or unconfirmed order can copy a clean, shareable dashboard URL from a new icon button in the order details TopNav, placed immediately left of the metadata control. The button reuses `useClipboard` and `ClipboardCopyIcon` for a two-second copy-to-checkmark confirmation, writes an absolute path without modal query params via `getAbsoluteOrderUrl`, and is excluded from draft order views. Storybook covers all interaction states plus an `InTopNav` placement story; integration and URL unit tests guard TopNav wiring and subpath mounts.

## Architectural decisions (worth preserving)

- **Absolute URL via `getAppMountUriForRedirect()` + `urlJoin`**: Matches auth redirect and datagrid anchor patterns so shared links work when the dashboard is mounted under a subpath.
- **Icon-toggle feedback only (no toast)**: Aligns with existing orders-domain copy patterns (tracking number, PSP reference) rather than gift-card toast flows.
- **Storybook pseudo-states via macaw-token decorators**: `Hover`/`Active`/`Focus` stories use inline `<style>` decorators because Storybook cannot persist `:hover`/`:focus-visible` after `play` completes; production still uses native macaw pseudo-classes.
- **`showCopiedState` prop for `Copied` story**: Storybook-only override avoids the 2s `useClipboard` timeout resetting the settled check-icon render (trade-off: widens production prop surface — see open WARNINGs).
- **Draft orders omitted**: `OrderDraftPage` uses a separate TopNav without metadata; copy button intentionally not added per PRD scope.

## Code changes

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (new, 45 lines) — copy-link icon button with clipboard hook and i18n labels
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (new, 111 lines) — six state stories + `InTopNav` composition
- `src/orders/components/OrderCopyLinkButton/messages.ts` (new, 14 lines) — `copyOrderLink` / `linkCopied` messages
- `src/orders/urls.ts` (modified, +12/-1) — `getAbsoluteOrderUrl(orderId)` helper
- `src/orders/urls.test.ts` (new, 54 lines) — subpath mount, encoding, no-query-string tests
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (modified, +2) — wire button before metadata
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` (new, 141 lines) — TopNav placement and clipboard invocation

## Deep review verdicts

- **Security**: pass — client-only clipboard; encoded order ID; no secrets or auth bypass in copied URL
- **Performance**: pass — sub-kB bundle delta; INP 39 ms on Storybook click trace; URL built on click only
- **Correctness**: pass — all nine PRD ACs satisfied; one WARNING on missing copied-state label test
- **Desktop UX**: pass — placement, keyboard, clipboard mock, disabled state verified via Storybook `InTopNav`
- **Mobile UX**: pass — 32×32 tap targets match metadata sibling; no overflow at 320/375 widths
- **Simplify**: fail (WARNING-only) — Storybook prop leak, layout duplication, urlJoin guard, heavy page mocks
- **Migration safety** / **Public API surface**: not run (frontend-only leaf feature)

## Open WARNINGs (non-blocking)

- `OrderDetailsPage.test.tsx:12-14` — integration test mocks `useClipboard` with `copied: false` permanently; aria-label swap to "Link copied" (PRD AC5) not asserted in CI
- `OrderCopyLinkButton.tsx:9-14,19,23` — `showCopiedState` prop is Storybook-only but exposed on production component API
- `OrderCopyLinkButton.stories.tsx:98-109` vs `OrderDetailsPage.tsx:210-219` — `InTopNav` story duplicates TopNav action cluster markup
- `src/orders/urls.ts:194-201` — redundant `relativePath.slice(1)` guard before `urlJoin` (other call sites pass leading-slash paths directly)
- `OrderDetailsPage.test.tsx:1-141` — ~15 module mocks for a single TopNav placement assertion; no focused `OrderCopyLinkButton.test.tsx`

## Out-of-scope follow-ups

Linear tickets filed for pre-existing / platform-level issues discovered during prototype UI review (not introduced by this PR's diff):

- [DEV-69](https://linear.app/talktomedi/issue/DEV-69) — macaw compact secondary icon buttons below 44×44 touch-target convention
- [DEV-70](https://linear.app/talktomedi/issue/DEV-70) — TopNav back navigation lacks accessible name and has nested button-in-link pattern

## Pipeline metadata

- Prototype iterations: 3
- Implementation loop iterations: 2
- Deep review passes: 1
- Wall-clock: ~50 minutes (DEV-68 ticket created 2026-05-26T09:07 UTC → PR open)
