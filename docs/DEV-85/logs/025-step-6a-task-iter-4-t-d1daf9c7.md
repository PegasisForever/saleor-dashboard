---
agent: step-6a-task-iter-4-T-d1daf9c7
sequence: 25
input_branch: 23bef6f65fdef64db9351547b79b32a3bcb66df1
status: DONE
---

## Summary

Added `OrderDetailsPage.test.tsx` to render the production `OrderDetailsPage` with the shared `order()` fixture and assert that `copy-order-link` precedes `show-order-metadata` in DOM order via `compareDocumentPosition`. Marked T-d1daf9c7 done; lint, type-check, and unit test pass.

## Decisions made independently

- **Full page render vs TopNav fragment stub:** Rendered the real `OrderDetailsPage` with hook mocks (navigator, extensions, dev mode, clipboard) rather than extracting TopNav JSX — matches task acceptance and exercises production wiring.
- **DOM order assertion:** Used `copyButton.compareDocumentPosition(metadataButton) & Node.DOCUMENT_POSITION_FOLLOWING` instead of a custom `toBeBefore` matcher — no existing matcher in repo; native API is sufficient.
- **Test providers:** Wrapped with `MemoryRouter`, `SavebarRefProvider`, and `mockResizeObserver()` after failures without them — minimal additions beyond `@test/wrapper`.

## Files / sections inspected

- `docs/DEV-85/tasks.md` (T-d1daf9c7 context/acceptance): Confirmed scope is integration test for TopNav sibling order.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`: Verified JSX order `OrderCopyLinkButton` then metadata `Button`.
- `src/orders/fixtures.ts` (`order`, `shop`): Reused existing partial-fulfillment order fixture and shop object.
- `src/orders/components/OrderDraftDetails/OrderDraftDetails.test.tsx`: Pattern for `@test/wrapper` + fixture props.
- `src/orders/components/OrderSummary/OrderSummary.test.tsx`: `MemoryRouter` wrapper pattern.
- `src/products/components/ProductVariantPage/ProductVariantPage.test.tsx`: `SavebarRefProvider` requirement.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`: `useClipboard` mock pattern.
- `src/components/Sidebar/Sidebar.test.tsx`: `useDevModeContext` mock shape.

## Considered then dropped

- **Mocking `@dashboard/components/Savebar` entirely:** `OrderManualTransactionRefundPage.test.tsx` does this, but `SavebarRefProvider` was enough and keeps Savebar in the render tree closer to production.
- **Casting order fixture without `as OrderDetailsFragment`:** Needed cast because `order()` returns `OrderDetailsWithMetadataFragment`; structurally compatible for this test.

## Dead ends and retries

- **`pnpm install` EACCES on default store:** Fixed with `pnpm install --store-dir <workspace>/.pnpm-store`.
- **SavebarRefContext error on first render:** Added `SavebarRefProvider` to test wrapper.
- **`ResizeObserver is not a constructor`:** Added `mockResizeObserver()` from Datagrid testUtils (OrderUnfulfilledProductsCard/datagrid path in page tree).

## Ambiguities encountered

- None blocking; task acceptance was explicit about test file location and assertions.

## Concerns / warnings

- Full `OrderDetailsPage` render pulls in many child components (datagrid, summaries, etc.); test is slower than a TopNav-only fragment but more faithful to PRD AC1.

## Did not do (out of scope or deferred)

- Playwright E2E (T-f14eb8c7): Separate pending task.
- Changes to production `OrderDetailsPage` source: Placement already correct; only test coverage was required.
