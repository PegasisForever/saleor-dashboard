---
agent: step-7-deep-performance-order-copy-link-button-pass-3
input_branch: 7a4e0a69c93b1092d88419dfd90b9dd892bbc0d8
verdict: pass
---

## Summary

Pass-3 performance review on `order-copy-link-button` confirms a negligible production bundle delta (+305 B gzip on the orders lazy chunk), healthy interaction latency (lab INP 40 ms on Storybook `InOrderDetailsTopNav`), and no memory-growth signal after rapid clicks. Iter-6 `copyGeneration` + `clear()` timer fixes are net-positive for correctness and remove orphan-timer churn. Residual concerns are ambient TopNav reconciliation inside the `Form` render-prop, an ineffective `useCallback` wrapper, and collateral re-renders in other `useClipboard` consumers from the shared `copyGeneration` state — all WARNING-tier, not merge-blocking.

## Findings

### F-001 [WARNING] Shared `copyGeneration` state re-renders two-tuple `useClipboard` consumers on rapid re-copy

- Location: `src/hooks/useClipboard.ts:5,19,34` (hook); consumers e.g. `src/orders/components/OrderCustomer/OrderCustomer.tsx:132-134`, `src/components/CopyableText/CopyableText.tsx:14`
- Description: Pass-3 adds `copyGeneration` incremented on every successful `writeText`, but only `OrderCopyLinkButton` reads the third tuple element. Other consumers destructure `[copied, copy]` only. When `copied` is already `true`, `setCopyStatus(true)` is a no-op, but `setCopyGeneration(n => n + 1)` still schedules a React commit — so rapid re-copy in `OrderCustomer` (three hook instances) or hover-gated copy controls pays extra reconciliations without user-visible benefit.
- Evidence:

```17:19:src/hooks/useClipboard.ts
        clear();
        setCopyStatus(true);
        setCopyGeneration(generation => generation + 1);
```

```132:134:src/orders/components/OrderCustomer/OrderCustomer.tsx
  const [copiedEmail, copyEmail] = useClipboard();
  const [copiedShipping, copyShipping] = useClipboard();
  const [copiedBilling, copyBilling] = useClipboard();
```

`useClipboard.test.ts:133-158` documents generation bumps while `copied` stays `true`.

- Suggested fix: Gate generation updates (e.g. `useClipboard({ announceGeneration?: boolean })` default `false`, set `true` only in `OrderCopyLinkButton`), or move generation counter into `OrderCopyLinkButton` local state incremented from a hook `onSuccess` callback.

### F-002 [WARNING] `useCallback` on `handleCopy` does not stabilize `onCopy` across parent re-renders

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:17-19`; `src/hooks/useClipboard.ts:13-28`
- Description: The container wraps the click handler in `useCallback`, but `copy` from `useClipboard` is recreated every hook invocation (not memoized). Because `copy` is in the dependency array, `handleCopy` and the `onCopy` prop to `OrderCopyLinkButtonContent` change identity on every render — including passive `Form` render-prop passes — defeating memoization intent and matching sibling clipboard controls that use inline handlers without the extra `useCallback` cost.
- Evidence:

```17:19:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);
```

```13:28:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      // ...
  };
```

- Suggested fix: Memoize `copy` inside `useClipboard` with `useCallback` (benefits all six consumers), or remove the container `useCallback` to match `CopyableText` / `TrackingNumberDisplay` patterns.

### F-003 [WARNING] TopNav copy button reconciles on every `Form` render-prop pass

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-211`; `src/components/Form/Form.tsx:61-63`
- Description: `OrderCopyLinkButton` is mounted inside the deprecated `Form` children render-prop. Unrelated form dirty/validation churn re-invokes the callback and reconciles the TopNav subtree (copy button, metadata button, menu items) even though the button consumes no form props. This is a pre-existing page pattern; the feature adds one more always-visible Macaw `Button` + `useClipboard` hook to that hot path.
- Evidence:

```206:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
    <Form confirmLeave initial={initial} onSubmit={handleSubmit} mergeData={false}>
      {({ submit }) => {
        return (
          <DetailPageLayout>
            <TopNav href={backLinkUrl} title={<Title order={order} />}>
              <OrderCopyLinkButton />
```

- Suggested fix: Consider `React.memo` on `OrderCopyLinkButton` (zero props from parent) or hoisting TopNav action buttons outside the render-prop if form churn profiling shows measurable cost.

### F-004 [WARNING] Rapid clicks spawn overlapping `writeText` calls with no in-flight guard

- Location: `src/hooks/useClipboard.ts:13-28`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:31-41`
- Description: The button stays enabled while `copied === true`; each click starts a new `navigator.clipboard.writeText` without serialization. Overlapping promises can complete out of click order, and each resolution runs `clear()`, state updates, and timer reschedule — wasted async work on spam clicks (unlikely in production but unbounded).
- Evidence:

```13:15:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
```

No debounce/throttle/in-flight flag; `useClipboard.test.ts:105-131` covers sequential resolves only.

- Suggested fix: Optional in-flight ref to ignore clicks until the prior `writeText` settles, or disable the button briefly after click (product decision).

## Files / sections inspected

### Touched implementation files (coordinator scope, cumulative diff `45b5cef8..HEAD`)

- `src/hooks/useClipboard.ts` — `clear()` before reschedule, `copyGeneration` state, 3-tuple return; perf hot path for all clipboard consumers.
- `src/hooks/useClipboard.test.ts` — timer reset, generation increment, unmount cleanup tests.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `useCallback` + 3-tuple destructuring.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational; `key={copyGeneration}` aria-live remount.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — visually hidden live region styles.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two intl keys (defaultMessages chunk bump).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — unit tests including live-region remount assertion.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook states (non-prod bundle).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only wrapper.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only CSS.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth` props.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-232` — TopNav wire-up; `Form` render-prop parent.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — placement test with mocked hook.
- `playwright/tests/orders.spec.ts:166-189` — E2E clipboard payload + 2s revert timing.
- `playwright/pages/ordersPage.ts` — page object for copy button.
- `locale/defaultMessages.json` — new message ids.
- `docs/DEV-85/prd.md`, `docs/DEV-85/tech-plan.md`, `docs/DEV-85/ui-design.md` — AC and Storybook URL.

### Call sites of new/changed exports

| Export                            | Call sites                                                                                                                               | Contract note                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `OrderCopyLinkButton`             | `OrderDetailsPage.tsx:211` — production, zero props, 1× hook instance; `OrderCopyLinkButton.stories.tsx:67` — Storybook; tests mock hook | Production: passive Form re-renders + hook state drive subtree |
| `OrderCopyLinkButtonContent`      | `OrderCopyLinkButton.tsx:22-27`; `OrderCopyLinkButtonStoryPreview.tsx:32` (no `copyGeneration`); stories `:43,:61`; test `:106,:117`     | `copyGeneration` key remount only on production path           |
| `OrderCopyLinkButtonStoryPreview` | `OrderCopyLinkButton.stories.tsx:31,35,39` only                                                                                          | Storybook-only; no prod callers                                |
| `messages` (OrderCopyLinkButton)  | `OrderCopyLinkButtonContent.tsx:26-27,49` only                                                                                           | `formatMessage` 2–3× per render when copied                    |
| `useClipboard` (3-tuple)          | 7 production + tests; see expansion below                                                                                                | Third element read only in `OrderCopyLinkButton.tsx:15`        |
| `ClipboardCopyIcon` (+props)      | `OrderCopyLinkButtonContent.tsx:35-39`; `TrackingNumberDisplay.tsx:56`                                                                   | `sprinkles()` per icon render                                  |

**`useClipboard` production call sites (grep `useClipboard()` in `src/**/\*.tsx`):\*\*

- `OrderCopyLinkButton.tsx:15` — `[copied, copy, copyGeneration]` — uses generation for aria-live key; **contract respected**.
- `OrderCustomer.tsx:132-134` — 3× `[copied, copy]` — ignores generation; **collateral re-renders on rapid re-copy (F-001)**.
- `CopyableText.tsx:14` — `[copied, copy]` — hover-gated; **collateral re-renders (F-001)**.
- `TrackingNumberDisplay.tsx:16` — `[copied, copy]` — hover-gated; **collateral re-renders (F-001)**.
- `PspReference.tsx:19` — `[copied, copy]` — hover-gated; **collateral re-renders (F-001)**.
- `GiftCardCreateDialogCodeContent.tsx:21` — `[, copy]` — **re-renders on copy success from generation bump**.
- `ChannelForm.tsx:95` — `[, copy]` — same as gift-card.

### Parent / host components read

- `OrderDetailsPage.tsx:206-232` — Renders `<OrderCopyLinkButton />` before metadata `Button`; `order` is optional elsewhere but copy button does not dereference `order` — **wire-up OK for perf**. Inside `Form` render-prop → passive reconciliation scope (F-003).
- `TopNav/Root.tsx` (grep) — flex host for TopNav children; ambient `useAppChannel`/`useUser` cost shared with siblings.
- `Form.tsx:61-63` — render-prop invokes `children(renderProps)` on form state changes.

### Integration sites read

- `src/components/Form/Form.tsx` — render-prop reconciliation driver.
- `src/hooks/useForm/index.ts:239-257` — fresh `renderProps` object each invocation.
- `CopyableText.tsx`, `TrackingNumberDisplay.tsx`, `PspReference.tsx` — sibling clipboard UX patterns (hover-gate vs always-visible TopNav).
- `extensions/.../useClipboardCopy.ts` — separate heavier clipboard hook (not used by copy-link).

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — mocked hook; covers remount via `copyGeneration` key.
- `useClipboard.test.ts` — real timers; generation + timer overlap regression.
- `OrderDetailsPage.test.tsx` — DOM order vs metadata; mocked hook.
- `orders.spec.ts:166-189` — real clipboard + 2s revert (`waitForTimeout(2100)` test-only cost).
- `CopyableText.test.tsx`, `OrderCustomer.test.tsx` — updated 3-tuple mocks.

### Mechanical / adversarial evidence

- Bundle: HEAD vs `45b5cef8` prod builds — orders lazy chunk +1025 B minified / +305 B gzip; `copy-order-link` only in HEAD chunk; `package.json` diff empty.
- Chrome: Storybook `InOrderDetailsTopNav` at `local-deploy:11000/348e26e0-…` — INP 40 ms (2+1+37 ms phases); CLS 0.00; heap +128 KiB after 10 clicks, DOM nodes stable.
- Traces: `docs/DEV-85/findings/prototype/iteration-003/evidence/perf-pass3-inOrderDetailsTopNav-*.trace.json.json.gz` (if present from chrome sub-agent).
