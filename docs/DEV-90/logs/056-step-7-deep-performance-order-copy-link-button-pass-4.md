---
agent: step-7-deep-performance-order-copy-link-button-pass-4
sequence: 56
input_branch: 09886983335621e9c0048186f6f51d0f16611441
status: DONE
---

## Summary

Ran pass-4 performance deep review on the cumulative `order-copy-link-button` area (~614 LOC src delta since `45b5cef8`; pass-4 production surface unchanged — iter-7 adds real-hook click→copied transition test only). Expanded scope to parent views, TopNav host, `useClipboard`/`orderUrl` integration, and all export call sites. Spawned bundle-size shell sub-agent, batched chrome sub-agent (Storybook interaction traces + heap), and six qualitative forced-prompt explore sub-agents. Verdict **pass**: bundle localized (+1.24 KiB orders chunk), INP 52 ms, no heap leak; three WARNINGs for Form re-render coupling, aria-live DOM lifecycle, and `key` remount tradeoff.

## Decisions made independently

- **lighthouse-perf → skip:** MCP Lighthouse excludes Performance category; Storybook LCP 286 ms is 99%+ render delay on manager shell, not production order-details.
- **user-flow-timing → pass:** INP 52 ms with mocked clipboard in Storybook iframe; native clipboard undefined in iframe is environmental, not a component perf defect.
- **Pass-4 delta is test-only:** Considered fast-path skip but cumulative feature still has measurable bundle (+1.2 KiB) and interaction surface — ran full mechanical checks per merge gate.
- **Post-unmount setState on slow clipboard → not filed:** Theoretically possible if `writeText` resolves after `key` remount; requires sub-human navigation during async clipboard; no user-observable perf regression; dropped after reviewing unmount timer test at `useClipboard.test.ts:83-103`.
- **useCallback ineffectiveness → not filed:** Unstable `copy` from hook defeats memo; matches all sibling clipboard callers; below WARNING threshold.
- **SHOULD-FIX tier unused:** No source-local perf gap requiring task creation; observations are architectural/informational WARNINGs.

## Files / sections inspected

- `docs/DEV-90/logs/052-step-7-coordinator-pass-4.md` — touchedFiles scope (10 src paths); did not read sibling pass-004 findings.
- `docs/DEV-90/prd.md:27-38` — acceptance criteria for runtime trace.
- `docs/DEV-90/tech-plan.md:17-40` — click-scoped URL, no backend.
- `git diff 45b5cef8..HEAD -- src/` — full cumulative diff.
- `src/hooks/useClipboard.ts:6-30` — clear-before-reschedule fix.
- `src/hooks/useClipboard.test.ts:105-141` — rapid copy timer test.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-67` — component.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:137-231` — pass-4 iter-7 real-hook transition test delta.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-218` — integration.
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201-222` — parent host.
- `src/components/Form/Form.tsx:61-64` — render-prop mechanism.
- `src/components/AppLayout/TopNav/Root.tsx:68-83` — flex children.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:8-15` — icon swap.
- `src/orders/urls.ts:234-235` — sibling URL helper.
- `git grep OrderCopyLinkButton` / `git grep getShareableOrderUrl` — call site enumeration.
- Bundle builds HEAD vs anchor at `/tmp/saleor-anchor` (sub-agent).
- Storybook chrome at `http://local-deploy:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d` — INP/heap evidence in `.perf-dev90/`.

## Considered then dropped

- **SHOULD-FIX for Form render-prop coupling:** Re-read `OrderDetailsPage.tsx:212-219` — metadata button shares identical coupling; filing SHOULD-FIX would imply refactor scope beyond this feature → F-001 WARNING only.
- **BLOCKER on bundle regression:** Sub-agent showed +1.24 KiB in existing lazy chunk only; entry/vendor flat → not filed.
- **WARNING on duplicate formatMessage:** Merged into F-002 aria-live lifecycle observation.
- **FAIL on user-flow-timing for iframe clipboard:** Reclassified to pass per environmental skip protocol.
- **SHOULD-FIX for post-unmount promise setState:** Trigger requires navigating away during pending clipboard with slow resolve; not human-reachable in normal use → dropped.
- **Fast-path skip for pass-4 test-only delta:** Rejected — cumulative feature bundle/interaction checks remain meaningful for merge gate.

## Dead ends and retries

- `pass-004/` findings directory did not exist — created with `mkdir -p` before writing output.
- Chrome sub-agent used published local-deploy Storybook (reachable); production app on localhost:9000 refused connection.

## Ambiguities encountered

- **Pass-4 vs pass-3 production delta:** Coordinator confirms iter-8 NO_OP; only iter-7 test additions since pass-3. Performance review evaluates cumulative feature diff since anchor (same 10 src files) rather than skipping mechanical checks entirely.

## Concerns / warnings

- Vendor chunk hash changed between anchor and HEAD builds but gzip delta +0.65 KiB — likely bundler grouping noise, not attributed to feature.
- Storybook iframe blocks native clipboard — interaction traces required mocked `writeText` for feedback timing; INP still measured on real click event.

## Did not do (out of scope or deferred)

- Read pass-001/002/003 performance findings or sibling pass-004 reviewer outputs (pure-reviewer discipline).
- SQL / backend latency checks (frontend-only area).
- Production authenticated order-details Lighthouse run (no running backend on localhost:9000).
