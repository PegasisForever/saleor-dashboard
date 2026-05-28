---
agent: step-6a-task-iter-7-T-eabc6a89
sequence: 49
input_branch: 78b93aa5b9d24a6391df37271369a3317a955bfa
status: DONE
---

## Summary

Added an integration-style test in `OrderCopyLinkButton.test.tsx` that exercises the real `useClipboard` hook through a click: it asserts label/icon transition to copied state, then reversion after 2000 ms fake-timer advance. Updated the module mock factory so mocked tests keep `mockReturnValue` control while the new describe delegates to `jest.requireActual(...).useClipboard`.

## Decisions made independently

- **Separate describe with real hook via `mockImplementation(requireActual)`**: Kept file-level `jest.mock` (needed by existing tests) but the transition describe resets to the real hook implementation instead of `mockReturnValue` stubs.
- **`fireEvent.click` over `userEvent.click`**: `userEvent` with `advanceTimers` prevented reliable `navigator.clipboard.writeText` mock invocation; `fireEvent.click` + `waitFor` matched hook promise timing under fake timers.
- **`Object.defineProperty` for clipboard**: Safer than `Object.assign(navigator, …)` when prior tests may leave a read-only `navigator.clipboard` getter.

## Files / sections inspected

- `docs/DEV-90/tasks.md` (T-eabc6a89 acceptance): scoped the integration test requirements
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`: existing mocked tests at :48-134
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:30-64`: `copied` → `isCopied` → label/icon wiring
- `src/hooks/useClipboard.test.ts:59-141`: fake-timer + clipboard mock pattern for 2s reset
- `src/components/CopyableText/CopyableText.test.tsx:50`: `.lucide-check` assertion pattern
- `docs/DEV-90/findings/deep-review/pass-003/correctness-order-copy-link-button.md` (via tasks context): F-002 rationale

## Considered then dropped

- **`jest.isolateModules` + `jest.unmock`**: Caused duplicate React instance (`useState` null dispatcher) when re-requiring the component; abandoned.
- **`jest.spyOn(useClipboardModule, "useClipboard")` without file mock**: Failed with "Cannot redefine property: useClipboard" on the ESM export.
- **Separate integration test file**: Rejected — acceptance requires the test live in `OrderCopyLinkButton.test.tsx`.

## Dead ends and retries

- **`pnpm install` EACCES on default store**: Fixed with `pnpm install --store-dir ./.pnpm-store`.
- **`Object.assign(navigator, { clipboard })` in integration beforeEach**: Failed when running full file after mocked tests (`only a getter`); switched to `defineProperty`.
- **`userEvent.setup({ advanceTimers })` click**: `mockWriteText` received 0 calls despite hook state updates; replaced with `fireEvent.click` + `waitFor`.

## Ambiguities encountered

- **"Does not mock useClipboard" with co-located mocked tests**: Interpreted as the transition describe must run the real hook (`mockImplementation(requireActual)`) rather than `mockReturnValue` stubs; file-level `jest.mock` wrapper remains for sibling tests.

## Concerns / warnings

- Integration describe's `afterEach` restores real hook via `mockReset` + `mockImplementation` so subsequent mocked tests aren't affected; first describe tests still set `mockReturnValue` per case.

## Did not do (out of scope or deferred)

- **OrderDetailsPage integration test (F-001)**: Router DEFER disposition; not in task scope.
- **Production component changes**: Test-only task.
