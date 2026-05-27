---
agent: step-7-deep-performance-order-copy-link-button-pass-1
sequence: 17
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
status: DONE
---

## Summary

Ran performance deep review for DEV-78 order-copy-link-button: spawned parallel sub-agents for bundle-size diff, batched chrome checks (Lighthouse, interaction trace, heap snapshot), and six adversarial qualitative prompts. All mechanical checks passed or were skipped (backend N/A). Wrote findings with pass verdict and zero performance findings; inherited `useClipboard` timer overlap was considered but not attributed to this diff.

## Decisions made independently

- **Verdict pass with zero findings:** Bundle +705 B and runtime metrics are within noise; perf risks traced to pre-existing `useClipboard` hook, not changed in diff range.
- **Chrome checks via Storybook:** Sub-agent reported Saleor backend down; Storybook `Orders/OrderCopyLinkButton` with TopNav decorator exercises the same component path — accepted as valid proxy for lighthouse/user-flow/memory.
- **Skipped sql-performance and backend-latency:** Tech plan confirms client-only feature with no GraphQL/backend changes.

## Files / sections inspected

- `git diff 45b5cef8..HEAD --stat`: 11 files, +515 LOC, no package.json changes
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: click-only URL build, local useClipboard state
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx`: formatMessage per render, ClipboardCopyIcon
- `src/orders/utils/getShareableOrderUrl.ts`: urlJoin on click path
- `src/hooks/useClipboard.ts`: unchanged in diff; timer/promise lifecycle for inherited-behavior assessment
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-219`: Form render prop integration
- `src/components/AppLayout/TopNav/Root.tsx:68-83`: children render without memo
- `docs/DEV-78/prd.md`, `docs/DEV-78/tech-plan.md`: scope and architecture
- Sub-agent bundle build output: base vs HEAD chunk comparison
- Sub-agent chrome evidence: Storybook port 6006, INP 89 ms, heap −901 KB after 10 clicks

## Considered then dropped

- **WARNING on useClipboard timer overlap under rapid clicks:** Sub-agents flagged orphaned timers at `useClipboard.ts:18-21`, but `git diff` shows hook untouched; same behavior already used by OrderCustomer, CopyableText, etc. Attributing to this feature would be out of diff scope for performance review.
- **WARNING on Form render-prop re-render coupling:** OrderCopyLinkButton re-renders with Form churn, but metadata Button has identical placement; not a regression from adding one more leaf in existing subtree.
- **WARNING on ineffective useCallback:** `copy` from useClipboard is unstable, so `handleCopy` recreates every render — slightly worse ceremony than inline lambdas used by peers, but no measurable perf impact; dropped as noise for performance angle.
- **BLOCKER on bundle vendor chunk +2182 B:** Sub-agent noted vendor growth, but feature strings/chunks account for ~705 B in orders chunk; vendor delta likely unrelated build variance — not attributed to feature.

## Dead ends and retries

- None in main session; chrome sub-agent installed deps and started Storybook after backend unavailable.

## Ambiguities encountered

- **Live order details page unavailable:** Backend at localhost:8000 down; chrome sub-agent used Storybook with TopNav decorator — sufficient to exercise copy button interaction and heap behavior.

## Concerns / warnings

- Pre-existing `useClipboard` lacks timer clear-before-reschedule and in-flight guard; if clipboard buttons proliferate, a shared hook fix would benefit all consumers — outside this diff's performance footprint.

## Did not do (out of scope or deferred)

- Full order-details Lighthouse on production build with auth — backend unavailable; Storybook proxy used instead.
- SQL/backend latency — no backend surface in area.
