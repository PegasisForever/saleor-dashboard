---
agent: step-6a-task-iter-1-T-5d103224
sequence: 22
input_branch: b4f114c74ec4966d8b1182542ebc8f6f8442c86b
status: DONE
---

## Summary

Added unit tests for `getOrderAbsoluteUrl` (default and subpath mount) and component tests for `OrderCopyLinkButton` (click copy, icon states, empty orderId). Applied optional strict-narrowing guard in `handleCopy` so optional `orderId` is narrowed before calling the URL builder.

## Decisions made independently

- **Guard inside `handleCopy` instead of moving early return above hooks:** Initially moved `if (!orderId) return null` before `useCallback`, which violates rules of hooks; reverted to guard inside the callback while keeping the render-time early return.
- **Use real URL builder in component test:** Did not mock `getOrderAbsoluteUrl`; relied on default JSDOM `window.location.origin` and config pattern from `auth/utils.test.ts` so click assertions verify end-to-end URL shape.

## Files / sections inspected

- `docs/DEV-66/tasks.md`: Task T-5d103224 acceptance criteria and context excerpts.
- `src/orders/utils/getOrderAbsoluteUrl.ts`: URL join logic under test.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: Component behavior, props, clipboard integration.
- `src/orders/components/OrderCopyLinkButton/messages.ts`: Button accessible name "Copy order link".
- `src/auth/utils.test.ts`: Precedent for `APP_MOUNT_URI` mocking.
- `src/components/CopyableText/CopyableText.test.tsx`: `useClipboard` mock and lucide icon assertion pattern.

## Considered then dropped

- **Moving early return before `useCallback`:** Would fix TS narrowing at definition site but breaks React hooks ordering; dropped in favor of in-callback guard.

## Dead ends and retries

- **`pnpm install` default store:** Failed with EACCES on `/home/kasm-user/.pnpm-store`; retried with `--store-dir` inside the workspace and succeeded.
- **`jest: not found`:** Resolved after installing node_modules.

## Ambiguities encountered

- None blocking; optional strict-narrowing fix was applied as suggested in task context.

## Concerns / warnings

- None.

## Did not do (out of scope or deferred)

- Locale extraction (T-cd5300d3): separate pending task.
- Browser verification via chrome-devtools: unit tests cover acceptance; no layout change to verify visually.
