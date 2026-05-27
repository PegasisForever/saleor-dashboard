---
agent: step-7-deep-correctness-order-copy-link-button-pass-2
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
verdict: fail
---

## Summary

Pass-2 loop-back fixes resolve the pass-1 encoding, `key={order.id}`, and AC4 timer-test gaps. All eight PRD acceptance criteria trace to working production code paths, and sibling URL helpers now match `encodeURIComponent` parity. No BLOCKER defects found in the diff itself. Verdict is **fail** because mechanical checks for e2e and test-coverage cannot pass: there is no Playwright coverage for `copy-order-link`, and unit tests mock both `useClipboard` and `getShareableOrderUrl`, leaving real URL composition and browser clipboard integration unverified.

## Findings

### F-001 [WARNING] No Playwright e2e coverage for copy-order-link

- Location: `playwright/tests/orders.spec.ts` (absent); `OrderCopyLinkButtonView.tsx:30`
- Description: The feature exposes `data-test-id="copy-order-link"` for tests, but no Playwright spec clicks it, asserts clipboard contents, or verifies shareable URL shape against `window.location.origin` and mount URI in a real browser.
- Evidence: `pnpm run e2e --grep "copy-order-link|order details"` exited 1 with `Error: No tests found`. Grep over `playwright/` returns zero matches for `copy-order-link`, `OrderCopyLink`, or `getShareableOrderUrl`.
- Suggested fix: Add an `#e2e` test in `playwright/tests/orders.spec.ts` that navigates to an existing order, clicks `[data-test-id="copy-order-link"]`, and asserts clipboard text matches the expected dashboard order URL (or asserts aria-label transition if clipboard permissions are unavailable in CI).

### F-002 [WARNING] Component unit tests mock the entire clipboard and URL stack

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:9-38`
- Description: Tests replace both `getShareableOrderUrl` and `useClipboard` with mocks. A regression that breaks integration between the real hook, real URL helper, and view would not flip these tests red.
- Evidence:
  ```typescript
  jest.mock("@dashboard/orders/utils/getShareableOrderUrl");
  jest.mock("@dashboard/hooks/useClipboard", () => ({
    useClipboard: () => {
      /* inline reimplementation */
    },
  }));
  ```
  Click test asserts mock chain only (`expect(mockGetShareableOrderUrl).toHaveBeenCalledWith(orderId)`), not real URL output.
- Suggested fix: Add at least one integration-style test using the real `getShareableOrderUrl` (with controlled `window.location` and mount URI mocks at module boundary only) or cover the full stack in e2e.

### F-003 [WARNING] AC4 timer test omits CheckIcon swap assertion

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:104-134`; PRD AC4
- Description: PRD AC4 requires icon switch to check via `ClipboardCopyIcon hasBeenClicked={true}`. The timer test asserts only `aria-label` and `title` revert after 2000ms; it never queries for CheckIcon vs CopyIcon in the DOM.
- Evidence: Test lines 123-124 check attributes only. `ClipboardCopyIcon.tsx:17-21` toggles `CheckIcon`/`CopyIcon` based on `hasBeenClicked`. Storybook `Copied` story asserts aria-label only (`OrderCopyLinkButton.stories.tsx:137-145`), not icon presence.
- Suggested fix: After click, assert `canvas.getByRole(...)` or query for check icon (e.g. via lucide `data-testid` or aria-hidden SVG class). Mirror assertion after timer revert.

### F-004 [WARNING] getShareableOrderUrl tests never exercise default empty mount URI

- Location: `src/orders/utils/getShareableOrderUrl.test.ts:11-13`; `src/utils/urls.ts:27-28`
- Description: When mount URI equals the default `/`, `getAppMountUriForRedirect()` returns `""`. The shareable URL helper passes this empty segment to `urlJoin`. Tests always mock mount URI as `"/dashboard"`, so the default-deployment URL shape is untested.
- Evidence:
  ```typescript
  jest.mock("@dashboard/utils/urls", () => ({
    getAppMountUriForRedirect: jest.fn(() => "/dashboard"),
  }));
  ```
  `getAppMountUriForRedirect` at `urls.ts:27-28` returns `""` when mount equals default.
- Suggested fix: Add a test case with `mockGetAppMountUriForRedirect.mockReturnValue("")` asserting the resulting URL is `urlJoin(origin, orderPath(encodedId))` without a spurious `/dashboard` segment.

### F-005 [WARNING] No integration test for key={order.id} remount resetting copied state

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`; `OrderDetailsPage.test.tsx:116-136`
- Description: `key={order.id}` was added to reset `useClipboard` copied state when navigating between orders. The integration test verifies DOM placement only; it never re-renders with a different order id or asserts copied-state reset.
- Evidence: `OrderDetailsPage.test.tsx` uses a static fixture and single render. No test changes `order.id` and checks remount behavior.
- Suggested fix: Re-render `OrderDetailsPage` with a different `order.id` after simulating copied state (or mount two sequential orders) and assert fresh default label.

### F-006 [WARNING] PRD AC3 text stale after loop-back encoding fix

- Location: `docs/DEV-78/prd.md:32`; `src/orders/utils/getShareableOrderUrl.ts:9`
- Description: PRD AC3 still specifies `orderPath(orderId)` without encoding. Loop-back task T-9f4c2a8e superseded this with `orderPath(encodeURIComponent(orderId))` for parity with `orderUrl`. Implementation is correct; the PRD acceptance criterion text is outdated.
- Evidence: PRD line 32: `orderPath(orderId)`. Code line 9: `orderPath(encodeURIComponent(orderId))`. `getShareableOrderUrl.test.ts:64-79` validates encoding for `/` and `+`.
- Suggested fix: Update PRD AC3 to document encoded path segments, or add an explicit note that loop-back encoding supersedes the original literal.
