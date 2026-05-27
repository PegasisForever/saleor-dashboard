---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-1
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
verdict: pass
---

## Summary

Mobile-UX deep review of the order-copy-link-button feature found no merge-blocking defects. Production app was unreachable (`localhost:9000` connection refused); mobile checks ran against the published Storybook TopNav decorator at 320×568, 375×812, and 390×844. Responsive layout holds with no horizontal scroll or action-button clipping at 320px. Touch interaction uses the native button click path (same as desktop). Three WARNINGs cover stale copied-state on in-app order navigation, Storybook title simplification vs production Title crowding, and silent clipboard failure on touch-only devices.

## Findings

### F-001 [WARNING] Copied-state persists when navigating to another order within the 2s reset window

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`; route `src/orders/index.tsx:161`
- Description: `useClipboard` keeps `copied=true` for ~2s after a successful write. When a staff user navigates from one order to another within that window (common on mobile via order list → detail), the TopNav copy button shows "Order link copied" with a check icon for the new order even though no copy action occurred on the new page.
- Evidence: `OrderCopyLinkButton` passes `orderId` as a prop but never resets clipboard state when `orderId` changes (`OrderCopyLinkButton.tsx:11-23`). The order details route reuses the same component instance on param change (`index.tsx:161` — `Route path={orderPath(":id")}` without a `key`), so `useClipboard` state survives navigation. The hook only clears on timeout or unmount (`useClipboard.ts:18-21,28-29`).
- Suggested fix: Reset `copied` when `orderId` changes (e.g., `useEffect(() => setCopyStatus(false), [orderId])` in the container, or key `OrderCopyLinkButton` by `orderId` in `OrderDetailsPage.tsx:211`).

### F-002 [WARNING] Mobile layout validation uses simplified TopNav title, not production order title

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:48`; `src/orders/components/OrderDetailsPage/Title.tsx:42-62`
- Description: Storybook and chrome mobile layout checks use the string title `"Order #42"`. Production order details pass a composite `<Title order={order} />` node containing order number, status pill, and created date in a horizontal flex row. At 320px, TopNav compresses the title column (`overflow="hidden"`, `Root.tsx:59-66`) while keeping three icon-only action buttons on a `flexWrap="nowrap"` row. The simplified story title understates how aggressively the real title truncates after adding the copy button.
- Evidence: Story decorator at `OrderCopyLinkButton.stories.tsx:48` vs production wiring at `OrderDetailsPage.tsx:210`. `Title.tsx` renders a multi-part flex layout with no mobile breakpoints. Chrome layout pass at 320px showed no button clipping with the short title (action cluster width 136px, viewport 320px); production title complexity was not exercised.
- Suggested fix: Add a Storybook story (or integration test viewport assertion) that uses the production `Title` component or a wide mock (long order number + status pill) at 320px to validate title truncation vs action-button visibility.

### F-003 [WARNING] Clipboard write failure is invisible on touch-only mobile devices

- Location: `src/hooks/useClipboard.ts:23-25`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:20-22`
- Description: When `navigator.clipboard.writeText` rejects (common on iOS Safari without user-gesture context or in restricted WebViews), the hook logs `console.warn` only. On mobile there is no hover tooltip fallback, and the button icon/label remain in the default "Copy order link" state with no toast, `aria-live` announcement, or haptic feedback. Staff users cannot tell whether the tap succeeded.
- Evidence: Catch block is console-only (`useClipboard.ts:23-25`). View has only `copied` vs default states (`OrderCopyLinkButtonView.tsx:20-22`); no error branch in `messages.ts`. Contrast with `useClipboardCopy` in extensions which surfaces a notifier on failure. PRD/ui-design explicitly omit error UI, but mobile touch-only usage makes this gap more impactful than on desktop.
- Suggested fix: Out of current ticket scope; track as follow-up to add transient error feedback (toast or `role="status"` region) when clipboard write fails, especially for mobile Safari.
