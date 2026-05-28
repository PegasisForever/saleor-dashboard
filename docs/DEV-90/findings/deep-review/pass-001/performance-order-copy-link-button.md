---
agent: step-7-deep-performance-order-copy-link-button-pass-1
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
verdict: pass
---

## Summary

Performance review of the `order-copy-link-button` area finds no blockers. Production bundle impact is +1,055 B minified (+322 B gzip) in the existing orders lazy chunk; vendor and initial entry chunks are unchanged. Chrome interaction traces on the `InOrderDetailsTopNav` Storybook story show INP 42 ms and click-to-feedback 14 ms, with no heap growth after 10 rapid copy clicks. Two WARNINGs note inherited `useClipboard` timer behavior on rapid re-clicks and unmemoized re-renders inside the `Form` render prop—both match established codebase patterns and have negligible user-visible impact.

## Findings

### F-001 [WARNING] Rapid re-clicks stack orphaned timers in inherited `useClipboard`

- Location: `src/hooks/useClipboard.ts:15-21` (consumed by `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:30-34`)
- Description: Each successful `navigator.clipboard.writeText` schedules a new 2 s reset timer without clearing a prior pending timer. On rapid re-clicks within the feedback window, earlier timers remain in the event loop; when they fire, they call `setCopyStatus(false)` and may cancel the tracked timer via `clear()`, causing extra React state updates beyond the two per copy cycle the PRD expects.
- Trigger: Staff user double- or triple-clicks the copy button within ~500 ms while the check icon is visible (before the 2 s feedback expires). Realistic on touch devices or when confirming copy succeeded.
- Impact: Copied icon/label may flicker off briefly between clicks; each orphaned timer adds an extra `setCopyStatus` reconciliation pass (~1–2 ms processing per the 42 ms INP trace). No clipboard corruption or page slowdown observed in Chrome testing.
- Evidence: `useClipboard` assigns `timeout.current = window.setTimeout(...)` without calling `clear()` first (`useClipboard.ts:18-21`); the multi-copy test explicitly allows concurrent writes (`useClipboard.test.ts:105-130`). Chrome heap snapshot after 10 rapid clicks showed no string accumulation.
- Suggested fix: Out of scope for this feature diff (shared hook), but clearing `timeout.current` before scheduling a new timer in `useClipboard.copy` would eliminate orphan timers project-wide. Alternatively, debounce or disable the button during the 2 s window if flicker becomes user-reported.

### F-002 [WARNING] Copy button re-renders on every Form-driven OrderDetailsPage update without memo boundary

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-211`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-59`
- Description: `OrderCopyLinkButton` is mounted inside the `Form` render-prop child and is not wrapped in `React.memo`. Every metadata form field change or Apollo order refetch that re-runs the Form children function re-renders the button, executing `intl.formatMessage`, `clsx`, and creating a new `icon` element—even when `orderId` and `copied` are unchanged.
- Trigger: Staff user edits order metadata fields on the order details page (e.g., typing in a metadata input). Each keystroke-driven form state update propagates to TopNav.
- Impact: One additional lightweight component reconciliation per form update (~µs-level per render; no layout shift). Observable only under React DevTools profiler, not to end users. Matches the adjacent metadata `Button` which also lacks memoization.
- Evidence: Button placement at `OrderDetailsPage.tsx:210-211` inside `{({ submit }) => (...)}` at line 207; no `React.memo` on export at `OrderCopyLinkButton.tsx:21`. Grep confirms zero `React.memo` usage under `src/orders/`. `getShareableOrderUrl` is correctly deferred to click time (`OrderCopyLinkButton.tsx:32-33`), so re-renders do not repeat URL construction.
- Suggested fix: Optional `React.memo(OrderCopyLinkButton)` if profiling shows TopNav churn matters; not required for merge given sibling-button parity and negligible cost.

## Files / sections inspected

### Touched files

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — click-scoped URL build, `useClipboard` integration, per-render label/icon work
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — sync string assembly on click only; no caching
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n catalog; `formatMessage` called each render
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — CSS-only pseudo-states; no JS perf impact
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — dev-only; TopNav composition stories used for Chrome perf checks
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:38,206-219` — parent wire-up with `order?.id` guard; Form render-prop placement

### Call sites of new/changed exports

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` — passes `orderId={order.id}` only when `order?.id` truthy; contract respected
- `OrderCopyLinkButton` — `OrderCopyLinkButton.stories.tsx:95` — Storybook render with static `orderId="T3JkZXI6MQ=="`
- `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` — sole production caller; invoked on click inside `handleCopy`
- `orderCopyLinkButtonMessages` — `OrderCopyLinkButton.tsx:9,39-40` — sole caller; imported as `messages`

### Parent / host components

- `OrderDetailsPage.tsx:210-211` — renders `<OrderCopyLinkButton orderId={order.id} />` inside `TopNav` within Form render prop; guarded by `order?.id`; loading state omits button (null); matches PRD
- `TopNav` (`src/components/AppLayout/TopNav/Root.tsx:68-74`) — flex row host; one extra 32×32 button slot; no scroll/list perf concern

### Integration sites

- `src/hooks/useClipboard.ts` — async clipboard + 2 s timer; timer cleanup on unmount; no in-flight promise guard
- `src/orders/urls.ts:234-235` — `orderUrl` with `encodeURIComponent`; used by `getShareableOrderUrl`
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` config read per click
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — icon swap on copied state; 16×16 SVG mount/unmount on click

### Tests

- `src/hooks/useClipboard.test.ts` — covers timer cleanup on unmount and multi-copy behavior; no overlap/timer-advance tests
- No unit tests for `getShareableOrderUrl` or `OrderCopyLinkButton` (Storybook only); not a performance regression signal

### Mechanical check evidence

- Bundle: orders lazy chunk +1,055 B minified / +322 B gzip vs anchor `45b5cef`; vendor unchanged
- Chrome trace: INP 42 ms, CLS 0.00, click-to-feedback 14 ms on `InOrderDetailsTopNav` story
- Heap snapshot: `docs/DEV-90/findings/deep-review/pass-001/evidence/performance-order-copy-link-button-heap.heapsnapshot` — no label/URL string accumulation after 10 rapid clicks
