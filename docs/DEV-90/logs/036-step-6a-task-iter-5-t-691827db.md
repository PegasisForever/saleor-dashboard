---
agent: step-6a-task-iter-5-T-691827db
sequence: 36
input_branch: ae13d9839dfa4a34a34883d3e2b6a9c1dfb779f2
status: DONE
---

## Summary

Added a remount-guard unit test to `OrderCopyLinkButton.test.tsx` that simulates parent `key={order.id}` navigation: copied state on order A, rerender with a new `key`/`orderId` and fresh `useClipboard` mock, then asserts default `aria-label`/`title` and absence of the `role="status"` region. Marked T-691827db done; tests and lint pass.

## Decisions made independently

- **Mock `[false, jest.fn()]` on rerender:** Remount creates a new component instance; production `useClipboard` starts with `copied=false`. Changing the mock on rerender documents that contract rather than expecting React to clear a module-level mock automatically.
- **Use real encoded order IDs as keys:** `key={orderIdA}` / `key={orderIdB}` mirrors `OrderDetailsPage` (`key={order.id}`) instead of literal `"order-a"` strings from the task sketch.

## Files / sections inspected

- `docs/DEV-90/tasks.md` (T-691827db acceptance): remount test requirements and suggested approach
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`: existing mock/render patterns for click and aria-live tests
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:30-64`: `useClipboard`, label swap, status region
- `src/orders/components/OrderCopyLinkButton/messages.ts`: default/copied message strings
- `docs/DEV-90/findings/deep-review/pass-002/` (via task context): F-001 gap on `key={order.id}` coverage

## Considered then dropped

- **Single mock `[true]` through rerender:** Would still show copied UI after remount because the mock does not reset with React lifecycle — rejected; switched to `[false]` on rerender to model fresh hook state.
- **Testing `OrderDetailsPage` integration:** Task acceptance targets component test with `key` rerender; page-level test deferred as out of scope for this task.

## Dead ends and retries

- **`pnpm install` default store:** `EACCES` on `/home/kasm-user/.pnpm-store/v10`; fixed with `pnpm install --store-dir <workspace>/.pnpm-store`.
- **Initial test/lint without node_modules:** `jest: not found`; resolved after install.

## Ambiguities encountered

- None blocking; task acceptance aligned with existing test file structure.

## Concerns / warnings

- Test guards the remount + fresh-hook contract; removing `key={order.id}` while only changing `orderId` would still pass this test (different failure mode). Production fix remains `key={order.id}` in `OrderDetailsPage.tsx:211`.

## Did not do (out of scope or deferred)

- **T-339596b4 aria-label/title on copied-state test:** separate pending task; not touched this run.
- **Playwright navigation step:** task allowed component test; E2E left for future if needed.
