---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-4
input_branch: 09886983335621e9c0048186f6f51d0f16611441
verdict: pass
---

## Summary

Pass-4 cumulative diff for `order-copy-link-button` adds only the iter-7 real-hook click→copied transition test atop unchanged production mobile surfaces. Batched chrome walkthrough on published Storybook at 320–390 px viewports confirms copy-before-metadata placement, 32×32 tap targets, and aria-label/title updates after tap (with clipboard stub). Production app unreachable (environmental skip). Three WARNINGs remain on touch hover stickiness, duplicate SR paths, and narrow-story fidelity; one SHOULD-FIX for missing status-region assertion in the new transition test. No BLOCKERs.

## Findings

### F-001 [WARNING] Touch `:hover` background sticks after tap on mobile
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-3`
- Description: Hover background styling is applied via ungated `:hover` pseudo-class. On touch devices, the first tap often leaves the element in a sticky `:hover` state until the user taps elsewhere.
- Trigger: Staff taps the copy button once on a touch phone (320–390 px viewport, iOS Safari or Android Chrome). No second tap elsewhere within ~5 s.
- Impact: Copy button retains a gray hover background (`--mu-colors-background-default2`) while adjacent metadata and overflow buttons stay on the default white background, making the tapped control look visually “selected” or stuck compared to its neighbors.
- Evidence: Ungated rule at `OrderCopyLinkButton.module.css:1-3`. Codebase precedent for touch-safe hover gating exists at `src/orders/components/OrderSummary/OrderValue.module.css:24-28` (`@media (hover: hover)`).
- Suggested fix: Wrap hover rules in `@media (hover: hover) { .button:hover:not(:disabled) { … } }` (and `.buttonForceHover` if needed for Storybook pinning only).

### F-002 [WARNING] Duplicate screen-reader announcements on copy success
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,56-57,60-63`
- Description: On successful copy, both the button’s dynamic `aria-label`/`title` and a separate `role="status" aria-live="polite"` region announce the same “Order link copied” string.
- Trigger: Staff taps copy button once with VoiceOver (iOS) or TalkBack (Android) enabled; clipboard write succeeds.
- Impact: Assistive technology may announce “Order link copied” twice in quick succession — once from the button accessible-name change and once from the live region — adding noise on mobile SR paths where users rely on concise feedback.
- Evidence: Label swap at `OrderCopyLinkButton.tsx:38-40,56-57`; live region mount at `:60-63` with identical i18n string. Unit test requires both paths at `OrderCopyLinkButton.test.tsx:94-97`.
- Suggested fix: Pick one announcement channel for mobile SR (either dynamic `aria-label` on the button OR the `aria-live` region, not both). If keeping the live region, consider `aria-hidden="true"` on the button label change path or omit the status span.

### F-003 [WARNING] Narrow Storybook composition understates production TopNav crowding
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:94-95` vs `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210` and `src/orders/components/OrderDetailsPage/Title.tsx:43-62`
- Description: `InOrderDetailsTopNavNarrow` uses a plain string title `"Order #1234"` while production order details renders `<Title order={order} />` with order number, status pill, and created date in a multi-part flex row.
- Trigger: Staff opens order details on a 320 px phone for an order with a long status label (e.g., “Waiting to fulfill”) and multi-digit order number.
- Impact: Storybook narrow-layout checks pass, but production title consumes more horizontal flex budget before ellipsis kicks in (`TopNav/Root.tsx:59-66`). Icon actions likely remain visible (nowrap cluster at `:68-74`), but title truncation/clipping severity at real-world title widths is unverified — staff may see aggressive “Order …” ellipsis while actions stay fixed width.
- Evidence: Story title at `OrderCopyLinkButton.stories.tsx:94`; production wiring at `OrderDetailsPage.tsx:210-211`; multi-part title at `Title.tsx:43-62`. Grep `playwright/` for `copy-order-link` → 0 hits.
- Suggested fix: Extend `InOrderDetailsTopNavNarrow` to render a production-like `<Title>` fixture (long pill + date), or add a Playwright mobile viewport test on real `OrderDetailsPage`.

### F-004 [SHOULD-FIX] Real-hook transition test omits aria-live status region assertion
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:188-230` (iter-7 delta)
- Description: The new “click to copied feedback transition” integration test exercises the real `useClipboard` hook and asserts aria-label, title, and icon swap, but does not assert that the `role="status"` live region mounts after click.
- Trigger: N/A — test gap at CI time; would surface if a future change broke status-region conditional render on the real hook path.
- Impact: Mobile screen-reader path partially unguarded: regressions removing or failing to mount the live region on tap would not fail the iter-7 test, while the mocked copied-state test (`:79-97`) would still pass when `copied` is injected directly.
- Evidence: Transition test asserts label/icon at `:215-218` but no `getByRole("status")`. Mocked test asserts status region at `:91-97`. Source renders region when `isCopied` at `OrderCopyLinkButton.tsx:60-64`.
- Suggested fix: After the click + `waitFor` block in the transition test, add `expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite")` and text-content assertion matching `orderLinkCopied`.

## Files / sections inspected

### Touched files (pass-4 cumulative diff since `45b5cef8`)
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — tap handler, label swap, aria-live status region, 32×32 secondary icon button
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/focus/active/disabled + visually-hidden status region styles
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — `InOrderDetailsTopNav` / `InOrderDetailsTopNavNarrow` mobile composition stories
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — iter-7 real-hook transition test delta; remount + mocked copied tests
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — absolute URL builder delegating to `orderUrl`
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n labels for default/copied states
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232` — TopNav parent wire-up with `order?.id` guard and `key={order.id}`
- `src/hooks/useClipboard.ts` — 2 s copied timer, silent `.catch`, unmount cleanup
- `src/hooks/useClipboard.test.ts` — referenced for timer/remount behavior (not re-run; node_modules absent)

### Export call sites
- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production: `{order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}`; respects optional order guard); `OrderCopyLinkButton.stories.tsx:95` (Storybook TopNav composition)
- `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` (sole production caller); `getShareableOrderUrl.test.ts` and `OrderCopyLinkButton.test.tsx` (tests only)

### Parent / host components
- `OrderDetailsPage.tsx:206-233` — Form render-prop wraps TopNav; copy button first action child when `order?.id` present; metadata + menu follow
- `src/components/AppLayout/TopNav/Root.tsx:57-83` — nowrap action cluster, title ellipsis; mobile layout host
- `src/components/AppLayout/TopNav/TopNavWrapper.tsx:30-48` — fixed header height, `position="relative"` for status region positioning context
- `src/orders/components/OrderDetailsPage/Title.tsx:42-62` — production title width (pill + date) vs narrow story plain string

### Integration dependencies
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:8-15` — 16 px copy/check icon swap
- `src/orders/urls.ts:234-235` — `orderUrl` with `encodeURIComponent` (via grep/diff)
- `docs/DEV-90/prd.md`, `docs/DEV-90/ui-design.md` — mobile ACs (32×32 target, TopNav placement, copied feedback)

### Tests overlapping
- `OrderCopyLinkButton.test.tsx` — click, copied aria/title, remount key guard, iter-7 real-hook transition
- `getShareableOrderUrl.test.ts` — URL encoding adversarial cases
- Grep `playwright/**` for `copy-order-link` → no matches

### Chrome walkthrough artifacts
- `docs/DEV-90/review/mobile-responsive-320x568.png`, `mobile-responsive-375x812.png`, `mobile-responsive-390x844.png` — layout at three mobile widths
- `docs/DEV-90/review/mobile-after-tap-390.png`, `mobile-after-tap-390-a11y.txt` — post-tap button label update
- `docs/DEV-90/review/mobile-copied-story-a11y.txt` — Copied story a11y tree (deployed artifact lacks status region node; source + unit tests confirm region in current HEAD)
