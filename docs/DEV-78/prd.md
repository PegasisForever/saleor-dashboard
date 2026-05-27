# PRD: Copy order link button in order details TopNav

## Goal

Staff users reviewing an order often need to share a direct link to that order with teammates or support channels. Today they must copy the browser address bar manually. A dedicated copy-link control in the order details TopNav makes sharing instant and discoverable, with clear feedback when the link is on the clipboard.

## Scope

- In scope:
  - Secondary icon button in order details `TopNav`, placed immediately before the existing metadata button
  - Copies the absolute dashboard URL for the current order (origin + mount URI + order path, no dialog query params)
  - Visual copied feedback via existing `ClipboardCopyIcon` (Copy → Check) and updated accessible label/title
  - Reuses `useClipboard` hook and `ClipboardCopyIcon` component
  - i18n for `messages.copyOrderLink` and `messages.orderLinkCopied`
  - `data-test-id="copy-order-link"` for tests
- Out of scope:
  - Copying storefront/checkout URLs
  - Toast notifications on copy (inline icon + label swap only)
  - New clipboard utilities or copy-icon components
  - Copy link on other pages (order list, drafts, etc.)
  - Permissions gating beyond existing order-details access

## User stories

- As a staff user on an order details page, I want a copy-link button in the TopNav so that I can share the order URL without leaving the page.
- As a staff user, I want visible feedback when the link is copied so that I know the action succeeded.

## Acceptance criteria

- [ ] Order details TopNav renders `OrderCopyLinkButton` to the left of the metadata button (`data-test-id="show-order-metadata"`) and before `TopNav.Menu`
- [ ] Clicking the button when `orderId` is present writes `getShareableOrderUrl(orderId)` to the clipboard via `useClipboard`
- [ ] Copied URL equals `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId))` with no query string
- [ ] After successful copy, button icon switches to check (`ClipboardCopyIcon hasBeenClicked={true}`) and `aria-label`/`title` show `messages.orderLinkCopied` for ~2 seconds, then revert
- [ ] Default `aria-label`/`title` use `messages.copyOrderLink`
- [ ] Button is `disabled` when `orderId` is empty
- [ ] Component uses `Button variant="secondary"` consistent with the adjacent metadata button
- [ ] No new npm dependencies; no duplicate clipboard/icon implementations
