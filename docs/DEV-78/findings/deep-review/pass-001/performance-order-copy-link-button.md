---
agent: step-7-deep-performance-order-copy-link-button-pass-1
input_branch: 04aaf8e902a7277b5e64bee43842a5c4f41bed35
verdict: pass
---

## Summary

Performance review of the `order-copy-link-button` area found no regressions. Production bundle growth is negligible (~1 KB raw / ~402 B gzip on the orders details chunk), URL construction runs only on click, clipboard work is async with a single 2s local state toggle, and Chrome DevTools traces on the published Storybook story show good LCP (396 ms) and INP (46 ms) for the copy interaction. Backend/SQL checks are not applicable (client-only feature).

## Findings

## Justification

The diff adds a small presentational control that reuses existing dependencies already on the order-details route (`useClipboard`, `ClipboardCopyIcon`, macaw `Button`, `orders/urls`). `getOrderShareableUrl` is invoked inside the click handler only—not on render—and performs three string joins plus `getAppMountUriForRedirect()` (two in-memory URI reads). No new npm packages, GraphQL queries, or request handlers were introduced. Worktree production builds from `45b5cef8` to `04aaf8e9` show vendor chunk unchanged and ~780 B growth in the index chunk that hosts order details (+213 B in `defaultMessages` for two react-intl strings). Storybook interaction tracing confirms sub-50 ms input responsiveness for the copy click with no layout shift. These characteristics match established clipboard patterns elsewhere in orders (e.g. `TrackingNumberDisplay`, `OrderCustomer`) and do not warrant performance blockers or warnings.
