---
agent: step-7-deep-performance-order-copy-link-pass-1
input_branch: 8428347a1c77b9fc3d4b8c33a5da12a724556a8d
verdict: pass
---

## Summary

Performance review of the order-copy-link feature finds no regressions. The change adds a small leaf UI component (~50 LOC production) that reuses existing `useClipboard`, `ClipboardCopyIcon`, and `url-join` (already in the orders bundle). Production build delta is ~852 B raw JS / ~292 B gzip on the orders chunk plus locale strings. Chrome DevTools traces on the Storybook Default story show good LCP (307 ms), INP (57 ms on copy click), and ~8.7 ms click-to-frame latency. No backend or GraphQL surface exists in this area.

## Findings

## Justification

The diff is a client-only TopNav affordance with no new npm dependencies, no new network requests, and no hot-path synchronous work beyond a trivial string join on button click (`getOrderAbsoluteUrl` reads `window.location.origin` and config already in memory). `OrderCopyLinkButton` follows the same clipboard pattern as `TrackingNumberDisplay` and `OrderCustomer`; clipboard state is local to the button so successful copy does not re-render the parent page. Integration in `OrderDetailsPage` sits alongside the existing metadata button inside the Form render prop — the same re-render boundary that predates this feature. Bundle-size comparison (base `45b5cef8` vs HEAD) shows +687 B on the orders lazy chunk and +165 B on locale messages, with vendor chunk unchanged. Backend mechanical checks (`sql-performance`, `backend-latency`) are skipped because the PRD and tech plan explicitly exclude backend/GraphQL changes.
