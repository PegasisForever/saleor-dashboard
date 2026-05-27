---
agent: step-7-deep-performance-order-details-copy-link-pass-1
input_branch: e4ebc9531190c0993a632681a64d25ca24dc19db
verdict: pass
---

## Summary

Performance review of the order-details copy-link feature (~200 LOC across 7 source files) found no material regressions. Production bundle growth is ~1.7 KiB minified (orders chunk +1.11 kB gzip +0.37 kB), with zero vendor delta and no new npm dependencies. The copy interaction is synchronous-light (~4 ms handler), network-free, and completes UI feedback in sub-millisecond polling. Lighthouse CWV thresholds pass on the Storybook story (LCP 1837 ms, CLS 0.05 load / 0.07 on copy). Backend performance checks are not applicable — client-only clipboard UI with no GraphQL or API changes.

## Mechanical checks

| Check            | Status | Evidence                                                                                                                    |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| lighthouse-perf  | pass   | Storybook Default story: LCP 1837 ms (≤2500), CLS 0.05 load; LCP dominated by Storybook shell, not button logic             |
| bundle-size      | pass   | Baseline vs HEAD build: +1,757 B minified JS+CSS; orders chunk +1.11 kB; vendor unchanged; no new deps                      |
| user-flow-timing | pass   | Click handler ~4.2 ms sync; title/aria-label update ~0.7 ms; 0 network requests on copy                                     |
| memory-snapshot  | pass   | No clipboard-failure warnings; useClipboard clears timeout on unmount; heap delta reflects Storybook host, not feature leak |
| sql-performance  | skip   | No backend or database changes in diff                                                                                      |
| backend-latency  | skip   | No new or modified request handlers; client-only `navigator.clipboard.writeText`                                            |

## Justification

The diff adds a single icon button wired into an existing TopNav slot, reusing established dependencies (`useClipboard`, `ClipboardCopyIcon`, `url-join`, `getAppMountUriForRedirect`, macaw `Button`) with no new packages or lazy-load boundary changes. URL construction runs only on click (`getOrderAbsoluteUrl`), not on render. The component follows the same Form render-prop placement as the adjacent metadata button — adding `useClipboard`/`useIntl` hook overhead on form re-renders, but this is negligible for one stateless-until-click control and matches existing clipboard-button patterns elsewhere in orders (e.g. `OrderCustomer`, `TrackingNumberDisplay`). Measured bundle and runtime evidence show sub-2 KiB shipped growth and instant copy feedback with no network side effects — no performance defects warrant BLOCKER or WARNING classification.
