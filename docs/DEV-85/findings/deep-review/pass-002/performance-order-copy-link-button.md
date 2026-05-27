---
agent: step-7-deep-performance-order-copy-link-button-pass-2
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
verdict: pass
---

## Summary

Pass-2 performance review of the order-copy-link-button area finds negligible production bundle impact (+3.5 KiB total JS/CSS; +985 B orders lazy chunk; 0 B main index entry chunk delta), healthy Storybook-measured interaction latency (INP 59 ms on copy click; stable single `aria-live` node after five rapid clicks), and a net improvement from the `useClipboard` `clear()` timer fix (eliminates orphan-timeout commit churn). No BLOCKER or SHOULD-FIX performance regressions; two WARNINGs document pre-existing Form render-prop reconciliation coupling and ineffective `useCallback` stabilization.

## Findings

### F-001 [WARNING] Always-mounted TopNav button reconciles on every Form render-prop pass

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (TopNav integration)
- Description: `OrderCopyLinkButton` is mounted inside the deprecated `Form` render-prop child, so unrelated form dirty-state and validation churn re-renders the copy-button subtree even when `copied` is unchanged. The button is always visible (not hover-gated like sibling clipboard controls), so this passive cost is paid on every order-details form reconciliation.
- Evidence:

```206:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
    <Form confirmLeave initial={initial} onSubmit={handleSubmit} mergeData={false}>
      {({ submit }) => {
        return (
          <DetailPageLayout>
            <TopNav href={backLinkUrl} title={<Title order={order} />}>
              <OrderCopyLinkButton />
```

Contrast: `TrackingNumberDisplay.tsx:52-57` gates copy UI behind hover opacity; `CopyableText.tsx:23-34` uses hover/focus visibility. Neither is in the TopNav Form render-prop path.

- Suggested fix: Optional future refactor to hoist TopNav outside the `Form` render-prop (same structural change would benefit the adjacent metadata button). Not required for merge — cost is ambient and matches existing TopNav patterns.

### F-002 [WARNING] `useCallback` on `handleCopy` does not stabilize `onCopy` across parent re-renders

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
- Description: `handleCopy` depends on `copy` from `useClipboard`, but `copy` is recreated every hook invocation without memoization. `useCallback` therefore recreates `handleCopy` on every parent-driven re-render, passing a new `onCopy` reference to `OrderCopyLinkButtonContent` and defeating referential stabilization. Sibling clipboard consumers use inline handlers without `useCallback`.
- Evidence:

```17:21:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);

  return <OrderCopyLinkButtonContent copied={copied} disabled={disabled} onCopy={handleCopy} />;
```

```12:32:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      ...
  };

  return [copied, copy];
```

- Suggested fix: Drop `useCallback` to match siblings, or memoize `copy` inside `useClipboard` (benefits all consumers). Perf impact is one function allocation per Form re-render — negligible in isolation.

## Files / sections inspected

### Touched files

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `useClipboard` + `useCallback` click path; passes `window.location.href` at click time.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational layer; conditional `aria-live` mount; `formatMessage` per render.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two i18n keys only.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — mocked hook; copied-state + live-region assertions.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook-only; not in production bundle.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only wrapper; zero production importers.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only CSS; excluded from `build/dashboard`.
- `src/hooks/useClipboard.ts` — pass-2 `clear()` before reschedule; 2s timer; unmount cleanup.
- `src/hooks/useClipboard.test.ts` — rapid re-copy timer regression (`:133-173`); unmount timer cleanup.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — backward-compatible optional `size`/`strokeWidth`.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — TopNav wire-up at `:211`.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — placement test; mocks `useClipboard`.
- `playwright/tests/orders.spec.ts` — E2E copy + placement (`:155-178`).
- `playwright/pages/ordersPage.ts` — page object selectors (`:62-63`).
- `locale/defaultMessages.json` — two new message entries.
- `docs/DEV-85/prd.md`, `docs/DEV-85/tech-plan.md`, `docs/DEV-85/ui-design.md` — scope and architecture (no new deps/API).

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production, zero props, always mounted); `OrderCopyLinkButton.stories.tsx:67` (Storybook); `OrderCopyLinkButton.test.tsx:22,45,65,88` (mocked hook). Contract respected: production omits `url` → `window.location.href` at click.
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21` (production); `OrderCopyLinkButton.stories.tsx:43,61` (presentational stories); `OrderCopyLinkButtonStoryPreview.tsx:32` (story-only, no `onCopy`). Contract respected.
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` only; no production callers.
- `OrderCopyLinkButtonStoryInteractionState` (type) — `OrderCopyLinkButtonStoryPreview.tsx:4,9,13` only; erased at compile.
- `messages` — `OrderCopyLinkButtonContent.tsx:7,24-25,47` only; no other repo importers per grep.
- `ClipboardCopyIcon` (modified) — `OrderCopyLinkButtonContent.tsx:33-37` (explicit medium sizing); `TrackingNumberDisplay.tsx:56` (defaults unchanged). No duplicate bundle inclusion.

### Parent / host components

- `OrderDetailsPage.tsx:206-219` — renders `<OrderCopyLinkButton />` before metadata button; not gated on `loading`; inside `Form` render prop; `order` optional elsewhere but button needs no order id.

### Integration surfaces

- `src/hooks/useClipboard.ts` — async `navigator.clipboard.writeText`; pass-2 `clear()` at `:16` fixes orphan timers; unmount `useEffect` at `:29-30`.
- `src/components/Form/Form.tsx` — render-prop re-invocation pattern (read for Form coupling).
- `src/components/AppLayout/TopNav/Root.tsx` — flex action row hosting copy + metadata siblings.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — unit coverage; hook mocked (no real timer perf).
- `useClipboard.test.ts:133-173` — rapid re-copy timer (load-bearing for pass-2 fix).
- `OrderDetailsPage.test.tsx:91-109` — DOM sibling order only.
- `playwright/tests/orders.spec.ts:155-178` — real click + copied `aria-label` (no rapid-click perf assertion).

### Mechanical evidence

- Bundle: HEAD vs `45b5cef8` — +3519 B total JS/CSS; main index chunk 0 B delta; orders lazy chunk +985 B; no `package.json` diff.
- Storybook Chrome trace (local, not committed): INP 59 ms on copy click in `InOrderDetailsTopNav`; five rapid clicks in 354 ms with `liveCount: 1` (no aria-live accumulation).
