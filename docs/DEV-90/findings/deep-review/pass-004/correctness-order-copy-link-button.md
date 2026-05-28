---
agent: step-7-deep-correctness-order-copy-link-button-pass-4
input_branch: 09886983335621e9c0048186f6f51d0f16611441
verdict: pass
---

## Summary

Pass-4 correctness review of the cumulative order-copy-link-button diff (~500 LOC across 10 source files) finds production wiring and runtime behavior conform to the PRD and tech plan: URL encoding follows sibling `orderUrl` helpers, `key={order.id}` prevents stale copied state on navigation, `useClipboard` timer races are mitigated via `clear()` before re-arming, and component tests cover click→clipboard→feedback→2s-reset plus key-based remount. No BLOCKER defects found. One SHOULD-FIX documents missing `OrderDetailsPage` integration test coverage for the TopNav placement AC; one WARNING notes absent Playwright E2E coverage.

## Findings

### F-001 [SHOULD-FIX] OrderDetailsPage TopNav integration AC has no automated test

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211-218`; test gap across `src/orders/components/OrderDetailsPage/`
- Description: PRD AC requires `OrderCopyLinkButton` to render immediately before the metadata (`Code`) button when `order.id` is present and be omitted when absent. Production JSX satisfies this, but no Jest or Playwright test renders `OrderDetailsPage` and asserts DOM order or conditional visibility. Removing the button, reordering siblings, or dropping the `order?.id` guard would not fail CI.
- Trigger: Developer refactors `OrderDetailsPage` TopNav children (e.g., moves metadata button before copy button, or removes the `order?.id` ternary) and runs CI — all existing `OrderCopyLinkButton` unit tests still pass because they never mount the parent page.
- Impact: Staff users on order details lose the copy-link control or see it in the wrong position relative to metadata; the regression ships silently until manual QA or production report.
- Evidence: Parent wiring:

```211:218:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
              {order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}
              <Button
                variant="secondary"
                icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
                onClick={onOrderShowMetadata}
                data-test-id="show-order-metadata"
                title="Edit order metadata"
                marginRight={3}
              />
```

Glob `**/OrderDetailsPage*.test.*` → 0 files. Grep `copy-order-link|OrderCopyLinkButton` under `playwright/` → 0 matches. Storybook composition (`OrderCopyLinkButton.stories.tsx:85-116`) mirrors layout but is not CI-gated Jest coverage.

- Suggested fix: Add a focused `OrderDetailsPage` render test (or Playwright step) that mounts the page with a fixture order, asserts `[data-test-id="copy-order-link"]` precedes `[data-test-id="show-order-metadata"]` in DOM order, and asserts the copy button is absent when `order.id` is undefined.

### F-002 [WARNING] No Playwright E2E coverage for copy-order-link flow

- Location: `playwright/tests/orders.spec.ts`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
- Description: The orders Playwright suite navigates to order details for customer/address flows but never clicks `[data-test-id="copy-order-link"]` or asserts clipboard/feedback behavior. End-to-end verification of the feature relies entirely on Jest unit tests and Storybook.
- Trigger: A regression breaks only in real browser clipboard integration (permissions, macaw Button event wiring, TopNav layout) while unit tests with mocked `navigator.clipboard` remain green.
- Impact: Copy button may appear broken in production (click no-op, wrong URL in clipboard) without CI detection; staff must discover manually.
- Evidence: Grep `copy-order-link` under `playwright/` → 0 matches. `orders.spec.ts` exercises order details for customer edits and addresses only.
- Suggested fix: Add a Playwright test on order details that clicks `[data-test-id="copy-order-link"]`, grants clipboard permissions, and asserts copied URL shape or post-click `aria-label` "Order link copied".

## Files / sections inspected

### Touched files (diff since `45b5cef8`)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — click handler, `useClipboard` wiring, aria-live region, label swap logic
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — delegates to `orderUrl` + `urlJoin` with origin/mount
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n catalog for both label states
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/focus/active/disabled styles, sr-only status region
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — click, copied UI, remount reset, real-hook 2s transition tests
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — default mount, subpath mount, special-char encoding
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + TopNav composition (not CI Jest)
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — parent conditional render + `key={order.id}`
- `src/hooks/useClipboard.ts:12-27` — `clear()` before re-arming copied timer (shared hook change)

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production); `OrderCopyLinkButton.stories.tsx:95` (Storybook composition). Both pass `orderId` string; production uses `key={order.id}` remount contract — call site respects contract.
- `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` (sole production caller); tests import directly. Contract: raw GraphQL order id in, absolute encoded URL out — respected.
- `orderCopyLinkButtonMessages` — `OrderCopyLinkButton.tsx:9,38-40,62` only. No external callers.

### Parent / host components

- `OrderDetailsPage.tsx:210-219` — renders copy button before metadata button inside `TopNav`; guards with `order?.id` ternary; passes matching `key` and `orderId`. Correct wire-up for loading (button omitted when id absent) and navigation (key remount).

### Integration dependencies

- `src/hooks/useClipboard.ts` — async clipboard write, 2s timer, rejection logs warn only (PRD out-of-scope for user-visible error)
- `src/orders/urls.ts:234-235` — `orderUrl` applies `encodeURIComponent` + trailing `?`
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` empty string for default mount
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — 16px copy/check icon swap
- `src/orders/index.tsx:161,85-87` — route decode round-trip for encoded ids

### Tests reviewed

- `OrderCopyLinkButton.test.tsx` — 4 tests (mock click, copied aria-live, key remount, real hook transition)
- `getShareableOrderUrl.test.ts` — 3 URL shape tests
- `useClipboard.test.ts` — 7 tests including rapid re-copy timer reset and rejection handling
- `playwright/tests/orders.spec.ts` — no copy-link coverage (grep confirmed)
