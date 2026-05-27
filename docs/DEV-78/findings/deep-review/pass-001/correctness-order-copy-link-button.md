---
agent: step-7-deep-correctness-order-copy-link-button-pass-1
input_branch: 04aaf8e902a7277b5e64bee43842a5c4f41bed35
verdict: fail
---

## Summary

The copy-order-link feature is implemented correctly against PRD and constitution: `getOrderShareableUrl` builds the specified absolute URL, `OrderCopyLinkButton` reuses `useClipboard`/`ClipboardCopyIcon` with i18n labels, and `OrderDetailsPage` wires the button before the metadata control behind an `order?.id` guard. Unit tests and type-check pass. Verdict is **fail** because the **test-coverage** mechanical check found load-bearing acceptance criteria (TopNav integration placement and conditional render) with no automated test, and no Playwright spec covers the new control.

## Findings

### F-001 [WARNING] TopNav integration acceptance criteria lack automated tests

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (lines 211–219); no `OrderDetailsPage*.test.tsx`
- Description: PRD acceptance criteria require `OrderCopyLinkButton` in TopNav immediately before the metadata button when `order.id` is present, and no render when `order.id` is absent. The two-line JSX wiring is untested — a regression (wrong order, missing guard, or dropped import) would not flip CI red.
- Evidence: Integration is `{order?.id && <OrderCopyLinkButton orderId={order.id} />}` followed by the metadata `Button`. Grep finds zero `OrderDetailsPage` component tests; `OrderCopyLinkButton.test.tsx` tests the button in isolation only.
- Suggested fix: Add a focused `OrderDetailsPage` render test (or Playwright step) asserting `[data-test-id="copy-order-link"]` precedes `[data-test-id="show-order-metadata"]` when `order.id` is set, and is absent when `order.id` is undefined/null.

### F-002 [WARNING] Component tests omit `title` attribute assertions

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` (lines 50–81); `OrderCopyLinkButton.tsx` (lines 46–47)
- Description: PRD requires both `aria-label` and `title` to use `orderCopyLinkButtonMessages` before and after copy. Tests assert `aria-label` only; `title` is set to the same `label` variable but never verified.
- Evidence: Component sets `title={label}` and `aria-label={label}`. Tests check `toHaveAttribute("aria-label", …)` but never `title`.
- Suggested fix: Extend existing label tests to also assert `title` matches `"Copy order link"` / `"Order link copied"`.

### F-003 [WARNING] Icon swap not exercised at component test level

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` (lines 9, 34, 67); `src/hooks/useClipboard.test.ts`
- Description: PRD requires copy→check icon swap after successful copy. Component tests mock `useClipboard`, so `ClipboardCopyIcon` DOM (CopyIcon vs CheckIcon) is never asserted. Hook-level timing is covered in `useClipboard.test.ts`, but the component wiring to `hasBeenClicked={copied}` is not.
- Evidence: `mockUseClipboard.mockReturnValue([true, jest.fn()])` drives label tests only; no query for check vs copy SVG paths or roles.
- Suggested fix: Add one test with unmocked `useClipboard` (mock `navigator.clipboard.writeText` instead) or assert rendered icon variant when `copied` is true via `ClipboardCopyIcon` test-id or aria snapshot.
