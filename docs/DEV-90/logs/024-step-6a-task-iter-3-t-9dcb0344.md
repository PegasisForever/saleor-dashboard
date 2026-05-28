---
agent: step-6a-task-iter-3-T-9dcb0344
sequence: 24
input_branch: ea2f400553e7a2200bef992f01dda5208f06e994
status: DONE
---

## Summary

Added Jest coverage for `getShareableOrderUrl` (default mount, custom subpath mount, encoded order IDs with trailing `?`) and for `OrderCopyLinkButton` click path asserting `useClipboard`'s `copy` receives the shareable absolute URL. All acceptance tests and lint pass.

## Decisions made independently

- **Partial mock of `@dashboard/utils/urls`**: Kept actual module exports and only mocked `getAppMountUriForRedirect`, matching the deep-review suggested fix and avoiding brittle reimplementation of `orderUrl`.
- **Compute expected URL via `getShareableOrderUrl(orderId)` in component test**: Ensures the assertion stays tied to the real URL builder rather than duplicating URL string literals.
- **Three cases in URL builder test**: Default mount (`""`), custom `/dashboard` subpath, and special-character order id — covers F-001 branches cited in task context.

## Files / sections inspected

- `docs/DEV-90/tasks.md#T-9dcb0344`: acceptance criteria and deep-review context for F-001/F-002.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts`: URL composition via `orderUrl`, `getAppMountUriForRedirect`, `urlJoin`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:32-34`: `handleCopy` passes `getShareableOrderUrl(orderId)` to `copy`.
- `src/orders/urls.ts:234-235`: `orderUrl` adds `encodeURIComponent` and trailing `?`.
- `src/utils/urls.ts:27-28`: `getAppMountUriForRedirect` returns `""` for default mount.
- `src/components/CopyableText/CopyableText.test.tsx`: `useClipboard` mock + click → `mockCopy` pattern.
- `src/orders/components/OrderCustomer/OrderCustomer.test.tsx:26-30`: alternate `useClipboard` mock style.
- `src/extensions/.../appActionsHandler.test.ts:72-84`: `window.location` mock pattern for jsdom.

## Considered then dropped

- **Mocking `getShareableOrderUrl` directly in component test**: Dropped — acceptance requires asserting the same URL the real builder produces; partial utils mock + import is cleaner.
- **Adding aria-live region test in this file**: Deferred to T-4c7d375b per task scope separation in tasks.md.

## Dead ends and retries

- **`jest: not found` / missing node_modules**: Ran `pnpm install --store-dir <workspace>/.pnpm-store` per prior iteration logs; tests then passed.

## Ambiguities encountered

- None — task context and reference tests were sufficient.

## Concerns / warnings

- None.

## Did not do (out of scope or deferred)

- **T-4c7d375b aria-live region**: separate pending task; not part of T-9dcb0344 scope.
- **Navigation reset test for `key={order.id}`**: flagged as WARNING in shallow review iteration 2; no task assigned this iteration.
