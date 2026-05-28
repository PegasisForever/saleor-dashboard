---
agent: step-7-deep-performance-order-copy-link-button-pass-1
sequence: 15
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
status: DONE
---

## Summary

Ran performance deep review on the six-file `order-copy-link-button` diff (~296 LOC). Bundle-size comparison shows +1 KB in the orders lazy chunk only. Chrome DevTools interaction traces on Storybook `InOrderDetailsTopNav` pass (INP 42 ms, 14 ms click-to-feedback, no heap growth after 10 rapid clicks). Filed two WARNINGs for inherited `useClipboard` timer stacking and unmemoized Form-render-prop re-renders; no BLOCKERs. Verdict: pass.

## Decisions made independently

- **Classified useClipboard timer orphan as WARNING not SHOULD-FIX:** The bug lives in a shared pre-existing hook reused per PRD across 10+ copy surfaces; fixing it is out of this feature's diff scope and not a merge blocker for performance.
- **Did not fast-path skip:** Despite no backend surface, the feature adds a new lazy-chunk component and TopNav render path—bundle-size and Chrome interaction checks were applicable and executed.
- **Rejected BLOCKER on post-unmount setState:** `useClipboard` lacks an mounted guard on promise resolution, but this is inherited hook behavior with no measurable perf impact in Chrome testing; correctness angle owns that if actionable.

## Files / sections inspected

- `git diff 45b5cef..HEAD -- src/orders/components/OrderCopyLinkButton/ src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — full feature delta
- `docs/DEV-90/prd.md`, `tech-plan.md`, `ui-design.md` — acceptance criteria and architecture
- `docs/DEV-90/logs/011-step-7-coordinator-pass-1.md` — touchedFiles scope (read coordinator log only for file list, not findings)
- `OrderCopyLinkButton.tsx`, `getShareableOrderUrl.ts`, `useClipboard.ts`, `ClipboardCopyIcon.tsx`, `OrderDetailsPage.tsx:206-219`
- `src/orders/urls.ts:234-235`, `src/utils/urls.ts:27-28`, `src/hooks/useClipboard.test.ts`
- `src/components/AppLayout/TopNav/Root.tsx:68-74` — layout host
- Grep: `getShareableOrderUrl`, `OrderCopyLinkButton`, `orderCopyLinkButtonMessages` — call site enumeration
- Production builds at anchor vs HEAD for chunk size comparison
- Storybook at `http://local-deploy:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d` — Chrome perf trace + heap snapshot

## Considered then dropped

- **SHOULD-FIX for defeated `useCallback`:** `handleCopy` depends on unstable `copy` from `useClipboard`, making `useCallback` a no-op. Considered SHOULD-FIX but downgraded — sibling copy buttons (`TrackingNumberDisplay`, `CopyableText`) use inline handlers without `useCallback`; removing it would be style consistency, not perf gain.
- **WARNING on huge orderId DoS:** Theoretically unbounded string work per click, but `order.id` is server-issued Global ID; URL manipulation hits GraphQL first. Dropped as unreachable in production perf path.
- **FAIL on bundle delta:** +1,055 B is 0.27% of orders chunk — well within noise; kept as pass.

## Dead ends and retries

- Sub-agent bundle build initially hit pnpm EACCES on global store; succeeded with workspace-local store dir.
- `lighthouse_audit` MCP tool excludes performance scores; switched to `performance_start_trace` + `performance_analyze_insight` for INP/CLS as documented in MCP schema.

## Ambiguities encountered

- **No unit tests in diff:** Coordinator noted this; treated as coverage gap for correctness reviewers, not a performance signal since Chrome interaction testing covered the copy path.

## Concerns / warnings

- Heap snapshot file is 133 MB (Storybook runtime baseline); growth assessment relied on string-instance counts and JS heap used size, not absolute snapshot size.

## Did not do (out of scope or deferred)

- **Full order details page Lighthouse navigation audit:** Requires authenticated Saleor backend; Storybook composition story is the approved perf proxy per ui-design.md.
- **sql-performance / backend-latency:** Client-only feature per tech-plan; marked skip.
- **Fix useClipboard timer stacking:** Shared hook change outside this area's diff.
