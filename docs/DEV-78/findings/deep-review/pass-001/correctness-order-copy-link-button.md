---
agent: step-7-deep-correctness-order-copy-link-button-pass-1
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
verdict: fail
---

## Summary

The copy-order-link feature implements all eight PRD acceptance criteria with sound wiring (`OrderDetailsPage` → `OrderCopyLinkButton` → `getShareableOrderUrl` → `useClipboard`). Unit tests pass (4/4). No BLOCKER defects were found for typical Saleor global IDs, but mechanical test-coverage checks fail: there is no Playwright e2e for the flow, no Jest test exercises the post-copy aria-label/icon transition (AC4), and URL tests mock away production `orderPath`/`orderUrl` behavior. A WARNING remains that copied URLs use raw `orderPath(id)` while in-app navigation uses `orderUrl` (`encodeURIComponent`), so pasted links may not match the address bar and can mis-route IDs containing `/` (valid in base64).

## Findings

### F-001 [WARNING] Copied URL encoding diverges from in-app `orderUrl` convention

- Location: `src/orders/utils/getShareableOrderUrl.ts:5-6`, `src/orders/urls.ts:234-235`
- Description: `getShareableOrderUrl` builds paths with raw `orderPath(orderId)`, while every navigable order link in the app uses `orderUrl(id)` → `orderPath(encodeURIComponent(id))`. Staff who copy a link get a URL that often differs from the browser address bar (e.g. `.../orders/T3JkZXI6MQ==` vs `.../orders/T3JkZXI6MQ%3D%3D`). `decodeURIComponent` at `src/orders/index.tsx:87` round-trips typical base64 Saleor IDs, but an `orderId` containing `/` (base64 alphabet) splits into multiple path segments via `urlJoin("/orders", id)` and may not match the single-segment route `orderPath(":id")`.
- Evidence:
  ```ts
  // getShareableOrderUrl.ts
  urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId));
  // urls.ts
  export const orderUrl = (id: string, params?: OrderUrlQueryParams) =>
    orderPath(encodeURIComponent(id)) + "?" + stringifyQs(params);
  ```
  Tech-plan risk at `docs/DEV-78/tech-plan.md:54` asks to verify encoded IDs in integration tests; no test asserts `%3D` form or parity with `orderUrl`. PRD AC#3 intentionally specifies raw `orderPath` (`docs/DEV-78/prd.md:32`).
- Suggested fix: Align with `orderPath(encodeURIComponent(orderId))` in `getShareableOrderUrl` (and update PRD AC#3 if product agrees), or document that raw paths are intentional and add an integration test proving both encoded and unencoded pasted URLs resolve to the same order.

### F-002 [WARNING] No Jest test for post-copy accessible label / icon transition (PRD AC4)

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:20-32`
- Description: PRD requires that after a successful copy the icon becomes a check and `aria-label`/`title` show `messages.orderLinkCopied` for ~2s. Unit tests mock `useClipboard` and never render with `copied: true`, so the runtime label swap is unverified in Jest. Storybook `Copied` story asserts the static copied state only (`OrderCopyLinkButton.stories.tsx:137-145`), not click → async resolve → DOM update → timer revert.
- Evidence: `OrderCopyLinkButton.test.tsx` queries `getByTestId("copy-order-link")` only; grep shows no Jest assertion for `"Order link copied"` or `getByRole("button", { name: ... })`. Contrast `src/hooks/useClipboard.test.ts:59-81` which tests the 2s reset at the hook layer in isolation.
- Suggested fix: Add a test that sets `mockUseClipboard.mockReturnValue([true, mockCopy])` (or uses real hook with mocked `navigator.clipboard`) and asserts `aria-label`/`title` via `getByRole("button", { name: /Order link copied/i })`; optionally use fake timers to assert revert.

### F-003 [WARNING] Clipboard integration test uses fully mocked URL builder

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:9-14`, `src/orders/utils/getShareableOrderUrl.test.ts:7-13`
- Description: The button click test mocks both `useClipboard` and `getShareableOrderUrl`, so the load-bearing contract “click writes the real absolute dashboard order URL” is never exercised end-to-end. `getShareableOrderUrl.test.ts` also mocks `orderPath` and `getAppMountUriForRedirect`, so production path shape (`/orders/<id>` from `urls.ts:192`) is not validated without mocks.
- Evidence:
  ```ts
  jest.mock("@dashboard/hooks/useClipboard");
  jest.mock("@dashboard/orders/utils/getShareableOrderUrl");
  ```
  `OrderDetailsPage.test.tsx:116-136` asserts DOM order only, not clipboard payload.
- Suggested fix: Add one test with unmocked `getShareableOrderUrl` (stub `window.location` + mount URI) and mocked `navigator.clipboard.writeText` to assert the written string; or an integration test on `OrderDetailsPage` click path.

### F-004 [WARNING] `copied` state persists across `orderId` changes within the 2s feedback window

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:11-23`, `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`
- Description: `useClipboard` state is not reset when `orderId` prop changes. Client-side navigation between orders reuses `OrderDetails` / `OrderDetailsPage` without a `key` on `OrderCopyLinkButton`, so after copying order A the button can still show “Order link copied” (and check icon) while displaying order B for up to 2s; clipboard still holds A’s URL until the user copies again.
- Evidence: `OrderCopyLinkButton` has no `useEffect` on `orderId`; `useClipboard` exposes no reset API (`src/hooks/useClipboard.ts:31`). `OrderDetailsPage.tsx:211` renders `<OrderCopyLinkButton orderId={order.id} />` without `key={order.id}`.
- Suggested fix: Add `key={order.id}` on `OrderCopyLinkButton` in `OrderDetailsPage`, or reset copied state in a `useEffect` when `orderId` changes.

### F-005 [WARNING] No Playwright e2e coverage for copy-order-link

- Location: `playwright/tests/orders.spec.ts` (feature area)
- Description: Order e2e tests exist (`#e2e #order`) but none target `data-test-id="copy-order-link"` or clipboard behavior. A regression in TopNav placement, disabled state, or copy wiring would not be caught in CI e2e.
- Evidence: `rg 'copy-order-link|OrderCopyLink' playwright/` returned no matches. `pnpm run test:quiet` passed 4 unit tests only.
- Suggested fix: Add a Playwright test on order details that clicks `[data-test-id="copy-order-link"]` and asserts clipboard API (or aria-label transition) when backend is available.
