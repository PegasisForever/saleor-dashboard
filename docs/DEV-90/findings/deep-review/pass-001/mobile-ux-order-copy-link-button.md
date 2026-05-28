---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-1
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
verdict: pass
---

## Summary

Mobile-UX review of the order-copy-link-button feature finds the integration sound for touch use: the button sits before metadata in TopNav, matches adjacent 32×32 secondary icon controls, and the action row fits without horizontal scroll at 320–390 px in Storybook narrow composition. Production app was unreachable (`localhost:9000` connection refused); verification used Storybook `InOrderDetailsTopNavNarrow` plus source tracing. Three non-blocking warnings remain around screen-reader announcement of copy success, narrow-story fidelity vs production title width, and ungated `:hover` styles on touch devices.

## Findings

### F-001 [WARNING] Copy success not announced to mobile screen readers

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-56`
- Description: After a successful copy, the component updates `aria-label` and `title` to "Order link copied" but provides no `aria-live` region or `role="status"`. Mobile screen readers (VoiceOver, TalkBack) typically do not re-announce a focused button when its `aria-label` changes programmatically.
- Trigger: Staff user on a 375×812 mobile viewport with VoiceOver or TalkBack enabled taps the copy-link button once; clipboard write succeeds within ~50 ms.
- Impact: User hears "Copy order link, button" on focus but receives no spoken confirmation that the link was copied; only the 16 px icon swap from copy to check is visible, which may be missed on small screens.
- Evidence: Label binding at `OrderCopyLinkButton.tsx:38-40,54-56`; no live region in component or `messages.ts`. Copied-state a11y tree shows updated `aria-label` but requires manual re-exploration to discover.
- Suggested fix: Add a visually hidden `aria-live="polite"` element that mirrors the copied message for ~2 s, or use `role="status"` with the copied string when `isCopied` is true.

### F-002 [WARNING] Narrow Storybook composition understates production mobile header width pressure

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:94-95` vs `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-211`
- Description: `InOrderDetailsTopNavNarrow` renders TopNav with a plain string title `"Order #1234"`, while production passes the multi-part `<Title order={order} />` node (order number + status pill + created date). Mobile layout verification therefore does not stress the same horizontal competition between title content and the now-three-button action cluster.
- Trigger: Staff opens order details on a 320 px-wide phone for an order with a long localized status label (e.g., "Waiting for capture") and a multi-digit order number; TopNav action row includes back, copy, metadata, and overflow menu.
- Impact: Order header text may truncate or clip more aggressively than the narrow Storybook story suggests, while icon buttons remain fixed width; users may lose readable order context before perceiving the new copy control.
- Evidence: Story title at `OrderCopyLinkButton.stories.tsx:94`; production wiring at `OrderDetailsPage.tsx:210-211`; `Title.tsx:42-63` flex layout with pill and date; `TopNav/Root.tsx:59-74` gives title `overflow="hidden"` and actions `flexWrap="nowrap"`. Chrome walkthrough at 320×568 on the story showed no horizontal scroll but used the simple title.
- Suggested fix: Extend `InOrderDetailsTopNavNarrow` to render a fixture-based `<Title order={…} />` matching production structure, or add a Playwright mobile viewport test on the real order-details page.

### F-003 [WARNING] Hover styles not gated for touch-only devices

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-3`
- Description: The button applies `:hover` background styling without `@media (hover: hover)` guard. On many mobile browsers, `:hover` can persist after tap until another tap elsewhere, making the copy button appear "stuck" in hover state.
- Trigger: Staff taps the copy-link button on an iOS Safari or Android Chrome session at 390×844; finger lifts after ~200 ms tap.
- Impact: Button background may remain at `--mu-colors-background-default2` until the user taps elsewhere, visually suggesting a different interaction state than adjacent metadata/menu controls that share the same Macaw defaults but lack custom hover rules.
- Evidence: Ungated rule at `OrderCopyLinkButton.module.css:1-3`; contrast with touch-safe pattern in `src/orders/components/OrderSummary/OrderValue.module.css:24-28` using `@media (hover: hover)`.
- Suggested fix: Wrap hover rules in `@media (hover: hover) { … }`; retain `:active` rules for press feedback on touch.

## Files / sections inspected

### Touched files (coordinator scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — component props, tap handler, aria-label/title state machine, Macaw secondary button wiring.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/focus/active/disabled pseudo-states; no responsive or touch-action rules.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories and `InOrderDetailsTopNav` / `InOrderDetailsTopNavNarrow` compositions.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — absolute URL builder via `orderUrl` + mount URI.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n labels for default and copied states.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232` — TopNav integration with conditional `order?.id` guard.

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` renders `<OrderCopyLinkButton orderId={order.id} />` only when `order?.id` is truthy; contract respected. `OrderCopyLinkButton.stories.tsx:95` Storybook composition; contract respected.
- `getShareableOrderUrl` — exported in diff; sole caller is `OrderCopyLinkButton.tsx:33` per `git grep getShareableOrderUrl` (component-internal).
- `orderCopyLinkButtonMessages` — exported in diff; sole consumer is `OrderCopyLinkButton.tsx:9,38-40` per repo grep.

### Parent / host components

- `OrderDetailsPage.tsx:210-232` — TopNav host; passes `orderId={order.id}` behind `order?.id` guard; copy renders before metadata `Button` and `TopNav.Menu`; loading/empty states omit button correctly.
- `TopNav/Root.tsx:57-83` — action cluster parent; `flexWrap="nowrap"`, `gap={2}`; children include copy + metadata + menu; title column ellipsizes with `overflow="hidden"`.
- `TopNav/TopNavWrapper.tsx:30-48` — fixed 77 px header height, horizontal padding; affects mobile usable width.
- `TopNav/Menu.tsx:17-27` — adjacent overflow menu trigger; secondary icon button, `align="end"` dropdown.

### Integration dependencies

- `src/hooks/useClipboard.ts` — async clipboard write, 2 s copied timer, silent catch on failure; unmount cleanup clears scheduled timeout only if already set.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — 16 px copy/check icon swap reused from orders domain.
- `src/orders/urls.ts:234-235` — `orderUrl` with `encodeURIComponent` and trailing `?`.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` for subpath deployments.
- `src/orders/components/OrderDetailsPage/Title.tsx:42-63` — production title complexity (pill + date) affecting mobile header width.

### Tests overlapping

- No unit/component tests for `OrderCopyLinkButton` or `getShareableOrderUrl` (grep across `src/` and `playwright/` returned zero matches).
- `src/hooks/useClipboard.test.ts` — hook-level clipboard tests; does not cover TopNav mobile integration or post-unmount async race.
- `OrderCopyLinkButton.stories.tsx:118-122` — `InOrderDetailsTopNavNarrow` with `mobile1` viewport; only automated narrow-layout surface.

### Planning artifacts

- `docs/DEV-90/prd.md` — acceptance criteria for placement, feedback, touch-target parity with neighbors.
- `docs/DEV-90/ui-design.md` — mobile considerations (32×32 targets, TopNav placement, keyboard order).
- `docs/DEV-90/tech-plan.md` — architecture and affected files map.

### Chrome mobile walkthrough

- Storybook `InOrderDetailsTopNavNarrow` at 320×568, 375×812, 390×844 (touch emulation); tap on copy button registers focus; live clipboard blocked in iframe (environmental); Copied story confirms intended post-copy aria-label/icon state.
