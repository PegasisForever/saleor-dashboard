---
agent: step-7-deep-performance-order-copy-link-pass-1
sequence: 21
input_branch: 7a33d7c2ad35af4836b70ce71dfe223da9e6b021
status: DONE
---

## Summary

Reviewed DEV-68 order-copy-link implementation (8 source/locale files per coordinator scope) from a performance angle: import graph, render vs click hot paths, parent integration in `OrderDetailsPage`, and parallel sub-agents for bundle-size diff and batched chrome traces on Storybook `InTopNav`. Verdict **pass** with zero qualitative findings.

## Decisions made independently

- **No fast-path skip**: Despite small diff size, the area adds production TopNav UI and a new lazy-chunk symbol—ran full mechanical floor (bundle + chrome + render-path review) rather than `angle-not-applicable`.
- **Backend checks skipped**: `getAbsoluteOrderUrl` and clipboard are client-only; no GraphQL/query changes in the area diff.
- **Memory snapshot skipped**: No list virtualization, subscriptions, or unbounded retained state; `useClipboard` 2s timeout is bounded.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/** locale/**`: 8 files, +386 LOC product code
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: click-only URL build, `useClipboard` usage
- `src/orders/urls.ts:194-202`: synchronous `getAbsoluteOrderUrl`
- `src/hooks/useClipboard.ts`: timeout + unmount cleanup
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`: TopNav integration
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:122-139`: copy click invokes `mockCopy` with expected URL
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx`, `OrderUnconfirmedDetails/index.tsx`: sole `OrderDetailsPage` consumers (grep)
- `docs/DEV-68/logs/017-step-7-coordinator-pass-1.md`: 8-file touched scope
- `docs/DEV-68/prd.md`, `tech-plan.md`: no network surface, draft orders out of scope

## Considered then dropped

- **WARNING on `useClipboard` missing clear before re-click**: Re-read `useClipboard.ts`; behavior predates this feature and is shared by `OrderCustomer`, `CopyableText`, etc.—not introduced by order-copy-link; dropped as out-of-scope perf regression.
- **WARNING on `formatMessage` every `OrderDetailsPage` Form re-render**: Parent re-renders are existing; cost is two string lookups on a single icon button—negligible vs form body; dropped.
- **BLOCKER on headless clipboard error**: Chrome sub-agent saw `navigator.clipboard` TypeError in automated Chrome; classified as environment limitation (INP still 39 ms, no network); not a perf finding.

## Dead ends and retries

- **Local `build/dashboard` artifacts**: Not present in workspace after sub-agent run; relied on sub-agent bundle diff output (+558 B orders chunk) plus local import-graph verification instead of re-running two full production builds in main session.

## Ambiguities encountered

- **Coordinator `pass-001` findings folder**: No pre-written `order-copy-link.touchedFiles` JSON on disk; used coordinator log’s enumerated 8 paths as scope entry point.

## Concerns / warnings

- Sub-agent bundle builds are not reproducible in main session without ~minutes of dual `pnpm run build`; import analysis and reported byte deltas are consistent with trivial additive change.

## Did not do (out of scope or deferred)

- **Full dashboard Lighthouse on authenticated order details**: Would require backend + login; Storybook `InTopNav` is the scoped proxy per prior DEV-68 review pattern.
- **Re-run dual production builds in main session**: Delegated to bundle-size sub-agent to avoid OOM alongside chrome.
