---
agent: step-7-deep-correctness-order-copy-link-pass-1
input_branch: 7a33d7c2ad35af4836b70ce71dfe223da9e6b021
verdict: pass
---

## Summary

The order-copy-link implementation correctly satisfies all nine PRD acceptance criteria: `OrderCopyLinkButton` is wired into `OrderDetailsPage` TopNav before the metadata button, copies a clean absolute URL via `getAbsoluteOrderUrl` + `useClipboard`, and is excluded from draft orders. Task-scoped unit and integration tests pass. One non-blocking test-coverage gap remains for the accessible-name swap after copy (PRD AC5).

## Findings

### F-001 [WARNING] Accessible name swap after copy lacks automated test coverage

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:12-14`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:25-27,40-41`
- Description: PRD AC5 requires the button's accessible name to update from "Copy order link" to "Link copied" while in the copied state. The component implements this via `intl.formatMessage` on both `title` and `aria-label`, but the sole integration test mocks `useClipboard` as always returning `[false, mockCopy]`, so the label transition is never asserted. A regression that broke the copied-state label (e.g., always showing "Copy order link") would not flip CI red.
- Evidence: Integration mock at `OrderDetailsPage.test.tsx:12-14` fixes `copied` to `false`. No `OrderCopyLinkButton.test.tsx` exists. The `Copied` Storybook story uses `showCopiedState` for visual verification only (not CI-automated).
- Suggested fix: Add a focused `OrderCopyLinkButton.test.tsx` that mocks `useClipboard` returning `[true, jest.fn()]` (or toggles after click) and asserts `aria-label`/`title` equal the formatted `orderCopyLinkMessages.linkCopied` string.
