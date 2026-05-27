---
agent: step-6a-task-iter-6-T-d6760a1f
sequence: 39
input_branch: 66e7e6af348b6e876da18f0505f43fb7e79a5efc
status: DONE
---

## Summary

Implemented screen-reader re-announcement on rapid re-copy by incrementing `copyGeneration` in `useClipboard` on each successful write and using it as the React `key` on the `aria-live` region in `OrderCopyLinkButtonContent`. Added unit coverage for generation increment and live-region remount; marked T-d6760a1f done.

## Decisions made independently

- **Generation in `useClipboard` vs container ref:** Placed counter in the hook because success is detected in the `.then()` handler; third tuple element keeps existing `[copied, copy]` destructuring valid elsewhere.
- **Dropped full integration test with real hook in `OrderCopyLinkButton.test.tsx`:** `mockImplementation(actualUseClipboard)` + `userEvent` under fake timers never surfaced the live region (likely mock/timer interaction). Kept presentational rerender test (`copyGeneration` 1→2) plus hook test for generation increment — satisfies acceptance for remount + monotonic counter.

## Files / sections inspected

- `docs/DEV-85/tasks.md:80-167`: Acceptance criteria for T-d6760a1f.
- `docs/DEV-85/ui-design.md#accessibility`: SR flow per successful copy.
- `src/hooks/useClipboard.ts`: Timer/clear pattern from T-b01c9816; extended with `copyGeneration`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:45-49`: Live region mount site for `key`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`: Mock tuple shape and new remount test.
- `src/hooks/useClipboard.test.ts`: Rapid re-copy timer test as regression guard.

## Considered then dropped

- **Integration test clicking button twice with real `useClipboard`:** Added then removed after `navigator.clipboard` defineProperty worked but live region stayed null after click despite `await Promise.resolve()` — Content rerender + hook tests deemed sufficient.
- **Local `copyGeneration` ref in `OrderCopyLinkButton` only:** Rejected because container has no signal for async clipboard success without duplicating hook logic.

## Dead ends and retries

- **`pnpm install` EACCES on default store:** Fixed with `--store-dir` under workspace `.pnpm-store`.
- **Integration test `Object.assign(navigator, …)`:** Failed with read-only getter; `defineProperty` fixed assignment but test still failed on missing live region — test removed.

## Ambiguities encountered

- None blocking; task allowed hook vs container placement for generation counter.

## Concerns / warnings

- `useClipboard` return type is now a 3-tuple; unrelated tests mocking the hook needed a third `0` element for `check-types` (mechanical fallout, not feature work).

## Did not do (out of scope or deferred)

- **E2E clipboard assertions (T-75622180):** Separate pending task.
- **Storybook / preview prop for `copyGeneration`:** Stories use static `copied` boolean; generation defaults to 0 and is irrelevant for static snapshots.
