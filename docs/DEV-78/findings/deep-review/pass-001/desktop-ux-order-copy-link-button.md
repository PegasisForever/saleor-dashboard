---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-1
input_branch: 04aaf8e902a7277b5e64bee43842a5c4f41bed35
verdict: pass
---

## Summary

Desktop interaction review of the order copy-link button confirms correct visual state transitions (copy → check → reset ~2s), keyboard activation (Enter/Space), and PRD-aligned labeling in Storybook. Production dev server was unreachable (`ERR_CONNECTION_REFUSED` on port 9000); integration placement and conditional render were verified via source. One non-blocking accessibility gap: copy success is not announced via an `aria-live` region, so screen-reader users may miss the "Order link copied" feedback while focus remains on the button.

## Findings

### F-001 [WARNING] Copy success may not be announced to screen readers
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (L28–30, L46–47); `docs/DEV-78/ui-design.md` (L54–55)
- Description: After a successful copy, the button updates `aria-label` and `title` to "Order link copied" while retaining focus. There is no `aria-live` region or visually hidden status text. Dynamic `aria-label` changes on a focused button typically do not trigger a new announcement in NVDA/JAWS/VoiceOver—the user hears the pre-click label on activation and is not re-notified that copy succeeded. This diverges from ui-design.md's claim that screen readers announce "Copy order link → Order link copied."
- Evidence: Storybook a11y snapshot after click shows `button "Order link copied" focusable focused` with no `[aria-live]` node on the page. Grep of `src/orders/` finds no `aria-live` usage in clipboard flows. Component sets only `title={label}` and `aria-label={label}` (`OrderCopyLinkButton.tsx` L46–47).
- Suggested fix: Add a visually hidden `role="status"` element with `aria-live="polite"` that updates to the copied message on success (or use the app's existing notifier pattern). Keep the icon swap and dynamic label for sighted users.

## Justification (only if zero findings)

N/A — one WARNING filed above. All other desktop-ux checks passed: visual/icon state transitions work; keyboard operability confirmed; TopNav wiring matches PRD (`OrderDetailsPage.tsx` L211 before metadata L212–218); clipboard failure silence and missing toast match PRD out-of-scope and existing `useClipboard` patterns.
