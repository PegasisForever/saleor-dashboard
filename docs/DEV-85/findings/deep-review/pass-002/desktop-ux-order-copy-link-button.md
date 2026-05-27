---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-2
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
verdict: pass
---

## Summary

Pass-2 desktop-ux review confirms loop-back fixes land correctly: `useClipboard` timer stacking is resolved, TopNav placement matches PRD, keyboard activation and 2s visual state transitions work in Storybook, and the new `aria-live` region exists in source with unit-test coverage. Production app is unreachable in the sandbox; Storybook fallback exercised Default, Copied, and InOrderDetailsTopNav stories at 1280×800. One SHOULD-FIX remains: rapid re-copy within the 2s success window does not produce a screen-reader announcement because the live region text and `aria-label` are unchanged when `copied` stays `true`. Two WARNINGs note stale published Storybook (pre–aria-live bundle) and incomplete E2E coverage for revert/keyboard paths.

## Findings

### F-001 [SHOULD-FIX] Rapid re-copy within 2s does not re-announce success to screen readers

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:45-49` + `src/hooks/useClipboard.ts:16-17`
- Description: The timer fix correctly keeps `copied === true` through rapid re-copies, but the `aria-live="polite"` region mounts with static text `messages.orderLinkCopied` and is not remounted or mutated on a second successful copy within the 2s window. Because `aria-label`/`title` are already "Order link copied", assistive tech receives no DOM delta on the second tap. UI design explicitly promises the screen-reader flow `"Copy order link, button" → after click → "Order link copied, button"` for each successful copy action; repeat taps during the feedback window are silent to SR users even though visual feedback (check icon) persists.
- Evidence:

```tsx
// OrderCopyLinkButtonContent.tsx — live region only when copied; same text every time
{
  copied ? (
    <span aria-live="polite" className={styles.visuallyHidden}>
      {intl.formatMessage(messages.orderLinkCopied)}
    </span>
  ) : null;
}

// useClipboard.ts — second copy within 2s leaves copied at true (no false→true transition)
clear();
setCopyStatus(true);
```

Storybook Default story: second click while `aria-label="Order link copied"` produces identical a11y snapshot (no live region in deployed bundle; see F-002). Source-level conditional render confirmed at `OrderCopyLinkButtonContent.tsx:45-49`.

- Suggested fix: Add a monotonic `copyGeneration` counter (ref) incremented on each successful copy; use it as `key` on the live-region span or briefly unmount/remount the region (`copied` flash) to force a polite announcement on every success, including repeat taps within 2s.

### F-002 [WARNING] Published Storybook bundle predates aria-live implementation

- Location: `docs/DEV-85/ui-design.md:5` (Storybook URL) vs `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:45-49`
- Description: The planning-published Storybook at `http://localhost:11000/348e26e0-70be-420f-9890-0f733b21134b/` renders Copied and post-click Default stories without any `[aria-live="polite"]` node, while current HEAD source and unit tests expect the live region. This does not indicate missing production code (11/11 unit tests pass including live-region assertions), but it limits pass-2 browser verification of the net-new SR surface against the published artifact humans may still reference.
- Evidence: Chrome walkthrough on Copied story iframe: `document.querySelector('[aria-live="polite"]')` → `null`; `OrderCopyLinkButton.test.tsx:75-78` expects live region when `copied=true`.
- Suggested fix: Redeploy Storybook from current HEAD during PR prep so reviewers and humans can verify aria-live in the published URL; no component code change required.

### F-003 [WARNING] Playwright E2E omits 2s revert and keyboard-only paths from PRD/ui-design

- Location: `playwright/tests/orders.spec.ts:155-179`
- Description: `TC: SALEOR_218` validates visibility, DOM order, click success feedback (`aria-label`, check icon), but does not assert the PRD AC3 2s revert to copy icon/default label, keyboard Enter/Space activation (`docs/DEV-85/ui-design.md:33`), or clipboard payload equals page URL (PRD AC2). Desktop keyboard-only operation is verified manually in Storybook (Tab/Enter pass) but lacks automated regression coverage at the production integration site.
- Evidence:

```typescript
await ordersPage.copyOrderLinkButton.click();
await expect(ordersPage.copyOrderLinkButton).toHaveAttribute("aria-label", "Order link copied");
await expect(ordersPage.copyOrderLinkButton.locator(".lucide-check")).toBeVisible();
// No wait/revert assertion; no keyboard steps; no clipboard read
```

- Suggested fix: Extend `TC: SALEOR_218` with `page.waitForTimeout(2100)` + revert assertions and a keyboard-focused variant using `focus()` + `keyboard.press('Enter')`.

## Files / sections inspected

- `docs/DEV-85/logs/029-step-7-coordinator-pass-2.md` — pass-2 touchedFiles scope (16 source/locale/playwright paths).
- `docs/DEV-85/prd.md` — all 8 acceptance criteria for copy-link behavior.
- `docs/DEV-85/ui-design.md` — TopNav layout, keyboard order, SR flow, Storybook URL.
- `docs/DEV-85/tech-plan.md` — architecture, affected files, risks.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `useClipboard` wiring; `url ?? window.location.href`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:27-50` — Button props, aria-live region, label swap.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — visually hidden live region styles.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n strings.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + InOrderDetailsTopNav composition.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only interaction wrapper.
- `src/hooks/useClipboard.ts:3-32` — timer fix (`clear()` before reschedule), failure path.
- `src/hooks/useClipboard.test.ts` — rapid re-copy timer regression test (lines 133-173).
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — icon swap component.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — TopNav host; `<OrderCopyLinkButton />` before metadata button.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:91-109` — placement integration test.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — component tests including aria-live assertion.
- `playwright/tests/orders.spec.ts:155-179` — E2E happy path.
- `playwright/pages/ordersPage.ts:62-63` — page object locators.
- `src/components/CopyableText/CopyableText.tsx`, `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — sibling clipboard patterns (no aria-live).
- `src/components/AppLayout/TopNav/Root.tsx:68-83` — TopNav flex children order.
- `src/components/AppLayout/TopNav/Menu.tsx:19-24` — overflow menu trigger (icon-only).

### Export call sites

- `OrderCopyLinkButton` — exported in `OrderCopyLinkButton.tsx:11`; call sites:
  - `OrderDetailsPage.tsx:211` — production; no props; respects contract (`url` defaults to `window.location.href`).
  - `OrderCopyLinkButton.stories.tsx:67` — Storybook TopNav; passes `url={SAMPLE_ORDER_URL}` for deterministic clipboard mock.
  - `OrderCopyLinkButton.test.tsx:22,45,65,88` — tests; mock `useClipboard`; contract respected.
- `OrderCopyLinkButtonContent` — exported in `OrderCopyLinkButtonContent.tsx:16`; call sites:
  - `OrderCopyLinkButton.tsx:21` — production wiring with `onCopy`.
  - `OrderCopyLinkButtonStoryPreview.tsx:32` — story-only; omits `onCopy` (static preview; clicks no-op by design).
  - `OrderCopyLinkButton.stories.tsx:43,61` — Disabled/Copied static stories; no `onCopy`.
- `OrderCopyLinkButtonStoryPreview` — exported in `OrderCopyLinkButtonStoryPreview.tsx:21`; call sites: `OrderCopyLinkButton.stories.tsx:31,35,39` (Hover/Focus/Active stories only).
- `OrderCopyLinkButtonStoryInteractionState` — type export in `OrderCopyLinkButtonStoryPreview.tsx:4`; call sites: same file only (internal type map).
- `messages` — exported in `messages.ts:3`; call sites: `OrderCopyLinkButtonContent.tsx:7,24-25,47`.
- `useClipboard` — unchanged signature; consumers unchanged; timer fix is internal.

### Parent / host components read

- `OrderDetailsPage.tsx:210-219` — renders `<OrderCopyLinkButton />` unconditionally inside TopNav Form render prop; `order` is required prop (not optional at page level); no loading guard needed for copy (URL always available). Placement immediately before `show-order-metadata` confirmed.
- `TopNav/Root.tsx:57-83` — horizontal flex action cluster; optional `AppChannelSelect` may prepend focus stop before copy button when channel picker active.
