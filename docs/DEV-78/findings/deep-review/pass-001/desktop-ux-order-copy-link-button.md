---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-1
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
verdict: pass
---

## Summary

Desktop interaction review of the order copy-link button confirms PRD-aligned placement, keyboard operability, and click→copied→revert state transitions in Storybook TopNav context. Production walkthrough was skipped (dev server unreachable). Two non-blocking warnings remain: inherited `useClipboard` timer stacking on rapid clicks can shorten the copied feedback window, and automated tests do not verify AC4 runtime label/icon feedback end-to-end.

## Findings

### F-001 [WARNING] Rapid re-clicks can shorten the “Order link copied” feedback window

- Location: `src/hooks/useClipboard.ts` (consumed by `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`)
- Description: Each successful copy schedules a new 2s revert timeout without clearing a prior pending timeout. When an earlier timeout fires after a second click, its callback calls `clear()` on `timeout.current` (now pointing at the newer timer) and sets `copied` false — so the visible “Order link copied” state can revert well before 2 seconds after the latest click. This matters more for the new always-visible TopNav control than for hover-reveal copy buttons elsewhere.
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
  The hook’s “multiple copy calls” test only asserts immediate `copied === true` after two clicks; it never advances timers to expose the race (`src/hooks/useClipboard.test.ts:105-130`).
- Suggested fix: Call `clear()` before scheduling each new timeout in `useClipboard.copy`, or reset the timer idempotently so only the latest successful copy controls the revert window.

### F-002 [WARNING] No automated test verifies AC4 runtime feedback (icon swap + label revert)

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`
- Description: PRD AC4 requires that after a successful copy the icon switches to check, `aria-label`/`title` show “Order link copied” for ~2 seconds, then revert. Unit tests mock `useClipboard` and only assert the handler wiring; they never render the copied UI state or advance timers to verify label/icon revert. Storybook `Copied` story asserts a static copied label but not click→async clipboard→revert flow.
- Evidence:
```26:44:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx
  it("calls useClipboard copy with getShareableOrderUrl(orderId) when clicked", async () => {
    // ...
    mockUseClipboard.mockReturnValue([false, mockCopy]);
    // ...
    expect(mockCopy).toHaveBeenCalledWith(shareableUrl);
  });
```
  No test sets `mockUseClipboard.mockReturnValue([true, mockCopy])` or integrates real `useClipboard` with fake timers to assert `aria-label` / icon revert. Manual Storybook verification (this review) confirmed click → “Order link copied” → revert at ~2.5s, but that path is not locked by CI.
- Suggested fix: Add a component test (or Storybook play function on `Default`) that clicks the button with mocked `navigator.clipboard.writeText`, asserts `aria-label` becomes “Order link copied”, advances timers 2000ms, and asserts revert — mirroring `useClipboard.test.ts:59-80` at the view layer.
