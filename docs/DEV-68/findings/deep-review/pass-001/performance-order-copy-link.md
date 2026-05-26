---
agent: step-7-deep-performance-order-copy-link-pass-1
input_branch: 7a33d7c2ad35af4836b70ce71dfe223da9e6b021
verdict: pass
---

## Summary

Performance review of the DEV-68 `order-copy-link` area found no measurable bundle regression (~845 B total minified JS delta, orders lazy chunk +558 B), no new network or backend work, and strong interaction timing on the Storybook `InTopNav` flow (INP 39 ms). URL construction and clipboard writes run only on click; the component adds a single lightweight TopNav child on an already-loaded route. All applicable mechanical checks pass; backend SQL/latency checks are skipped (frontend-only surface).

## Mechanical checks

| Check              | Status | Evidence                                                                            |
| ------------------ | ------ | ----------------------------------------------------------------------------------- |
| `lighthouse-perf`  | pass   | Storybook `InTopNav` iframe trace: LCP 399 ms, CLS 0.01 (good thresholds)           |
| `bundle-size`      | pass   | Vendor chunk unchanged; orders/details lazy chunk +558 B; total JS +845 B (~0.005%) |
| `user-flow-timing` | pass   | Copy-button click trace: INP 39 ms, CLS 0.00; no fetch/XHR on click                 |
| `memory-snapshot`  | skip   | No heap-growth or leak signals; isolated button + 2s clipboard timeout              |
| `sql-performance`  | skip   | No new/changed GraphQL queries or ORM paths                                         |
| `backend-latency`  | skip   | Client-only clipboard; no API handlers                                              |
| `render-hot-path`  | pass   | `getAbsoluteOrderUrl` invoked in `handleCopy` only, not render                      |

## Justification

The diff adds ~45 LOC of UI (`OrderCopyLinkButton`), a ~10-line synchronous URL helper (`getAbsoluteOrderUrl`), and one TopNav child in `OrderDetailsPage`. Imports reuse existing dashboard dependencies (`useClipboard`, macaw `Button`, `ClipboardCopyIcon`, `orders/urls` utilities) with no new `node_modules` entries. Production bundle comparison (anchor `45b5cef8` → HEAD) shows vendor size unchanged and sub-kilobyte growth in the orders details lazy chunk and locale messages—below any meaningful perf threshold.

Runtime behavior keeps the hot path cheap: each render only runs `intl.formatMessage` and icon selection; expensive work (`urlJoin`, `encodeURIComponent`, `navigator.clipboard.writeText`) runs on user click. `useClipboard` matches established copy-button patterns elsewhere in orders and clears its timeout on unmount. Integration is limited to `OrderNormalDetails` and `OrderUnconfirmedDetails` via `OrderDetailsPage` (draft orders use a separate view per PRD). No N+1 queries, polling, listeners beyond the shared clipboard hook, or layout thrash were identified at parent or call-site level.

Chrome traces on the deployed Storybook `InTopNav` story confirm good Core Web Vitals for load and interaction; clipboard API failure in headless Chrome is an environment limitation, not a latency regression. This angle has no BLOCKER or WARNING findings.
