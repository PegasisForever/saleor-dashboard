---
agent: step-6b-shallow-review-post-done-iter-1
input_branch: a571ed1a8cebca4f64b69db030d38db792603cc6
verdict: continue-with-fix
---

## Summary

Task T-986e6e35 delivers the requested unit/component tests and locale catalog entries with correct behavioral coverage, scoped lint, diff-scoped Jest runs, and a successful production build. `pnpm run check-types` fails on three TypeScript errors introduced in the two new/changed test files (`jest.requireActual` spread typing and `window.location` restore). These are local, pattern-level fixes the task agent can apply without planning changes.

## Findings

### F-001 [BLOCKER] `check-types` fails on new test files

- Location: `src/orders/urls.test.ts:13,92`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:11`
- Description: `pnpm run check-types` (`tsc --noEmit && tsc-strict`) exits 2 with three errors in the task diff. Partial mocks spread `jest.requireActual(...)` without an object cast (TS2698), and `urls.test.ts` restores `window.location` in `afterEach` without suppressing the assignment error (TS2322).
- Evidence:
  ```
  src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx(11,3): error TS2698: Spread types may only be created from object types.
  src/orders/urls.test.ts(13,3): error TS2698: Spread types may only be created from object types.
  src/orders/urls.test.ts(92,7): error TS2322: Type 'Location' is not assignable to type 'string & Location'.
  ```
  Existing codebase pattern for TS2698: `...(jest.requireActual("…") as object)` (e.g. `useProductAvailabilityDiagnostics.test.tsx:12`). Existing pattern for location mock restore: `@ts-expect-error` on assignment (`useEnvLink.test.ts:27-28`) or `Object.defineProperty(window, "location", …)` (`useFilterPresets.test.ts:14-26`).
- Suggested fix: Cast both `jest.requireActual` spreads to `object`; add `@ts-expect-error` on the `afterEach` restore line in `urls.test.ts` (matching `useEnvLink.test.ts`) or switch to `Object.defineProperty` for location mocking.

### F-002 [WARNING] Task acceptance checkboxes not updated

- Location: `docs/DEV-78/tasks.md` — T-986e6e35 Acceptance section
- Description: Task status is set to `done`, but all six acceptance criteria remain `[ ]`. This creates a mismatch between declared completion and checklist state for downstream reviewers.
- Evidence: `Status: done` at line 5; acceptance lines 75–80 still use `- [ ]`.
- Suggested fix: Mark acceptance checkboxes `[x]` when marking the task done, or leave checkboxes for human sign-off but add a note — prefer syncing to `[x]` since tests and locale were verified.
