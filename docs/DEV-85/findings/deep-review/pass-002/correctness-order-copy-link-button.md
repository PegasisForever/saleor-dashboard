---
agent: step-7-deep-correctness-order-copy-link-button-pass-2
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
verdict: pass
---

## Summary

Pass-2 correctness review confirms loop-back fixes landed: `useClipboard` clears orphaned timers before rescheduling, `OrderCopyLinkButtonContent` adds `aria-live` success feedback, `OrderDetailsPage` placement is covered by unit + Playwright tests, and all 12 scoped unit tests pass. No BLOCKER regressions found. Two SHOULD-FIX gaps remain in E2E coverage for PRD AC2 (clipboard payload) and AC3 (2-second revert), plus a known WARNING on rapid re-copy screen-reader re-announcement.

## Findings

### F-001 [SHOULD-FIX] Playwright E2E does not assert clipboard payload equals page URL

- Location: `playwright/tests/orders.spec.ts:155-178`
- Description: PRD AC2 requires clicking the copy button to write `window.location.href` to the system clipboard. `TC: SALEOR_218` clicks the button and asserts post-click UI feedback (`aria-label`, check icon) but never reads clipboard contents or compares them to the current page URL.
- Evidence:

```176:178:playwright/tests/orders.spec.ts
  await ordersPage.copyOrderLinkButton.click();
  await expect(ordersPage.copyOrderLinkButton).toHaveAttribute("aria-label", "Order link copied");
  await expect(ordersPage.copyOrderLinkButton.locator(".lucide-check")).toBeVisible();
```

Unit tests mock `useClipboard` (`OrderCopyLinkButton.test.tsx:8-32`), so the only automated path that could catch a regression where UI feedback fires but the wrong string is written is missing.

- Suggested fix: After click, grant clipboard permissions if needed and assert `await page.evaluate(() => navigator.clipboard.readText())` equals `page.url()` (or the expected order-details URL).

### F-002 [SHOULD-FIX] Playwright E2E does not assert 2-second revert to default icon/label

- Location: `playwright/tests/orders.spec.ts:155-178`, `src/hooks/useClipboard.ts:19-22`
- Description: PRD AC3 requires the check icon and copied label to persist for 2 seconds, then revert. Hook behavior is tested in `useClipboard.test.ts:59-80` and rapid re-copy in `:133-173`, but E2E stops immediately after the copied-state assertion with no timer wait or revert check.
- Evidence: E2E ends at line 178 with no `waitForTimeout(2000)` or assertion that `aria-label` returns to `"Copy order link"` and `.lucide-copy` reappears. A UI-only regression that never resets `copied` would not be caught by E2E.
- Suggested fix: After copied-state assertions, advance time or `waitForTimeout(2100)` and assert default label/icon restored.

### F-003 [WARNING] Rapid re-copy within 2s does not re-trigger aria-live announcement

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:45-49`, `src/hooks/useClipboard.ts:16-17`
- Description: The timer fix correctly keeps `copied === true` through rapid re-copies, but the polite live region mounts once with static text. A second successful copy within 2s does not remount the span or change its text, so screen readers typically will not re-announce success on repeat taps even though visual feedback persists.
- Evidence:

```45:48:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
      {copied ? (
        <span aria-live="polite" className={styles.visuallyHidden}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
```

```16:17:src/hooks/useClipboard.ts
        clear();
        setCopyStatus(true);
```

Shallow review iter-4 carried this as deferred; no pending task scopes repeat-tap SR flow.

- Suggested fix: Consider a keyed remount (e.g., increment `copyGeneration` on each success) or brief unmount/remount pattern to force a DOM mutation ATs can detect.

### F-004 [WARNING] Component tests mock hook — clipboard failure path not wired through button UI

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:8-10`, `src/hooks/useClipboard.test.ts:175-198`
- Description: PRD AC5 requires failure to leave the button in default state with only a console warning. Hook-level rejection is tested, but `OrderCopyLinkButton.test.tsx` always mocks `useClipboard` and never renders with the real hook to confirm the presentational layer stays on copy icon / default label when `writeText` rejects.
- Evidence: All four component tests inject `[false|true, jest.fn()]` mocks; no test integrates real `useClipboard` + mocked `navigator.clipboard.writeText` rejection through the button click path.
- Suggested fix: Add one integration-style test without mocking the hook (pattern from `useClipboard.test.ts`) that clicks the button after `writeText` rejects and asserts default accessible name and copy icon remain.

## Files / sections inspected

### Touched files (coordinator pass-2 scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container wires `useClipboard`, copies `url ?? window.location.href`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button, dynamic label/title, `aria-live` region, `data-test-id="copy-order-link"`.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — `copyOrderLink` / `orderLinkCopied` i18n IDs.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — `.visuallyHidden` for SR live region.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — 4 unit tests (mocked hook).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + TopNav composition.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only Macaw token snapshots.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story wrapper for hover/focus/active.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — TopNav integration; `<OrderCopyLinkButton />` before metadata button.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:91-109` — placement integration test.
- `src/hooks/useClipboard.ts` — timer fix (`clear()` before reschedule), 2s reset, failure warn.
- `src/hooks/useClipboard.test.ts` — 7 tests including rapid re-copy timer regression.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth` props with defaults.
- `playwright/tests/orders.spec.ts:155-178` — `TC: SALEOR_218` E2E.
- `playwright/pages/ordersPage.ts:62-63` — page object locators.
- `locale/defaultMessages.json:3173,7258` — extracted message entries for `FzcMi0`, `bqtu1/`.

### Call sites of new/changed exports

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production); `OrderCopyLinkButton.stories.tsx:67` (Storybook). Contract respected: production omits `url`/`disabled`; copies `window.location.href`.
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21`; `OrderCopyLinkButton.stories.tsx:43,61`; `OrderCopyLinkButtonStoryPreview.tsx:32`. Story paths omit `onCopy` intentionally for static snapshots; production passes `handleCopy`.
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` only; story-only, no production callers.
- `OrderCopyLinkButtonStoryInteractionState` (type export) — story preview only; no external callers per `git grep`.
- `ClipboardCopyIcon` (modified) — `OrderCopyLinkButtonContent.tsx:33-37` passes `iconSize.medium`/`iconStrokeWidth`; `TrackingNumberDisplay.tsx:56` uses defaults — backward-compatible.
- `useClipboard` (modified) — consumers unchanged; timer semantics fixed for all callers.

### Parent / host components read

- `OrderDetailsPage.tsx:210-219` — renders `<OrderCopyLinkButton />` with no props inside `TopNav`; immediately precedes metadata `Button`; `order` optional elsewhere but copy button does not dereference `order.id` — safe during loading.
- `OrderDetailsPage.tsx:161-168` — `loading` prop affects save/card loading only, not copy button (PRD out-of-scope for production `disabled`).
- `TopNav` (via stories `OrderCopyLinkButton.stories.tsx:64-77`) — flex layout hosts copy + metadata buttons; spacing via `marginRight={3}` on both.

### Sibling / integration code read

- `src/components/CopyableText/CopyableText.tsx` — shared `useClipboard` pattern; static label when copied (contrast with dynamic labels here).
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — hover-reveal copy using `ClipboardCopyIcon` defaults.
- `docs/DEV-85/prd.md` — all 8 acceptance criteria traced.
- `docs/DEV-85/tech-plan.md` — architecture, N/A API conventions.
- `docs/DEV-85/project-context.md` — constitution rules verified (named exports, CSS modules, i18n, no barrels, reuse existing hooks).

### Tests overlapping this feature

- `useClipboard.test.ts` — hook timer, rejection, rapid re-copy (pass).
- `OrderCopyLinkButton.test.tsx` — mocked hook UI states + aria-live (pass).
- `OrderDetailsPage.test.tsx:91-109` — TopNav DOM order (pass).
- `playwright/tests/orders.spec.ts:155-178` — E2E structurally present; execution blocked by missing `API_URL` in sandbox (static review only).
