# PRD: Copy order link in order details TopNav

## Goal

Store staff often need to share a direct link to a specific order with teammates or support tools. Today they must copy the browser address bar manually, which is error-prone when the dashboard is mounted under a subpath or when query params are open. A dedicated copy-link control in the order details TopNav lets users grab the canonical order URL in one click without leaving the page.

## Scope

- In scope:
  - Secondary icon button in the order details `TopNav`, placed before the existing metadata button
  - Copies the absolute URL for the current order (origin + app mount URI + order path)
  - Visual feedback when copy succeeds (check icon via existing `ClipboardCopyIcon` pattern, ~2s)
  - Uses `useClipboard` and `ClipboardCopyIcon` — no new clipboard primitives
  - Accessible label via `messages.copyOrderLink`
  - `data-test-id="copy-order-link"` for tests
- Out of scope:
  - Draft order details TopNav
  - Success toast notification (orders-domain copy uses icon swap only)
  - Copying URLs with open dialogs / query params
  - Backend or GraphQL changes

## User stories

- As a store admin viewing an order, I want to copy a shareable link to this order from the TopNav so that I can paste it into chat, email, or another tool without manually selecting the address bar.
- As a store admin, I want clear feedback when the link was copied so that I know the action succeeded.

## Acceptance criteria

- [ ] On the non-draft order details page (`OrderDetailsPage`), a copy-link button appears in `TopNav` immediately before the metadata (`Code`) button
- [ ] Clicking the button writes the absolute order URL to the clipboard, built as `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(encodeURIComponent(orderId)))`
- [ ] After a successful copy, the button icon switches from copy to check for approximately two seconds (`useClipboard` behavior)
- [ ] The button uses `variant="secondary"`, `ClipboardCopyIcon`, and `useClipboard` — no duplicate clipboard utilities
- [ ] `aria-label` and `title` use `messages.copyOrderLink` ("Copy order link")
- [ ] `data-test-id="copy-order-link"` is present on the button
- [ ] When `orderId` is empty, the button is not rendered
- [ ] Keyboard focus on the copy-link button shows a visible focus indicator using the `text-accent1` outline ring (≥3:1 non-text contrast vs page background)
- [ ] Storybook stories exist for states: `Default`, `Hover`, `Focus`, `Active`, `Disabled`, `Loading`, `Error`, `Empty` under `Orders/OrderCopyLinkButton`
- [ ] A published Storybook URL is recorded in `docs/DEV-66/ui-design.md`
