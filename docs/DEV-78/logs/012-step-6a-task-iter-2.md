---
agent: step-6a-task-iter-2
sequence: 12
input_branch: d4d20b2886f9c38d18f4299b121a7df53aa3d29e
status: DONE
---

## Summary

Addressed iteration-001 shallow review findings F-001 (BLOCKER) and F-002 (WARNING) for T-986e6e35: cast `jest.requireActual` spreads to `object` in both test files, added `@ts-expect-error` on `window.location` restore in `urls.test.ts`, and synced acceptance checkboxes to `[x]` in `tasks.md`.

## Decisions made independently

- **Scope limited to review findings**: Only fixed the three TS errors cited in F-001 plus F-002 checkbox sync; did not touch `OrderCopyLinkButton.stories.tsx` implicit-`any` errors (pre-existing prototype file, not in review diff).
- **Pattern choice for location restore**: Used `@ts-expect-error` on `afterEach` restore matching `useEnvLink.test.ts` rather than switching to `Object.defineProperty` — minimal diff, same repo convention.

## Files / sections inspected

- `docs/DEV-78/findings/implementation/iteration-001/shallow-review.md`: F-001/F-002 findings and suggested fixes
- `docs/DEV-78/tasks.md`: T-986e6e35 status done, acceptance boxes unchecked (F-002)
- `src/orders/urls.test.ts:12-93`: mock spread + location restore sites
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:10-13`: mock spread site
- `src/components/Sidebar/menu/hooks/useEnvLink.test.ts:27-28`: `@ts-expect-error` location restore pattern
- `src/products/components/ProductDoctor/hooks/useProductAvailabilityDiagnostics.test.tsx:12`: `requireActual as object` pattern
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: confirmed separate tsc-strict errors outside F-001 scope

## Considered then dropped

- **Fixing stories.tsx implicit-any errors**: `check-types` still fails on four errors in stories file from prototype; shallow review explicitly scoped F-001 to the two test files in the task diff — dropped to avoid scope creep.

## Dead ends and retries

- `pnpm install` / lint / check-types / jest initially failed with missing `node_modules` — retried with `pnpm install --store-dir .pnpm-store` (EACCES on global store); succeeded.

## Ambiguities encountered

- **Global check-types vs F-001 scope**: Full `pnpm run check-types` still fails on stories.tsx; verified the three F-001 errors are gone via targeted grep on tsc output. Proceeded since review finding was narrowly scoped.

## Concerns / warnings

- `OrderCopyLinkButton.stories.tsx` has four tsc-strict implicit-`any` errors (decorator `Story`, render `args` params) that may surface in a future mechanical sweep if stories files enter the diff.

## Did not do (out of scope or deferred)

- stories.tsx type fixes: not cited in iteration-001 findings, not in this iteration's diff
- Full Jest suite: diff-scoped tests pass; deferred per prior iteration pattern
- UI smoke via chrome-devtools: no rendered UI changes this iteration
