---
agent: step-7-deep-simplify-order-copy-link-pass-1
input_branch: 7a33d7c2ad35af4836b70ce71dfe223da9e6b021
verdict: fail
---

## Summary

The order-copy-link implementation is lean in production (~45-line component, one-line page integration) and correctly reuses `useClipboard`, `ClipboardCopyIcon`, and established `urlJoin` + mount-URI patterns. Simplification opportunities remain around Storybook concerns leaking into the production API, duplicated TopNav layout between story and page, a redundant path-normalization guard, and a heavyweight integration test file created solely for one TopNav assertion.

## Findings

### F-001 [WARNING] Storybook-only `showCopiedState` prop widens production component API

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:9-14,19,23`
- Description: The production component exposes `showCopiedState` solely so the `Copied` Storybook story can persist the check icon without the 2s `useClipboard` timeout. Every consumer of `OrderCopyLinkButton` sees a prop that production never uses (`OrderDetailsPage` passes only `orderId`).
- Evidence:
  ```typescript
  /** Storybook-only: persist copied icon/label without clipboard timeout. */
  showCopiedState?: boolean;
  // ...
  const copied = showCopiedState || hookCopied;
  ```
  Repo grep shows `showCopiedState` appears only in `OrderCopyLinkButton.tsx` and `OrderCopyLinkButton.stories.tsx:94`. No other component in the codebase uses this story-override pattern.
- Suggested fix: Remove `showCopiedState` from the component. In the `Copied` story, use a decorator that mocks `@dashboard/hooks/useClipboard` to return `[true, jest.fn()]` (same pattern as `OrderDetailsPage.test.tsx:12-13`), keeping production props limited to `orderId` and `disabled`.

### F-002 [WARNING] `InTopNav` story duplicates TopNav action cluster from `OrderDetailsPage`

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:98-109` vs `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`
- Description: The `InTopNav` story hand-copies the copy-button + metadata-button sibling layout from production, including identical `data-test-id`, icon props, and `marginRight={3}`. Two sources must stay in sync when TopNav actions change.
- Evidence: Both render `<OrderCopyLinkButton … />` immediately before a secondary `Button` with `data-test-id="show-order-metadata"`, `Code` icon at `iconSize.medium`, and `marginRight={3}`. The story omits `onClick`; production omits story placeholders — otherwise the markup is the same.
- Suggested fix: Extract a small shared fragment (e.g. `OrderDetailsTopNavActions` accepting `orderId` and metadata `onClick`) used by both `OrderDetailsPage` and the `InTopNav` story, or colocate the placement story on an `OrderDetailsPage` story once that page has Storybook coverage.

### F-003 [WARNING] Redundant leading-slash guard in `getAbsoluteOrderUrl`

- Location: `src/orders/urls.ts:194-201`
- Description: The ternary `relativePath.startsWith("/") ? relativePath.slice(1) : relativePath` adds complexity without matching how the rest of the codebase uses `urlJoin` with dashboard paths.
- Evidence:
  ```typescript
  return urlJoin(
    window.location.origin,
    getAppMountUriForRedirect(),
    relativePath.startsWith("/") ? relativePath.slice(1) : relativePath,
  );
  ```
  Auth redirect helpers pass leading-slash paths directly to `urlJoin` without stripping — e.g. `getNewPasswordResetRedirectUrl` at `src/auth/utils.ts:108-109` joins `newPasswordUrl()` (path `/new-password/`) with no `slice(1)`. Project uses `url-join` ^4.0.1, which normalizes slashes between segments. Existing unit tests in `src/orders/urls.test.ts:86-103` would still pass if the third argument were `relativePath` unchanged.
- Suggested fix: Pass `relativePath` directly to `urlJoin`, matching auth/staff call sites and dropping the ternary.

### F-004 [WARNING] Integration test uses ~15 module mocks for a single TopNav assertion

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:1-141`
- Description: A new 141-line test file mocks 15+ child modules to mount the full `OrderDetailsPage` just to verify copy-button presence, DOM order, and clipboard invocation. The component under test (`OrderCopyLinkButton`) has no dedicated unit test despite being self-contained (~45 lines, no GraphQL).
- Evidence: Lines 12-69 define mocks for `useClipboard`, `useNavigator`, `useBackLinkWithState`, dev mode, extensions, and eight order sub-cards. The sole test case (lines 112-139) asserts `copy-order-link` exists before `show-order-metadata` and that `mockCopy` receives `getAbsoluteOrderUrl(order.id)`.
- Suggested fix: Add a focused `OrderCopyLinkButton.test.tsx` covering label swap and `copy(getAbsoluteOrderUrl(orderId))` with minimal mocks. Keep a lighter page-level test (or drop DOM-order assertion in favor of shared-layout extraction from F-002) to reduce mock surface area.
