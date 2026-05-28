# PRD: Copy order link button in order details TopNav

## Goal

Staff users reviewing an order often need to share a direct link to that order with teammates or support tools. Today they must copy the URL manually from the browser address bar. A dedicated copy-link control in the order details TopNav lets them grab a shareable order URL in one click without leaving the page, with clear feedback when the copy succeeds.

## Scope

- In scope:
  - Secondary icon button in order details `TopNav`, placed immediately before the existing metadata button
  - Copies the absolute shareable URL for the current order (origin + mount URI + `orderUrl(orderId)`)
  - Visual copied feedback via existing `ClipboardCopyIcon` (copy → check) and updated accessible label
  - Uses existing `useClipboard` hook and `ClipboardCopyIcon` component
  - `data-test-id="copy-order-link"` for automated tests
  - i18n for button labels via `orderCopyLinkButtonMessages`
- Out of scope:
  - Copy link on order draft details, order list, or other surfaces
  - Toast notification on copy success or failure (icon + aria-label feedback only)
  - Shortened / vanity URLs or backend-generated share tokens
  - Permissions gate beyond existing order-details page access

## User stories

- As a staff user on the order details page, I want a copy-link button next to the metadata control so that I can share the order URL without manually selecting the address bar.
- As a staff user, I want visible confirmation when the link is copied so that I know the action succeeded.

## Acceptance criteria

- [ ] Order details `TopNav` renders `OrderCopyLinkButton` immediately before the metadata (`Code`) button when `order.id` is present
- [ ] Clicking the button writes the absolute order URL (`getShareableOrderUrl(orderId)`) to the system clipboard via `useClipboard`
- [ ] After a successful copy, the button icon switches from copy to check (`ClipboardCopyIcon`) for ~2 seconds and `aria-label` / `title` update to the `orderCopyLinkButtonMessages.orderLinkCopied` string ("Order link copied")
- [ ] Default label uses `orderCopyLinkButtonMessages.copyOrderLink` ("Copy order link")
- [ ] Button uses `variant="secondary"` to match the adjacent metadata button styling
- [ ] Button exposes `data-test-id="copy-order-link"`
- [ ] No new clipboard hook or copy-icon component is introduced; implementation reuses `useClipboard` and `ClipboardCopyIcon`
- [ ] User-visible strings are defined in `src/orders/components/OrderCopyLinkButton/messages.ts` (not inline literals)
- [ ] Active-state icon contrast on pressed button is ≥3:1 (WCAG 2.5.5 non-text): `OrderCopyLinkButton.module.css` darkens icon to `--mu-colors-text-default1` on `:active` / `buttonForceActive`
- [ ] `Disabled` Storybook story documents disabled styling only; production TopNav does not pass `disabled` when `order.id` is present (button omitted when id missing)
