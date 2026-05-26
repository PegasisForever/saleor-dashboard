# PRD: Copy order link button in order details TopNav

## Goal

Merchants and staff frequently share a direct link to a specific order with teammates or support. Today they must copy the browser address bar manually, which is error-prone when the dashboard is mounted under a subpath or when modal query params pollute the URL. A dedicated copy-link control in the order details TopNav lets users grab a clean, shareable order URL in one click without leaving the page.

## Scope

- In scope:
  - Add a copy-link icon button to the order details TopNav, adjacent to the existing metadata button
  - Copy an absolute URL pointing to the order details page (no dialog/modal query params)
  - Show inline success feedback when the link is copied (icon toggles to checkmark for ~2s via existing clipboard hook)
  - Reuse `useClipboard` and `ClipboardCopyIcon`; add i18n strings for button label and copied state
  - Cover normal and unconfirmed order detail views that use `OrderDetailsPage` (not draft orders)
- Out of scope:
  - Copy-link on order list rows, draft order pages, or other surfaces
  - Toast/snackbar feedback (icon toggle matches existing order copy patterns)
  - Shortened URLs, public storefront links, or permission-gated share dialogs
  - Clipboard failure UI beyond existing console warning from `useClipboard`

## User stories

- As a **staff user viewing an order**, I want to copy a shareable link from the TopNav so that I can paste it into chat or email without manually editing the URL.
- As a **staff user**, I want visible confirmation that the link was copied so that I know I can paste it immediately.

## Acceptance criteria

- [ ] Order details TopNav (`OrderDetailsPage`) renders a copy-link button immediately to the left of the existing metadata (`Code`) button on non-draft order views
- [ ] Clicking the button writes the absolute order URL (`origin` + mount URI + `/orders/{id}`) to the system clipboard via `navigator.clipboard.writeText`
- [ ] The copied URL contains no query-string dialog params (e.g. no `?action=view-order-metadata`)
- [ ] After a successful copy, the button icon switches from copy to checkmark for approximately 2 seconds, then reverts (via `useClipboard`)
- [ ] The button exposes accessible name text from `orderCopyLinkMessages.copyOrderLink` (default: "Copy order link") and updates to `orderCopyLinkMessages.linkCopied` (default: "Link copied") while in the copied state
- [ ] The button has `data-test-id="copy-order-link"`
- [ ] The button is keyboard-focusable and activatable; disabled state prevents copy action
- [ ] Component Storybook stories cover `Default`, `Hover`, `Focus`, `Active`, `Disabled`, and `Copied` states with visually distinct rendering
