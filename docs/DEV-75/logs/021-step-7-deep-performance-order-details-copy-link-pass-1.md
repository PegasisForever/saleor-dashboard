---
agent: step-7-deep-performance-order-details-copy-link-pass-1
sequence: 21
input_branch: e4ebc9531190c0993a632681a64d25ca24dc19db
status: DONE
---

## Summary

Reviewed cumulative diff `45b5cef8..HEAD` for the order-details-copy-link area (7 src/locale files). Spawned parallel sub-agents for bundle-size (production build baseline vs HEAD) and batched chrome checks (Lighthouse trace, copy-flow timing, heap snapshots on Storybook). Read integration sites (`OrderDetailsPage`, `useClipboard`, `getAppMountUriForRedirect`, `orderPath`). Verdict: **pass**, zero qualitative findings.

## Decisions made independently

- **Backend checks skipped, not fast-path skip entire angle**: Diff is client-only clipboard UI; `sql-performance` and `backend-latency` marked skip while frontend mechanical checks remain applicable.
- **Storybook acceptable proxy for runtime perf**: No Saleor backend on :9000; Storybook Default story exercises the same component click path. Noted LCP caveat in findings without elevating to WARNING — production OrderDetailsPage load profile differs but copy interaction path is identical.
- **Form render-prop re-render coupling not filed**: Considered WARNING for `OrderCopyLinkButton` inside `Form` render prop (re-invokes hooks on every form state change); dropped because metadata sibling already lived there and incremental hook cost is unmeasurable for one button.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/ locale/`: full implementation diff (~200 LOC)
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: click-only URL build, useCallback handleCopy, no render-time I/O
- `src/orders/components/OrderCopyLinkButton/getOrderAbsoluteUrl.ts`: O(1) string join on click
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-219`: TopNav wiring inside Form render prop
- `src/hooks/useClipboard.ts`: async clipboard + 2s timeout; pre-existing, unchanged
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: icon swap on copied state
- `src/utils/urls.ts:27-28`: `getAppMountUriForRedirect` — sync config read
- `src/orders/urls.ts:192-235`: `orderPath` / `orderUrl` encoding context
- `docs/DEV-75/tech-plan.md`, `docs/DEV-75/prd.md`: no new deps, client-only scope
- `docs/DEV-75/logs/017-step-7-coordinator-pass-1.md`: touchedFiles scope (read for area list only, not sibling findings)
- Sub-agent bundle-size evidence: +1,757 B minified JS+CSS, orders chunk +1.11 kB
- Sub-agent chrome evidence: LCP 1837 ms, click→label ~0.7 ms, 0 network on copy

## Considered then dropped

- **WARNING on Form render-prop placement**: `OrderCopyLinkButton` at `OrderDetailsPage.tsx:211` sits inside `Form` children render prop; every form dirty-state change re-runs `useClipboard`/`useIntl`. Rejected — pre-existing TopNav architecture; metadata `Button` re-renders equally; no measurable perf evidence.
- **WARNING on useClipboard timeout stacking on rapid clicks**: `useClipboard` does not clear prior timeout before scheduling a new one on repeated copies. Rejected — pre-existing hook unchanged in diff; same pattern used in `OrderCustomer`, `CopyableText`, etc.; UX timing edge case, not introduced by this feature.
- **WARNING on missing React.memo**: `orderId` prop is stable; memo could skip re-renders. Rejected — not project convention for TopNav icon buttons; cost of one small component re-render is negligible.
- **FAIL on Storybook-inflated LCP**: 1835 ms of 1837 ms LCP is Storybook shell render delay. Rejected as fail — CWV thresholds still pass; copy interaction timing is the relevant hot path and is instant.

## Dead ends and retries

- None — sub-agents completed on first attempt; bundle builds at baseline and HEAD succeeded.

## Ambiguities encountered

- **Production OrderDetailsPage not exercised in chrome**: Backend unavailable; resolved by scoping runtime checks to Storybook story with explicit caveat in mechanical-check evidence.

## Concerns / warnings

- Storybook dev host (393 network requests, Vite HMR) inflates page-load metrics; production build trace would be cleaner but was not required given copy-path evidence.

## Did not do (out of scope or deferred)

- Production OrderDetailsPage Lighthouse/trace with live Saleor backend: no backend in environment.
- `EXPLAIN ANALYZE` / SQL profiling: no database surface in diff.
- Unit perf benchmarks for `getOrderAbsoluteUrl`: trivial sync string ops, not warranted.
