---
agent: step-7-deep-performance-order-copy-link-button-pass-3
sequence: 44
input_branch: 6feae83ec628e0296d8e2a3652c5db5ed4b58877
status: DONE
---

## Summary

Ran pass-3 performance deep review on the cumulative `order-copy-link-button` area (~509 LOC src delta since `45b5cef8`). Expanded scope to parent views, TopNav host, `useClipboard`/`orderUrl` integration, and all export call sites. Spawned bundle-size shell sub-agent, batched chrome sub-agent (Storybook interaction traces + heap), and six qualitative forced-prompt explore sub-agents. Verdict **pass**: bundle localized (+1.3 KB orders chunk), INP 69 ms, no heap leak; three WARNINGs for Form re-render coupling, aria-live DOM lifecycle, and `key` remount tradeoff. Pass-3 production surface unchanged (iter-5 test-only delta).

## Decisions made independently

- **lighthouse-perf → skip:** Storybook LCP 344 ms is 99.6% render delay on manager shell, not OrderCopyLinkButton or production order-details. Interaction perf captured via user-flow-timing (pass).
- **user-flow-timing → pass (not fail on iframe clipboard):** `navigator.clipboard` undefined in Storybook iframe is environmental (same class as pass-1/2). INP 69 ms and ~4 ms mocked feedback confirm render path is fast; native E2E blocked but not a component perf defect.
- **Timer stacking not filed:** `clear()` at `useClipboard.ts:16` plus test at `useClipboard.test.ts:105-141` fixes pass-1 concern; verified in diff.
- **Late setState after unmount → not filed:** Theoretically possible on slow clipboard + fast order navigation; trigger requires sub-human navigation timing during async clipboard; no user-observable perf regression; dropped after reviewing `key` remount intent.
- **useCallback ineffectiveness → not filed:** `copy` unstable from hook defeats `handleCopy` memo; matches sibling clipboard callers; one extra function allocation per render below WARNING threshold.
- **SHOULD-FIX tier unused:** No source-local perf gap requiring task creation before merge; all observations are architectural/informational WARNINGs.

## Files / sections inspected

- `docs/DEV-90/logs/040-step-7-coordinator-pass-3.md` — touchedFiles list (10 src paths); did not read sibling pass-003 findings.
- `docs/DEV-90/prd.md:27-38` — acceptance criteria for runtime trace.
- `docs/DEV-90/tech-plan.md:17-40` — click-scoped URL, no backend.
- `git diff 45b5cef8..HEAD -- src/` — full cumulative diff.
- `src/hooks/useClipboard.ts:6-30` — clear-before-reschedule fix.
- `src/hooks/useClipboard.test.ts:105-141` — rapid copy timer test.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-67` — component.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — URL builder.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:70-125` — pass-3 iter-5 test additions.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-218` — integration.
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201-203` — parent host.
- `src/orders/views/OrderDetails/OrderUnconfirmedDetails/index.tsx:201` — parent host.
- `src/components/Form/Form.tsx:61-64` — render-prop mechanism.
- `src/components/AppLayout/TopNav/Root.tsx:68-82` — flex children.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:8-15` — icon swap.
- `src/orders/urls.ts:234-235` — sibling URL helper.
- `git grep OrderCopyLinkButton` / `git grep getShareableOrderUrl` — call site enumeration.
- Bundle builds HEAD vs anchor at `/tmp/build-anchor` (sub-agent).
- Storybook chrome at `http://local-deploy:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d` — INP/heap evidence in `.perf-dev90/`.

## Considered then dropped

- **SHOULD-FIX for Form render-prop coupling:** Re-read `OrderDetailsPage.tsx:212-219` — metadata button shares identical coupling; filing SHOULD-FIX would imply refactor scope beyond this feature → F-001 WARNING only.
- **BLOCKER on bundle regression:** Sub-agent showed +1.3 KB in existing lazy chunk only; entry/vendor flat → not filed.
- **WARNING on duplicate formatMessage:** Considered separate finding; merged into F-002 aria-live lifecycle observation.
- **FAIL on user-flow-timing for iframe clipboard:** Reclassified to pass per environmental skip protocol used in pass-1/2 desktop-ux reviews.
- **SHOULD-FIX for `useMemo` on shareable URL:** Click-time construction is intentional per tech-plan; memo would only help rapid re-clicks on stable mount — negligible vs clipboard API latency.

## Dead ends and retries

- `pass-003/` findings directory did not exist — created with `mkdir -p` before writing output.
- Chrome sub-agent used published local-deploy Storybook (reachable) rather than starting local `pnpm run storybook`.

## Ambiguities encountered

- **Pass-3 vs pass-2 production delta:** Coordinator confirms iter-5 is test-only; performance review still evaluates cumulative feature diff since anchor (same 10 src files) rather than fast-path skipping — bundle and interaction checks remain meaningful for merge gate.

## Concerns / warnings

- Vendor chunk hash changed between anchor and HEAD builds but raw bytes identical — environmental hash churn, not attributed to feature.
- Storybook iframe blocks native clipboard — interaction traces required mocked `writeText` for feedback timing; INP still measured on real click event.

## Did not do (out of scope or deferred)

- Read pass-001/pass-002 performance findings or sibling pass-003 reviewer outputs (pure-reviewer discipline).
- SQL / backend latency checks (frontend-only area).
- Production authenticated order-details Lighthouse run (no running backend on localhost:9000).
