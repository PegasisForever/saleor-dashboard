---
agent: step-7-deep-performance-order-copy-link-button-pass-2
sequence: 31
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
status: DONE
---

## Summary

Ran pass-2 performance deep review on the order-copy-link-button area (~470 LOC src delta since `45b5cef8`). Expanded scope to parent views, TopNav host, `useClipboard`/`orderUrl` integration, and all export call sites. Spawned bundle-size shell sub-agent, batched chrome sub-agent (Storybook interaction traces), and six qualitative forced-prompt explore sub-agents. Verdict **pass**: bundle localized (+1.3 KB orders chunk), interaction INP 47 ms, no heap leak; three WARNINGs for ambient Form re-renders, aria-live DOM lifecycle, and `key` remount cost.

## Decisions made independently

- **lighthouse-perf → skip:** Storybook page LCP 5281 ms is dominated by dev iframe shell (TTFB 1.99 s + render delay 3.29 s), not OrderCopyLinkButton. Component interaction perf captured via `user-flow-timing` (pass). Marking page-load LCP fail would false-negative the feature.
- **Timer stacking no longer filed:** Pass-2 `clear()` at `useClipboard.ts:16` plus test at `useClipboard.test.ts:105-141` fixes the pass-1 concern; verified in diff and sub-agent reports.
- **Late-resolving writeText after unmount → not filed:** Theoretically possible but requires slow clipboard resolving after order navigation; no user-observable perf regression on the hot path; borderline correctness, dropped after reviewing React 17 behavior and low trigger probability.
- **force\* Storybook props → not filed:** Boolean checks at runtime cost ~zero; CSS module rules are small; unique to this component but not measurable bundle regression beyond orders chunk delta already counted.

## Files / sections inspected

- `docs/DEV-90/logs/027-step-7-coordinator-pass-2.md` — touchedFiles list (10 src paths); did not read pass-001 findings.
- `docs/DEV-90/prd.md:27-38` — acceptance criteria for runtime trace.
- `git diff 45b5cef8..HEAD --stat -- src/` — 470 insertions across 10 files.
- `src/hooks/useClipboard.ts:6-30` — clear-before-reschedule fix.
- `src/hooks/useClipboard.test.ts:105-141,83-103` — rapid copy and unmount tests.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-67` — full component.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — click-time URL builder.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-218` — integration + key remount.
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201` — parent host.
- `src/orders/views/OrderDetails/OrderUnconfirmedDetails/index.tsx:201` — parent host.
- `src/components/AppLayout/TopNav/Root.tsx:68-75` — TopNav flex children container.
- `src/components/Form/Form.tsx:61-64` — render-prop re-render mechanism.
- `src/orders/urls.ts:234-235` — sibling URL helper with encodeURIComponent.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:8-15` — shared icon component.
- `git grep OrderCopyLinkButton` / `git grep getShareableOrderUrl` — call site enumeration.
- Bundle builds at `/tmp/build-head-ccc35852` and `/tmp/build-anchor-45b5cef` (sub-agent) — chunk deltas.
- Storybook chrome session at `http://localhost:6006/?path=/story/orders-ordercopylinkbutton--in-order-details-top-nav` — INP/heap evidence.

## Considered then dropped

- **SHOULD-FIX for unstable `copy` defeating `useCallback`:** Sub-agents flagged `useClipboard.ts:12` returning fresh `copy` each render, making `OrderCopyLinkButton.tsx:32-34` ineffective. Downgraded to not filed — no observable user effect; all sibling clipboard callers use inline handlers without `useCallback`; one extra function allocation per render is below WARNING threshold for this review.
- **SHOULD-FIX for in-flight writeText after unmount:** Adversarial sub-agent noted `setCopyStatus(true)` can run after unmount if clipboard resolves late. Considered SHOULD-FIX then dropped — trigger requires navigating away mid-async clipboard on a slow browser; impact is wasted reconciliation not user-visible wrong state on the new order (fresh hook instance from `key` remount).
- **lighthouse-perf fail verdict:** Sub-agent returned fail on LCP; reversed to skip after confirming LCP measures Storybook shell load, not copy-button path.

## Dead ends and retries

- `pass-002/` findings directory did not exist at review start — created with `mkdir -p` before writing output.
- Chrome sub-agent had to start Storybook (`pnpm install` + `pnpm run storybook`) because ports 9000/6006 were idle; succeeded on retry path documented in sub-agent payload.

## Ambiguities encountered

- **Production app vs Storybook for perf proxy:** `localhost:9000` unreachable; used same Storybook `InOrderDetailsTopNav` composition as pass-1 mechanical protocol. Interaction metrics are representative; page-load LCP is not.

## Concerns / warnings

- Vendor chunk +2,182 B raw between anchor and HEAD builds appears environmental (same deps, worktree path in source maps); not attributed to feature in findings.
- Form render-prop re-render coupling persists and matches metadata button sibling — filed as F-001 WARNING only.

## Did not do (out of scope or deferred)

- Read pass-001 performance findings or sibling pass-2 reviewer outputs (pure-reviewer discipline).
- SQL / backend latency checks (frontend-only area).
- Production authenticated order-details Lighthouse run (no running backend + dev server).
