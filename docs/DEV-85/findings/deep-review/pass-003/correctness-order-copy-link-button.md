---
agent: step-7-deep-correctness-order-copy-link-button-pass-3
input_branch: 7a4e0a69c93b1092d88419dfd90b9dd892bbc0d8
verdict: pass
---

## Summary

Pass-3 correctness review of the cumulative `order-copy-link-button` diff confirms iter-6 loop-back fixes (E2E clipboard payload + 2s revert, `useClipboard` timer `clear()` before reschedule, `copyGeneration` live-region remount) satisfy all PRD acceptance criteria in source. Fourteen scoped unit tests pass. E2E could not execute in this sandbox (`API_URL` unset); the `TC: SALEOR_218` spec was statically verified. No BLOCKER or SHOULD-FIX issues remain; two WARNINGs document pre-existing shared-hook edge cases outside this feature’s production contract.

## Findings

### F-001 [WARNING] Out-of-order `writeText` resolution can desynchronize timer and `copyGeneration`

- Location: `src/hooks/useClipboard.ts:13-28`
- Description: Each `copy()` call attaches an independent `writeText` `.then()` with no invocation token or queue. If promise #1 resolves after promise #2, the later handler calls `clear()` (cancelling the timer armed by #2), sets `copied` true, and bumps `copyGeneration` — so feedback duration and SR remount order follow resolution order, not click order.
- Evidence:

```13:24:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        clear();
        setCopyStatus(true);
        setCopyGeneration(generation => generation + 1);

        timeout.current = window.setTimeout(() => {
          clear();
          setCopyStatus(false);
        }, 2000);
```

Hook tests use immediately resolved mocks (`useClipboard.test.ts:12`); no delayed/out-of-order scenario is exercised. Production `OrderCopyLinkButton` always copies the same `window.location.href` on rapid clicks (`OrderCopyLinkButton.tsx:17-18`), so clipboard payload divergence is unlikely even if timer ordering were wrong.

- Suggested fix: If hardening is desired, track a monotonic `copyInvocationId` ref incremented per click and ignore `.then()` callbacks whose id no longer matches the latest invocation.

### F-002 [WARNING] Late `writeText` resolution after unmount can call `setState` on an unmounted hook instance

- Location: `src/hooks/useClipboard.ts:16-24`, `useClipboard.ts:31-32`
- Description: Unmount cleanup clears only the armed timeout (`useEffect(() => clear, [])`). An in-flight `writeText` promise has no abort/ignore guard; if it resolves after unmount, `.then()` still runs `setCopyStatus(true)`, increments `copyGeneration`, and schedules a new timeout.
- Evidence: `useClipboard.test.ts:83-103` covers unmount with an already-successful copy and active timer, not unmount while `writeText` is pending. `OrderCopyLinkButton` unmounts when navigating away from order details — a slow clipboard API could trigger React state updates on an unmounted hook.
- Suggested fix: Add an `isMounted` ref or per-invocation token checked at the start of the `.then()` body before mutating state or scheduling timers.

## Files / sections inspected

### Touched files (coordinator starting scope)

- `src/hooks/useClipboard.ts` — iter-6 `clear()` before reschedule, `copyGeneration` state, 3-tuple return.
- `src/hooks/useClipboard.test.ts` — timer orphan regression (`:160-200`), generation increment (`:133-158`), failure path (`:202-225`).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `copy(url ?? window.location.href)`; forwards `copyGeneration`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — labels, `aria-live` keyed by `copyGeneration`, `data-test-id`.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — `copyOrderLink` / `orderLinkCopied` ids.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — five container/presentational tests including live-region remount.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` + story preview/CSS — static state coverage; not production paths.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth` (defaults preserved).
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — TopNav wire-up.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:91-108` — DOM order assertion.
- `playwright/tests/orders.spec.ts:155-190` — `TC: SALEOR_218` clipboard + revert E2E.
- `playwright/pages/ordersPage.ts:62` — `copyOrderLinkButton` locator.
- `locale/defaultMessages.json` — `bqtu1/`, `FzcMi0` catalog entries present.

### Call sites of changed exports

| Export                            | Call site                                                                                                                                                                 | Contract                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `OrderCopyLinkButton`             | `OrderDetailsPage.tsx:211`                                                                                                                                                | No `url`/`disabled`; copies `window.location.href` — matches PRD.         |
| `OrderCopyLinkButton`             | `OrderCopyLinkButton.stories.tsx:28,46-58,67`                                                                                                                             | Storybook only; explicit `url` in composition story.                      |
| `OrderCopyLinkButton`             | `OrderCopyLinkButton.test.tsx:23,46,66,89`                                                                                                                                | Tests omit or set `url`; contract respected.                              |
| `OrderCopyLinkButtonContent`      | `OrderCopyLinkButton.tsx:22-27`                                                                                                                                           | Full props including `copyGeneration` from hook.                          |
| `OrderCopyLinkButtonContent`      | `OrderCopyLinkButtonStoryPreview.tsx:32`, stories `:43,61`, tests `:106,117`                                                                                              | Story/tests omit `onCopy` or pass explicit `copyGeneration`; intentional. |
| `OrderCopyLinkButtonStoryPreview` | `OrderCopyLinkButton.stories.tsx:31,35,39`                                                                                                                                | Story-only; no production callers.                                        |
| `ClipboardCopyIcon`               | `OrderCopyLinkButtonContent.tsx:35-39`                                                                                                                                    | Passes `hasBeenClicked`, `iconSize.medium`, `iconStrokeWidth`.            |
| `ClipboardCopyIcon`               | `TrackingNumberDisplay.tsx:56`                                                                                                                                            | Legacy 1-prop call; defaults unchanged — backward compatible.             |
| `useClipboard` (3-tuple)          | `OrderCopyLinkButton.tsx:15`                                                                                                                                              | Only consumer of third element `copyGeneration`.                          |
| `useClipboard` (2-tuple)          | `CopyableText.tsx:14`, `TrackingNumberDisplay.tsx:16`, `OrderCustomer.tsx:132-134`, `PspReference.tsx:19`, `GiftCardCreateDialogCodeContent.tsx:21`, `ChannelForm.tsx:95` | 2-tuple destructuring remains valid against 3-element return.             |

### Parent / host components read

- `OrderDetailsPage.tsx:210-219` — `<OrderCopyLinkButton />` renders unconditionally before metadata button; does not pass `order.id` or `loading` (PRD scopes `disabled` to Storybook only).
- `OrderDetails.tsx:62-67` — `order === null` → NotFound; `order === undefined` during load still renders `OrderDetailsPage`; copy button copies current URL (no `order?.id` deref) — no crash.
- `OrderNormalDetails/index.tsx:201-203` — passes `order` and `loading` into `OrderDetailsPage`; copy button unaffected by loading flag.

### Integration dependencies read

- `src/components/icons/index.ts:12-16,32` — `iconSize.medium` = 20, `iconStrokeWidth` = 1.5.
- `src/orders/urls.ts:192,234-235` — `orderUrl` uses `encodeURIComponent`; feature intentionally uses `window.location.href` per PRD/ui-design.
- `docs/DEV-85/prd.md`, `tech-plan.md`, `ui-design.md`, `project-context.md` — acceptance criteria and architectural constraints.

### Tests overlapping this path

- `useClipboard.test.ts` — 8 tests, all pass.
- `OrderCopyLinkButton.test.tsx` — 5 tests, all pass (hook mocked).
- `OrderDetailsPage.test.tsx` — placement test, pass.
- `playwright/tests/orders.spec.ts:155-190` — static review only (E2E blocked: no `API_URL`).
- `playwright/tests/permissionGroup.spec.ts:119` — unrelated duplicate `SALEOR_218` ticket label (pre-existing).
