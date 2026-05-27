---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-2
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
verdict: pass
---

## Summary

Pass-2 loop-back fixes the pass-1 mobile BLOCKER: `useClipboard` now clears the prior timer before rescheduling, and chrome-devtools double-tap simulation at 320×568 on Storybook `InOrderDetailsTopNav` confirms copied state persists until 2s after the *last* tap (not truncated at ~1.65s). TopNav layout at 320–390px shows 32×32px copy/metadata targets, 20px gap, no horizontal scroll, and correct DOM order. Production app unreachable (`localhost:9000` / backend connection refused); mobile walkthrough used published Storybook + source. Two WARNINGs remain: aria-live does not re-announce on rapid re-copy while already in copied state (deferred from shallow review), and Playwright E2E does not exercise mobile viewport or double-tap.

## Findings

### F-001 [WARNING] Rapid re-copy does not re-announce to screen readers on mobile

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:45-49`
- Description: After the first successful copy, `copied` stays `true` on a second tap within 2s (timer fix). The `aria-live="polite"` region stays mounted with unchanged text `"Order link copied"`, so VoiceOver/TalkBack typically do not fire a second announcement—common on mobile when users tap twice for confirmation. Visual/icon feedback is correct; SR-only gap on repeat tap.
- Evidence:

```45:49:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
      {copied ? (
        <span aria-live="polite" className={styles.visuallyHidden}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
      ) : null}
```

`useClipboard` success path calls `clear()` then `setCopyStatus(true)` without toggling `copied` false first (`src/hooks/useClipboard.ts:16-17`). Shallow review iter-3/4 explicitly deferred this (`docs/DEV-85/logs/027-step-6b-shallow-review-post-done-iter-4.md:46`).

- Suggested fix: On each successful copy, briefly unmount/remount the live region (e.g. `key={copyGeneration}` incremented in container) or use `aria-atomic` + empty-then-text pattern so SR announces each tap.

### F-002 [WARNING] Playwright copy-link E2E omits mobile viewport and double-tap regression

- Location: `playwright/tests/orders.spec.ts:155-179`
- Description: `TC: SALEOR_218` validates placement, single click, and success affordances at default desktop viewport only. Pass-1 mobile failure mode (double-tap within 2s truncating copied feedback) is covered by `useClipboard.test.ts` but not by E2E at mobile breakpoints or with two taps.
- Evidence: No `setViewportSize` / mobile device profile in the spec; single `copyOrderLinkButton.click()` at lines 176-178. Mobile UX risk is mitigated by hook unit test (`src/hooks/useClipboard.test.ts:133-173`) but not exercised in browser E2E at 320–390px.
- Suggested fix: Add viewport emulation (375×812) and optional second click within 1s asserting `aria-label` remains `"Order link copied"` and check icon visible after 1.5s.

## Files / sections inspected

### Touched files (coordinator pass-2 scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `copy(url ?? window.location.href)`; wires `useClipboard`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — Macaw secondary button, aria-label/title toggle, aria-live region when copied.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — visually hidden live region styles.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n strings for labels and live region.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — unit tests including live region presence.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — `InOrderDetailsTopNav` composition story for mobile layout proxy.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only interaction states (not production).
- `src/hooks/useClipboard.ts` — pass-2 `clear()` before timer reschedule.
- `src/hooks/useClipboard.test.ts` — rapid re-copy timer regression test.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — TopNav integration host.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — DOM order placement test.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional size/strokeWidth props.
- `playwright/tests/orders.spec.ts` + `playwright/pages/ordersPage.ts` — E2E SALEOR_218.
- `locale/defaultMessages.json` — message catalog entries.
- `docs/DEV-85/prd.md`, `ui-design.md`, `tech-plan.md` — AC and mobile design intent.

### Export call sites

- `OrderCopyLinkButton` — `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` (production); `OrderCopyLinkButton.stories.tsx:67` (Storybook). Contract respected: no props in production (defaults to `window.location.href`).
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21`, stories/preview/tests only; story passes `copied`/`disabled` without `onCopy` for static states.
- `OrderCopyLinkButtonStoryPreview` — stories only; no production callers.
- `OrderCopyLinkButtonStoryInteractionState` (type export) — stories only.
- `messages` — `OrderCopyLinkButtonContent.tsx` only.
- `ClipboardCopyIcon` — `OrderCopyLinkButtonContent.tsx:33-37` (size medium); `TrackingNumberDisplay.tsx:56` (defaults unchanged). Backward compatible.
- `useClipboard` — 8+ consumers; pass-2 `clear()` benefits all; no signature change.

### Parent / host components

- `OrderDetailsPage.tsx:210-232` — renders `<OrderCopyLinkButton />` before metadata `Button` and `TopNav.Menu`; `order` optional on `Title` but copy button does not dereference `order.id` (uses `window.location.href`). Loading skeleton title when `!order` does not block copy button render.
- `src/components/AppLayout/TopNav/Root.tsx:57-83` — flex row: back link, ellipsis title (`flex 1 1 auto`, `overflow hidden`), action cluster `flexWrap nowrap` with `gap={2}`.
- `src/components/AppLayout/TopNav/TopNavWrapper.tsx` — page header height/padding; `display flex` for standard header.
- `src/orders/components/OrderDetailsPage/Title.tsx` — multi-line title (order # + pill + date); affects narrow-width title compression alongside action buttons.

### Integration / siblings

- `src/hooks/useClipboard.ts` — sync `copy()` API; 2s timeout; failure → warn only.
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — sibling clipboard pattern (hover-gated, no aria-live).
- `src/components/CopyableText/CopyableText.tsx` — shared clipboard test pattern reference.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — clipboard URL, copied label/icon, aria-live mount/unmount.
- `OrderDetailsPage.test.tsx:91-108` — TopNav DOM order.
- `useClipboard.test.ts:133-173` — rapid re-copy timer (mobile double-tap root cause).
- `playwright/tests/orders.spec.ts:155-179` — single-click E2E (desktop default viewport).

### Chrome mobile walkthrough (Storybook fallback)

- Storybook `InOrderDetailsTopNav` at 375×812, 320×568, 390×844 — layout metrics, double-tap timer behavior with mocked `navigator.clipboard.writeText`.
- Screenshots: `docs/DEV-85/findings/deep-review/pass-002/evidence/mobile-ux-375-in-topnav-before-tap.png`, `mobile-ux-375-copied-state.png`.
- Production `http://localhost:9000/` — connection refused (curl exit 7); `production-walkthrough-mobile: skip`.
