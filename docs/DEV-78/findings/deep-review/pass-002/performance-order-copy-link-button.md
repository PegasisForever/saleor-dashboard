---
agent: step-7-deep-performance-order-copy-link-button-pass-2
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
verdict: pass
---

## Summary

Production impact of the copy-order-link button is negligible: the orders lazy chunk grows by ~780 bytes (+0.2%), no new npm dependencies are added, and Storybook-driven interaction profiling shows INP 79 ms with 2 ms JS processing on copy click. The feature correctly defers URL construction to click time and matches existing TopNav patterns. Two WARNINGs remain around inherited `useClipboard` timer/async behavior that the always-visible TopNav control and `key={order.id}` remount make slightly more reachable, but neither warrants blocking merge from a performance perspective.

## Findings

### F-001 [WARNING] Rapid re-copy inherits stacked timers from shared useClipboard hook

- Location: `src/hooks/useClipboard.ts:12-21` (consumed by `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-20`)
- Description: Each successful clipboard write schedules a new 2 s timeout without clearing a prior one first. `timeout.current` is overwritten while earlier timer IDs keep running, which can produce orphaned timers and unexpected late `setCopyStatus(false)` re-renders. The new button is always visible in TopNav (unlike hover-only copy controls such as `TrackingNumberDisplay`), making rapid click-spam a more plausible interaction pattern on this surface.
- Evidence:

```12:21:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyStatus(true);

        timeout.current = window.setTimeout(() => {
          clear();
          setCopyStatus(false);
        }, 2000);
```

`useClipboard.test.ts:105-131` asserts double-copy behavior but never advances timers between copies to detect stacking. Chrome user-flow trace showed healthy INP (79 ms) for a single click; repeated-click timer churn was not profiled in Storybook.

- Suggested fix: Clear any existing timeout at the start of `copy()` in `useClipboard` (shared fix benefiting all consumers). Optionally debounce or ignore in-flight copies on the TopNav button if product accepts that UX trade-off.

### F-002 [WARNING] Order navigation during in-flight clipboard can orphan timers

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` + `src/hooks/useClipboard.ts:15-21,28-29`
- Description: `key={order.id}` intentionally remounts the button when switching orders, running unmount cleanup that clears the tracked timeout. If the user copies then navigates before `writeText` resolves, the late `.then()` callback can still call `setCopyStatus(true)` and schedule a new timeout after cleanup already ran—an orphaned timer whose callback invokes `setCopyStatus` on an unmounted hook instance.
- Evidence:

```211:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
              <OrderCopyLinkButton key={order.id} orderId={order.id} />
```

```15:21:src/hooks/useClipboard.ts
      .then(() => {
        setCopyStatus(true);

        timeout.current = window.setTimeout(() => {
          clear();
          setCopyStatus(false);
        }, 2000);
```

`useClipboard.test.ts:83-103` covers unmount after promise resolution, not unmount while `writeText` is pending. This is pre-existing hook behavior; the `key` prop makes the navigation-during-copy path reachable on order switch.

- Suggested fix: Add an `isMounted` ref or abort flag in `useClipboard` so `.then()` skips state updates after unmount; alternatively reset copied state via prop instead of remounting (would require hook change either way).
