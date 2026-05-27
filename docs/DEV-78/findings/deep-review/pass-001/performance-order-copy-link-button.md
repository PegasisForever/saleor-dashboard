---
agent: step-7-deep-performance-order-copy-link-button-pass-1
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
verdict: pass
---

## Summary

Performance review of the order-copy-link-button area finds no measurable regression and no performance defects introduced by the diff. Production bundle growth is ~705 B in the existing orders lazy chunk (+0.019% total JS); Lighthouse, interaction trace (INP 89 ms), and heap snapshots under rapid copy clicks all pass. URL construction is deferred to click time, clipboard state is isolated in the child component, and the implementation matches existing clipboard-button conventions. Backend SQL/latency checks are not applicable (client-only feature).

## Justification (only if zero findings)

This area is a small client-only UI control (~60 LOC production code) that reuses existing hooks and components without new npm dependencies. Mechanical verification confirms negligible bundle impact and healthy runtime metrics.

**Sibling pattern comparison (prompt 1):** Grepped all eight `useClipboard` call sites, TopNav button patterns in `OrderDetailsPage`, `WarehouseDetailsPage`, and `ProductUpdatePage`, and URL helpers in `orders/urls.ts`. The new code builds URLs on click (not render), does not cache mount URI (same as `auth/utils.ts`, `StaffList.tsx`), and uses `useCallback` where peers use inline lambdas — the only deviation, and it does not reduce work because `useClipboard`'s `copy` is unstable (`src/hooks/useClipboard.ts:12-31`, unchanged in this diff).

**PRD runtime trace (prompt 2):** Traced click → `handleCopy` → `getShareableOrderUrl` → `navigator.clipboard.writeText` → `copied` state → view re-render. URL assembly runs only on click (`OrderCopyLinkButton.tsx:20`). `copied` flips re-render only `OrderCopyLinkButton` / `OrderCopyLinkButtonView`, not `OrderDetailsPage` or `TopNav.Root`. `intl.formatMessage` runs per render but matches all other clipboard UIs (`PspReference`, `CopyableText`).

**Missing optimizations (prompt 3):** Considered memoizing shareable URL, `React.memo` on view, lazy loading, debouncing, mount-URI cache, precomputing URL on `orderId` change, and `useMemo` for labels. None are used elsewhere for this component class; each omission avoids wasted mount-time work for a user-initiated action. Route-level code splitting already loads the orders chunk; no separate lazy boundary warranted.

**Adversarial inputs (prompt 4):** Empty `orderId` is guarded (`disabled` + early return). Very long IDs only affect per-click string allocation (bounded, user-initiated). Rapid clicks can stack `writeText` calls and expose pre-existing timer overlap in `useClipboard` (`useClipboard.ts:18-21`, hook not modified in this diff) — not a new perf surface introduced by the feature. Parent Form render-prop re-renders affect the button on page churn but identically affect the adjacent metadata button; copy feedback state does not propagate upward.

**Failure modes (prompt 5):** Icon swap (Copy↔Check) is a fixed 16px Lucide icon change with negligible layout cost. `url-join` is already imported via `orders/urls.ts` on this page; no new heavy dependency. Orphaned timer / post-unmount setState risks exist in shared `useClipboard` and are inherited, not introduced.

**Integration site (prompt 6):** `OrderCopyLinkButton` sits inside `Form`'s render prop alongside the metadata button (`OrderDetailsPage.tsx:206-219`). Form state churn from metadata editing uses a separate dialog form, so copy-button re-renders track `order` prop changes, not keystrokes. Clipboard state isolation matches `OrderCustomer`'s three in-page clipboard hooks.

**Mechanical checks:** Bundle diff +705 B orders chunk / +3 KB total; Lighthouse LCP 457 ms on Storybook TopNav story (backend unavailable for live order page); INP 89 ms on copy interaction; heap stable after 10 rapid clicks (−901 KB delta, no timer accumulation).
