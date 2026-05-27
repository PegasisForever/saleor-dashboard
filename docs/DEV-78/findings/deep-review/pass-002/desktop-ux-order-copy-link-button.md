---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-2
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
verdict: pass
---

## Summary

Pass-2 desktop-UX review of the order copy-link button confirms PRD interaction behavior in code and unit tests: TopNav placement, click→copied label/icon→2s revert, disabled empty-id guard, and `key={order.id}` remount on order change. Production and Storybook walkthroughs were blocked by environment (`ERR_CONNECTION_REFUSED` on `:9000`, missing `node_modules`/Storybook deploy); state transitions, PRD conformance, keyboard operability, and integration wiring were verified via source trace, sibling-pattern comparison, and existing Jest coverage. Three non-blocking WARNINGs remain around TopNav icon parity, inherited clipboard-hook timer races, and silent clipboard failure UX.

## Findings

### F-001 [WARNING] Copy-link icon size mismatches adjacent metadata button in TopNav

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:27`, `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:212-214`
- Description: The copy button renders `ClipboardCopyIcon` at the default 16px size while the adjacent metadata secondary button uses `iconSize.medium` (20px) and `iconStrokeWidth` (1.5). Pass-2 added optional `size`/`strokeWidth` props to `ClipboardCopyIcon` for parity but did not pass them from `OrderCopyLinkButtonView`, producing a visibly smaller icon beside its peer action in the production TopNav row.
- Evidence:
  ```tsx
  // OrderCopyLinkButtonView.tsx:27
  icon={<ClipboardCopyIcon hasBeenClicked={copied} />}

  // OrderDetailsPage.tsx:214 — adjacent sibling
  icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
  ```
  `ClipboardCopyIcon` defaults `size = 16` (`ClipboardCopyIcon.tsx:12-13`); `iconSize.medium` is 20 (`src/components/icons/index.ts:12-15`).
- Suggested fix: Pass `size={iconSize.medium}` and `strokeWidth={iconStrokeWidth}` to `ClipboardCopyIcon` in `OrderCopyLinkButtonView`, matching the metadata button.

### F-002 [WARNING] Rapid re-clicks can truncate “copied” feedback via shared `useClipboard` timer race

- Location: `src/hooks/useClipboard.ts:12-21`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-20`
- Description: The copy button stays enabled during the 2s copied window and does not debounce clicks. Each successful `writeText` schedules a new 2s timeout without clearing the previous one; an orphaned earlier timer can fire and reset `copied` early, reverting icon/label before the user expects. This affects desktop state-transition continuity for fast double-clicks or click-during-copied-window.
- Evidence:
  ```tsx
  // useClipboard.ts:15-21 — no clear() before assigning timeout.current
  .then(() => {
    setCopyStatus(true);
    timeout.current = window.setTimeout(() => {
      clear();
      setCopyStatus(false);
    }, 2000);
  });
  ```
  `OrderCopyLinkButtonView` never disables on `copied` (`OrderCopyLinkButtonView.tsx:29`). Hook test covers immediate double-copy keeping `copied === true` but does not advance overlapping timers (`useClipboard.test.ts:105-130`).
- Suggested fix: Clear existing timeout before scheduling a new one in `useClipboard` (tracked separately as DEV-82); optionally disable the button while `copied === true` if product wants to prevent re-entry during feedback.

### F-003 [WARNING] Clipboard permission/write failure gives no user-visible recovery affordance

- Location: `src/hooks/useClipboard.ts:23-25`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:20-32`
- Description: On clipboard API rejection, the hook logs `console.warn` only; the button remains in default Copy icon/label with no inline error state. PRD excludes toast notifications, but desktop users who deny clipboard permission get no observable feedback that the action failed—only repeated silent clicks.
- Evidence:
  ```tsx
  // useClipboard.ts:23-25
  .catch(() => {
    console.warn("Failed to use clipboard, ensure browser permission is enabled.");
  });
  ```
  View has no error branch—only `copied` vs default label (`OrderCopyLinkButtonView.tsx:20-22`). Contrast: `useClipboardCopy.ts:25-33` sets error state and shows a notifier.
- Suggested fix: Within PRD constraints (no toast), consider a transient error `aria-label`/`title` swap or brief error icon state; broader hook fix tracked as DEV-83.
