---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-3
input_branch: 6feae83ec628e0296d8e2a3652c5db5ed4b58877
verdict: pass
---

## Summary

Pass-3 mobile-UX deep review of the order-copy-link-button area finds no BLOCKERs. Production app was unreachable; Storybook fallback at 320–390 px confirms copy button placement (32×32, before metadata, no horizontal scroll) and touch tap activation. Iter-5 test additions (remount guard, copied-state aria/title assertions) do not change mobile runtime behavior. Three WARNINGs remain from prior implementation: touch `:hover` stickiness, duplicate screen-reader paths on copy success, and narrow Storybook title fidelity vs production `<Title>` crowding.

## Findings

### F-001 [WARNING] Touch `:hover` background sticks after tap on copy button

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-3`
- Description: Hover styles apply without a `@media (hover: hover)` guard. On touch browsers the first tap can leave the copy button on `--mu-colors-background-default2` while adjacent TopNav controls return to default white.
- Trigger: On a mobile viewport (320–390 px width, touch device or touch emulation), staff single-taps the copy-link icon button once and lifts their finger without tapping elsewhere on the page.
- Impact: Copy button appears visually “selected” (lighter gray background) next to the metadata button for seconds after tap, suggesting unequal affordance state even when copied feedback has not yet appeared or has already reset.
- Evidence: Chrome walkthrough at 320×568 after tap measured copy button `background: rgb(249, 250, 249)` vs metadata `rgb(255, 255, 255)`; screenshot `docs/DEV-90/review/pass3-mobile-320x568-after-tap-v2.png`. Sibling pattern exists at `src/orders/components/OrderSummary/OrderValue.module.css:24-28` using `@media (hover: hover)`.
- Suggested fix: Wrap `.button:hover:not(:disabled)` (and `.buttonForceHover` if needed) in `@media (hover: hover) { ... }` to match the OrderSummary pattern.

### F-002 [WARNING] Duplicate screen-reader announcement on successful copy

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,56-57,60-64`
- Description: On copy success the button `aria-label`/`title` update to “Order link copied” while a sibling `role="status" aria-live="polite"` region mounts with the same string. Mobile VoiceOver/TalkBack may announce the success twice.
- Trigger: Staff taps copy-link on a mobile device with screen reader enabled; clipboard write succeeds within ~500 ms.
- Impact: User hears “Order link copied” twice in quick succession (button name change + live region insertion), which is redundant and can feel noisy on touch-first SR workflows.
- Evidence: Component renders both paths when `isCopied` is true; unit test asserts status region at `OrderCopyLinkButton.test.tsx:82-88` but not announcement count. Copied story a11y snapshot shows button label only (`docs/DEV-90/review/pass3-mobile-a11y-copied-state.txt`); live region is visually hidden via `.statusRegion` clip (`OrderCopyLinkButton.module.css:41-50`) but still present in DOM per source.
- Suggested fix: Pick one SR channel—either keep dynamic `aria-label` and drop the live region, or keep the live region and leave the button name static during the 2 s window (document choice in component).

### F-003 [WARNING] Narrow TopNav story understates production title crowding on mobile

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:93-95` vs `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210`
- Description: `InOrderDetailsTopNavNarrow` uses a plain string title `"Order #1234"`. Production passes `<Title order={order} />`, which renders order number + status pill + created date in a flex row (`Title.tsx:42-62`), consuming more horizontal space beside the nowrap action cluster (`TopNav/Root.tsx:68-74`).
- Trigger: Staff opens order details on a 320 px-wide phone; title includes status pill and date line while three icon actions (copy, metadata, menu) share the header row.
- Impact: Storybook narrow layout review may miss title truncation or action-cluster squeeze that only appears with the real `Title` composition; no automated mobile integration test covers production TopNav wiring.
- Evidence: Story render at `OrderCopyLinkButton.stories.tsx:94`; production at `OrderDetailsPage.tsx:210-211`; `Title.tsx:43-62` multi-part layout; no Playwright coverage for `copy-order-link` (grep across `playwright/` returns zero hits).
- Suggested fix: Extend `InOrderDetailsTopNavNarrow` to use a `Title` fixture matching production shape, or add a narrow-viewport component/integration test rendering `OrderDetailsPage` TopNav with a realistic order fixture.

## Files / sections inspected

### Touched files (coordinator scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — tap handler, copied label swap, aria-live status region, 32×32 secondary button.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/active/focus styles; ungated `:hover` flagged F-001.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — `InOrderDetailsTopNavNarrow` mobile1 viewport story; plain title vs production gap (F-003).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — iter-5 remount + copied aria/title tests; no mobile viewport coverage.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — absolute URL builder; encode via `orderUrl`.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — encoding/mount URI cases.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n labels for default/copied states.
- `src/hooks/useClipboard.ts` — 2 s feedback timer; iter-2 `clear()` before reschedule.
- `src/hooks/useClipboard.test.ts` — rapid re-copy timer test (pass-2 fix retained).
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-221` — TopNav integration with `key={order.id}` remount guard.

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production; respects `order?.id` guard, passes `key={order.id}` + `orderId={order.id}`); `OrderCopyLinkButton.stories.tsx:95,118` (Storybook only).
- `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` (sole production caller); tests at `getShareableOrderUrl.test.ts`, `OrderCopyLinkButton.test.tsx`.
- `orderCopyLinkButtonMessages` — `OrderCopyLinkButton.tsx:9,38-40,62` only (module-local export).

### Parent / host components

- `OrderDetailsPage.tsx:210-221` — Renders copy button as first TopNav child when `order?.id` present; metadata button follows; optional `order` handled with `order?.id` guard — wire-up correct for loading/empty id states.
- `TopNav/Root.tsx:57-83` — Action cluster `flexWrap="nowrap"`, title ellipsis; copy button stays in header row on narrow viewports.
- `TopNav/TopNavWrapper.tsx:30-48` — Header container; `position="relative"` for absolutely positioned status region.

### Integration dependencies

- `useClipboard.ts:12-27` — Clipboard write + 2 s copied state; silent failure path (PRD out-of-scope for toast).
- `ClipboardCopyIcon.tsx:8-15` — 16 px copy/check icon swap.
- `orders/urls.ts:234-235` — `orderUrl` with `encodeURIComponent`.
- `utils/urls.ts:27-28` — `getAppMountUriForRedirect`.
- `Title.tsx:26-64` — Production TopNav title composition (pill + date).

### Tests reviewed

- `OrderCopyLinkButton.test.tsx:70-125` — iter-5 copied aria/title + remount guard (simulates `key={order.id}` navigation).
- `useClipboard.test.ts:105-141` — rapid re-copy timer behavior.
- No Playwright/mobile viewport tests for this feature.

### Planning artifacts

- `docs/DEV-90/prd.md` — TopNav placement, feedback, i18n ACs.
- `docs/DEV-90/ui-design.md:31-35` — 32×32 touch target, mobile TopNav notes (wrap claim vs `nowrap` implementation noted but not filed — title ellipsis handles narrow widths in walkthrough).
- `docs/DEV-90/tech-plan.md` — architecture map and clipboard risk table.

### Chrome walkthrough evidence

- `docs/DEV-90/review/pass3-mobile-320x568-narrow-iframe.png`, `pass3-mobile-375x812-narrow.png`, `pass3-mobile-390x844-narrow.png` — responsive layout.
- `docs/DEV-90/review/pass3-mobile-320x568-after-tap-v2.png` — post-tap hover stickiness.
- `docs/DEV-90/review/pass3-mobile-copied-state-390.png` — forceCopied visual state.
- `docs/DEV-90/review/pass3-mobile-a11y-baseline-320-iframe.txt`, `pass3-mobile-a11y-after-tap-320.txt`, `pass3-mobile-a11y-copied-state.txt` — a11y tree excerpts.
