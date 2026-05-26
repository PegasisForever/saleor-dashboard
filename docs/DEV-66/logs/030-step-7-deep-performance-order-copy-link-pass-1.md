---
agent: step-7-deep-performance-order-copy-link-pass-1
sequence: 30
input_branch: 8428347a1c77b9fc3d4b8c33a5da12a724556a8d
status: DONE
---

## Summary

Reviewed cumulative diff `45b5cef8..8428347` for order-copy-link from a performance angle: traced integration in `OrderDetailsPage`, analyzed `useClipboard` / `getOrderAbsoluteUrl` call patterns, ran bundle-size comparison via sub-agent build, and batched Chrome DevTools checks (perf trace, click timing, memory snapshot) against the published Storybook Default story. Verdict: pass with zero findings.

## Decisions made independently

- **Backend checks skipped**: PRD § Scope and tech-plan § API conventions confirm client-only clipboard write; no SQL or handler latency to evaluate.
- **No WARNING for Form render-prop placement**: `OrderCopyLinkButton` sits next to the metadata button inside Form's render prop — same pre-existing re-render boundary; not a regression introduced by this diff.
- **Did not commit perf evidence artifacts**: Sub-agent produced trace/screenshot/heapsnapshot files under `docs/DEV-66/perf-ordercopylink*` (including an 87 MB heapsnapshot); cited metrics in findings but left artifacts untracked to avoid repo bloat.

## Files / sections inspected

- `docs/DEV-66/logs/026-step-7-coordinator-pass-1.md`: area scope (~427 LOC, 10 implementation paths)
- `docs/DEV-66/prd.md`, `docs/DEV-66/tech-plan.md`, `docs/DEV-66/ui-design.md`: client-only scope, Storybook URL, component tree
- `git diff 45b5cef8..HEAD` on order-copy-link paths: full feature diff
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: hooks before null guard, click-only URL build via `useCallback`
- `src/orders/utils/getOrderAbsoluteUrl.ts`: O(1) urlJoin of origin + mount URI + orderPath
- `src/orders/utils/getOrderAbsoluteUrl.test.ts`: mount-uri subpath coverage
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`: TopNav integration before metadata button
- `src/hooks/useClipboard.ts`: async clipboard write, 2s timeout, unmount cleanup
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`, `TrackingNumberDisplay.tsx`: established copy-icon pattern for comparison
- `src/utils/urls.ts:27-28`: `getAppMountUriForRedirect` — cheap config read
- `rg OrderCopyLinkButton|getOrderAbsoluteUrl src/`: single integration site (OrderDetailsPage)
- Sub-agent bundle build output: +852 B total JS, orders chunk +687 B, vendor unchanged
- Sub-agent Chrome traces: LCP 307 ms, INP 57 ms, click-to-frame ~8.7 ms

## Considered then dropped

- **WARNING on hooks running when `orderId` is empty**: Component calls `useIntl` / `useClipboard` before returning `null` for empty `orderId`; brief overhead during loading when `order?.id` is undefined. Rejected — hook cost is negligible and matches React rules; guard prevents DOM mount.
- **WARNING on `React.memo` for OrderCopyLinkButton**: Parent Form render prop could re-render the button when unrelated form state changes. Rejected — sibling metadata `Button` has same pattern; no new perf boundary; memo would be inconsistent micro-optimization.
- **WARNING on pre-existing `useClipboard` rapid-click timeout stacking**: Multiple clicks schedule overlapping timeouts because `copy()` doesn't clear prior timeout before setting a new one. Rejected — pre-existing hook behavior shared by `TrackingNumberDisplay` / `OrderCustomer`; not introduced or worsened by this diff.
- **BLOCKER on bundle growth**: Sub-agent measured +687 B orders chunk / +228 B gzip — far below regression thresholds; `url-join` already bundled via `src/orders/urls.ts`.

## Dead ends and retries

- **Coordinator `touchedFiles` list**: Not in a separate pass-001 manifest file; used coordinator log § Files / sections inspected plus explicit `git diff` on known paths instead.

## Ambiguities encountered

- **Lighthouse performance category unavailable in Storybook iframe context**: Sub-agent used `performance_start_trace` with reload instead; LCP/INP metrics treated as equivalent mechanical evidence for `lighthouse-perf` and `user-flow-timing`.

## Concerns / warnings

- Chrome automation could not invoke `navigator.clipboard.writeText` (console TypeError); icon swap untested in automation but click responsiveness metrics unaffected.
- 87 MB heapsnapshot generated during memory check — deleted from commit scope.

## Did not do (out of scope or deferred)

- **Full order-details page Lighthouse on port 9000**: Would require running dev server against live Saleor backend; Storybook isolated component trace deemed sufficient for this leaf UI change per coordinator routing.
- **Commit perf trace/heapsnapshot artifacts**: Evidence summarized in findings; large binary files left untracked.
