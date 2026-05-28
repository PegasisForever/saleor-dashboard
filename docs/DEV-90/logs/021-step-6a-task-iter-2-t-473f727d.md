---
agent: step-6a-task-iter-2-T-473f727d
sequence: 21
input_branch: 1a1eaab94c05b0234b1552a0f8ca6edbd2ea8ba6
status: DONE
---

## Summary

Added `key={order.id}` to `OrderCopyLinkButton` in `OrderDetailsPage.tsx` so React remounts the button when navigating between orders, clearing stale `useClipboard` copied feedback from the previous order.

## Decisions made independently

- **Use `key` on parent render over `useEffect` reset in button**: Task acceptance allows either approach; `key={order.id}` matches the suggested fix, follows `CustomerOrders.tsx` precedent, and avoids adding effect logic to the button component.

## Files / sections inspected

- `docs/DEV-90/tasks.md:68-98`: T-473f727d context and acceptance criteria (desktop-ux/F-001).
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-211`: integration site for the one-line fix.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:30-36`: confirmed copied state lives in local `useClipboard` hook.
- `src/hooks/useClipboard.ts`: verified hook holds `copied` state in component instance (no external reset on prop change).
- `grep OrderCopyLinkButton`: confirmed only `OrderDetailsPage` integrates the button in production.

## Considered then dropped

- **`useEffect` on `orderId` in `OrderCopyLinkButton`**: rejected in favor of parent `key` — simpler, idiomatic React pattern for resetting local state on entity change, already cited in task context.

## Dead ends and retries

- **`pnpm run lint` failed initially**: `node_modules` missing and pnpm store permission error. Fixed with `pnpm install --store-dir <workspace>/.pnpm-store`, then lint passed. Restored unrelated files prettier touched during full-project lint run.

## Ambiguities encountered

- None — task scope was a single mechanical integration fix.

## Concerns / warnings

- Full `pnpm run lint` runs prettier on the entire repo and modified many unrelated doc files; reverted those before commit to keep diff scoped.

## Did not do (out of scope or deferred)

- **Unit test for navigation reset**: acceptance criteria only require the `key` prop and lint pass; no test file exists for `OrderDetailsPage` and task did not request one.
