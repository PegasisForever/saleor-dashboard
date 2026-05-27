---
agent: step-7-deep-correctness-order-details-copy-link-pass-1
input_branch: e4ebc9531190c0993a632681a64d25ca24dc19db
verdict: fail
---

## Summary

Implementation correctly satisfies all nine PRD acceptance criteria and project constitution conventions: `OrderCopyLinkButton` is wired in `OrderDetailsPage` TopNav before the metadata button, builds share URLs via `getOrderAbsoluteUrl` (matching `orderUrl` encoding, no query params), and reuses `useClipboard` + `ClipboardCopyIcon` for 2s copied feedback. No production correctness BLOCKERs found. Verdict **fail** because mechanical checks `e2e-tests` and `test-coverage` fail — load-bearing paths (URL builder, click→clipboard wiring, production integration) lack Jest/Playwright coverage despite PRD specifying `data-test-id="copy-order-link"` for E2E.

## Findings

### F-001 [WARNING] No unit test for `getOrderAbsoluteUrl`

- Location: `src/orders/components/OrderCopyLinkButton/getOrderAbsoluteUrl.ts`
- Description: The URL builder is the highest-risk path per tech-plan (mount URI handling, `orderPath` vs `orderUrl`, encoding). No `*.test.ts` file exists; manual verification confirms correct output for default mount, subpath mount, and special characters, but regressions would go undetected.
- Evidence: Grep across `**/*.{test,spec}.{ts,tsx}` returns zero matches for `getOrderAbsoluteUrl`. Tech-plan risks table flags `APP_MOUNT_URI` non-default and `orderUrl()` vs `orderPath()` as mitigated by this util but untested.
- Suggested fix: Add `getOrderAbsoluteUrl.test.ts` covering default mount (`""`), non-default mount (`/dashboard`), encoded order IDs (`=` → `%3D`), and absence of query params.

### F-002 [WARNING] No Playwright E2E test for copy-link on order details

- Location: `playwright/tests/orders.spec.ts`; `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`
- Description: PRD AC5 specifies `data-test-id="copy-order-link"` for E2E/tests, but no Playwright spec references `copy-order-link`, `OrderCopyLinkButton`, or copy-link behavior. Existing order E2E tests navigate to order details but do not assert the new button.
- Evidence: `rg -i 'copy-order-link|OrderCopyLinkButton|copyOrderLink' playwright/` → 0 matches. `orders.spec.ts` uses `goToExistingOrderPage` but never queries `copy-order-link`.
- Suggested fix: Add Playwright test on order details: assert button visible before `show-order-metadata`, click copies URL matching `{origin}{mountUri}/orders/{encodedId}`, assert copied label/icon feedback.

### F-003 [WARNING] Storybook plays do not exercise interactive copy flow

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`
- Description: `Copied` story fakes success via `previewState="copied"`; no play function clicks the button, asserts clipboard content, or verifies 2s revert. `Default` story has no play function at all. Storybook vitest passes (398 tests) but only validates static attribute assertions on preview states.
- Evidence:
  ```95:102:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
  export const Copied: Story = {
    render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} previewState="copied" />,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
      const button = getButton(canvasElement);
      await expect(button).toHaveAttribute("title", "Order link copied");
  ```
  `beforeEach` stubs `navigator.clipboard.writeText` but no play invokes click + clipboard assertion.
- Suggested fix: Add play to `Default` (or new `InteractiveCopy` story): click button, assert `writeText` called with expected absolute URL, assert label/icon change, optionally advance timers for 2s revert.

### F-004 [WARNING] Storybook play assertions use hardcoded English strings

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:64,73,100-101`
- Description: Play functions assert literal `"Copy order link"` / `"Order link copied"` instead of importing `messages.*.defaultMessage`. Component i18n is correct; plays may drift if copy changes.
- Evidence: `await expect(button).toHaveAttribute("title", "Copy order link");` at L64; component uses `intl.formatMessage(messages.copyOrderLink)` at L35-37.
- Suggested fix: Assert against `messages.copyOrderLink.defaultMessage` and `messages.orderLinkCopied.defaultMessage`.

## Mechanical checks

| Check                       | Status | Notes                                                                                                                                                                   |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| e2e-tests                   | fail   | No Playwright spec covers `copy-order-link`                                                                                                                             |
| api-contract                | skip   | Client-only clipboard; tech-plan § API conventions N/A; no contract harness in repo                                                                                     |
| prd-conformance             | pass   | All 9 AC trace to implementing code paths                                                                                                                               |
| constitution-compliance     | pass   | Named exports, `@dashboard/*` imports, `useClipboard`/`ClipboardCopyIcon` reuse, CSS modules with `--mu-*`, `defineMessages`, `orderPath` not `orderUrl`                |
| test-coverage               | fail   | No Jest unit or Playwright E2E for feature; Storybook plays partial only                                                                                                |
| storybook-interaction-tests | pass   | `pnpm run test-storybook -- src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` → 398 passed                                                     |
| url-format-verification     | pass   | Manual node verification: default mount → `http://localhost:9000/orders/U3Jlc3QtT3JkZXI6MQ%3D%3D`; subpath mount → `/dashboard/orders/...`; matches `orderUrl` encoding |
