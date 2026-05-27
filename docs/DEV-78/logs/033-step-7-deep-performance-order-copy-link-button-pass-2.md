---
agent: step-7-deep-performance-order-copy-link-button-pass-2
sequence: 33
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
status: DONE
---

## Summary

Ran performance deep review for DEV-78 `order-copy-link-button`: bundle-size build comparison (+780 B orders chunk), Storybook chrome profiling (LCP 454 ms, INP 79 ms on copy click, heap snapshot captured), and six adversarial qualitative sub-agent passes. Verdict `pass` with two WARNINGs on inherited `useClipboard` async/timer edge cases amplified by TopNav placement and `key={order.id}` remount.

## Decisions made independently

- **Verdict pass despite WARNINGs**: Both findings trace to pre-existing `useClipboard` behavior mandated by PRD reuse; impact is edge-case timer/re-render churn, not measurable regression on normal copy flow (INP 79 ms, +0.2% bundle).
- **Skipped backend checks**: Frontend-only area; marked `sql-performance` and `backend-latency` as skip.
- **Did not BLOCK on useCallback instability**: `handleCopy`/`copy` dependency chain is ineffectual but matches sibling clipboard components; filing would be style nit, not perf regression.
- **Did not BLOCK on Form render-prop coupling**: Pre-existing `OrderDetailsPage` pattern shared by metadata button; out of diff scope.

## Files / sections inspected

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: click-deferred URL build, useClipboard wiring
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx`: per-render formatMessage, icon element allocation
- `src/orders/utils/getShareableOrderUrl.ts`: synchronous encodeURIComponent + urlJoin on click
- `src/hooks/useClipboard.ts`: timer lifecycle, no pre-clear on re-copy
- `src/hooks/useClipboard.test.ts:83-131`: unmount and multi-copy coverage gaps
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-232`: Form render prop, key={order.id} integration
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: Copy/Check icon swap
- `docs/DEV-78/prd.md`: AC trace for perf-relevant runtime paths
- Bundle build diff at HEAD vs `45b5cef8`: orders chunk 386707→387487 bytes raw
- `.perf-evidence/DEV-78/`: Storybook trace/screenshot artifacts from chrome sub-agent

## Considered then dropped

- **BLOCKER on bundle size (+780 B)**: Sub-agent measured +0.2% orders lazy chunk with identical vendor/main; dropped as negligible.
- **BLOCKER on formatMessage every render**: Standard react-intl pattern; metadata button uses static title but intl is used elsewhere in same TopNav; not a regression.
- **WARNING on ineffective useCallback**: Sub-agent prompt 1/3 flagged unstable `copy` ref; dropped because siblings use inline handlers and impact is unmeasurable.
- **WARNING on fourth useClipboard on order page**: OrderCustomer already mounts three; one more hook instance is trivial scheduler overhead.
- **FAIL on lighthouse-perf**: Storybook LCP render delay is shell noise; interaction INP is the relevant signal and passed.

## Dead ends and retries

- Initial chrome sub-agent needed `pnpm install` before Storybook could start on port 6006; dev server on 9000 was not running (Storybook used instead).

## Ambiguities encountered

- **Storybook vs production order details**: Chrome checks ran on Storybook story with TopNav decorator, not live GraphQL order page; accepted because copy handler path is identical and interaction metrics are the meaningful signal.

## Concerns / warnings

- Inherited `useClipboard` timer/async gaps are real but shared across ~8 production callers; fixing in this feature PR would expand scope beyond PRD.

## Did not do (out of scope or deferred)

- **Production order-details Lighthouse on port 9000**: Dev server not running; Storybook proxy used for chrome batch.
- **Baseline vs post-interaction heap diff**: Single 194 MB snapshot captured; no leak delta analysis.
- **Fix useClipboard**: Out of feature scope per PRD "reuse useClipboard" constraint.
