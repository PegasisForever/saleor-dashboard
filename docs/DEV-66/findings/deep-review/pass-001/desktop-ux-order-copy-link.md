---
agent: step-7-deep-desktop-ux-order-copy-link-pass-1
input_branch: 8428347a1c77b9fc3d4b8c33a5da12a724556a8d
verdict: fail
---

## Summary

Desktop-UX review of the order-copy-link feature confirms solid component wiring, keyboard focus-visible styling, and PRD-aligned TopNav integration in code. Storybook interaction testing verified Tab focus ring (2px accent1 outline) and Enter activation; unit tests cover icon swap and URL copy contract. **Production OrderDetailsPage walkthrough could not be completed** — Saleor GraphQL backend at `localhost:8000` was unreachable and the dashboard login shell did not fully hydrate — so live clipboard write, ~2s icon revert, and TopNav placement in a real order view remain unverified in production context. One WARNING: rapid re-clicks expose a pre-existing `useClipboard` timeout race that can truncate the second copy's success feedback below the ~2s AC window.

## Findings

### F-001 [WARNING] Rapid re-copy truncates success icon feedback via useClipboard timeout race

- Location: `src/hooks/useClipboard.ts:12-21` (consumed by `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-28`)
- Description: Each successful `copy()` schedules a 2000 ms reset timer without clearing a prior timer first. When a user clicks copy again within ~2 s, the orphaned first timer can fire, call `clear()` on the active second timer, and set `copied` to `false` early — shortening the check-icon feedback for the most recent copy below the PRD's "approximately two seconds."
- Evidence: `useClipboard` assigns `timeout.current = window.setTimeout(...)` on every success without calling `clear()` first (`useClipboard.ts:18-21`). The multi-copy unit test asserts `copied === true` but never advances timers to catch the race (`useClipboard.test.ts:105-131`). Manual trace: first copy at T=0 schedules timer A@2000ms; second copy at T=500ms schedules timer B@2500ms and overwrites `timeout.current`; at T=2000ms timer A fires, `clear()` cancels B, and `setCopyStatus(false)` runs ~1.5s after the second click.
- Suggested fix: Call `clear()` before scheduling a new timeout inside the `writeText` success handler (same pattern as unmount cleanup at `useClipboard.ts:6-10`), and extend `useClipboard.test.ts` to advance timers after a second copy to lock the ~2s window per invocation.

## Justification (only if zero findings)

N/A — one WARNING finding recorded.
