---
agent: step-7-deep-performance-order-copy-link-button-pass-3
sequence: 46
input_branch: 7a4e0a69c93b1092d88419dfd90b9dd892bbc0d8
status: DONE
---

## Summary

Ran pass-3 performance deep review on `order-copy-link-button`: read cumulative diff since `45b5cef8`, expanded to all `useClipboard` consumers and `OrderDetailsPage` Form parent, spawned bundle-size + batched chrome + six adversarial sub-agents, compared HEAD vs base production builds. Verdict **pass** with four WARNINGs (shared `copyGeneration` collateral re-renders, ineffective `useCallback`, Form render-prop passive reconciliation, unguarded overlapping `writeText`). No BLOCKERs; mechanical checks pass/skip.

## Decisions made independently

- **Verdict pass despite WARNINGs**: Rubric allows SHOULD-FIX/WARNING with `pass`; no perf regression meets BLOCKER bar (bundle +305 B gzip, INP 40 ms).
- **Did not read pass-001/002 findings files**: Pure-reviewer rule; used coordinator log `042` for touchedFiles only.
- **Classified `copyGeneration` cross-consumer re-renders as WARNING not SHOULD-FIX**: Re-renders are small React commits on an edge interaction; fix is optional hook opt-in, not required before merge.
- **memory-snapshot skip**: Sub-agent used `performance.memory` delta (~128 KiB) with stable DOM count; full paired `.heapsnapshot` omitted as noise-level for one button.

## Files / sections inspected

- `docs/DEV-85/logs/042-step-7-coordinator-pass-3.md` — touchedFiles list, iter-6 scope.
- `docs/DEV-85/prd.md`, `tech-plan.md`, `ui-design.md` — AC + Storybook URL.
- `git diff 45b5cef8..HEAD` — 18 implementation paths.
- `src/hooks/useClipboard.ts`, `useClipboard.test.ts` — timer + generation hot path.
- `src/orders/components/OrderCopyLinkButton/*` — full feature tree.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-232` — Form/TopNav parent.
- `src/components/Form/Form.tsx:61-63`, `src/hooks/useForm/index.ts:239-257` — render-prop churn.
- `CopyableText.tsx`, `TrackingNumberDisplay.tsx`, `PspReference.tsx`, `OrderCustomer.tsx:132-134` — sibling `useClipboard` consumers.
- `ClipboardCopyIcon.tsx`, `playwright/tests/orders.spec.ts:166-189`.
- Production builds at HEAD and `45b5cef8` worktree — chunk size comparison.

## Considered then dropped

- **BLOCKER on Form render-prop**: Affects entire TopNav, not introduced solely by copy-link; downgraded to F-003 WARNING.
- **BLOCKER on concurrent `writeText` race**: Primarily correctness/clipboard ordering; filed F-004 as perf wasted-work WARNING only.
- **SHOULD-FIX for `copyGeneration` in shared hook**: Considered for `OrderCustomer` (3 hooks × large tree); reclassified WARNING — commits are cheap, rapid triple re-copy is rare.
- **Fast-path skip entire angle**: Rejected — measurable bundle delta and interaction trace surface exist.
- **FAIL mechanical checks**: Chrome clipboard errors in automation (`navigator.clipboard` undefined in burst script) — environment limitation, not prod regression; INP trace from MCP clicks still valid.

## Dead ends and retries

- **pass-003 findings directory missing**: Created `docs/DEV-85/findings/deep-review/pass-003/` before writing output.
- **Bundle sub-agent**: Initial `node_modules` absent; agent ran `pnpm install` + dual worktree builds successfully.

## Ambiguities encountered

- **Chrome sub-agent trace paths** reference `iteration-003/evidence/` — may or may not exist on disk; INP/CLS numbers taken from sub-agent structured return, not re-opened trace files.
- **Coordinator note "verify fixes not re-raise stale"**: Interpreted as don't cite pass-2 finding IDs; independently confirmed iter-6 `clear()` + `copyGeneration` in source.

## Concerns / warnings

- Vendor chunk +2182 B minified on full branch build not isolated to copy-link (manualChunks vendor-only).
- Storybook automation cannot exercise real clipboard; E2E `orders.spec.ts` is the real clipboard perf path but not run this session (no Saleor API).

## Did not do (out of scope or deferred)

- Read sibling pass-003 findings or pass-002 `performance-order-copy-link-button.md`.
- Run `pnpm run test:quiet` or Playwright E2E against live backend.
- Post-merge Lighthouse on production order details (`localhost:9000` unreachable per prior logs).
