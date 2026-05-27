# PRD: Copy order link button in order details TopNav

## Goal

Order-detail pages are frequently shared between support, warehouse, and finance staff via chat or email. Today there is no quick way to copy the current order URL from the details view — users must copy from the browser address bar, which is error-prone when the dashboard is mounted under a subpath or when modal query params are present. A dedicated copy-link control in the order details TopNav lets staff grab a clean, shareable URL in one click without leaving the page.

## Scope

- In scope:
  - Secondary icon button in order details `TopNav`, placed immediately before the existing metadata button
  - Copies absolute shareable URL for the current order (`origin` + mount URI + `/orders/{id}`)
  - Visual feedback on successful copy (icon swap copy → check for ~2s via `useClipboard`)
  - Accessible label via `title` and `aria-label` (i18n via `orderCopyLinkButtonMessages`)
  - `data-test-id="copy-order-link"` for E2E/unit targeting
  - Storybook prototype covering interactive states
- Out of scope:
  - Copying deep links with modal/dialog query params
  - Toast notification on copy (icon feedback only, matching existing clipboard patterns)
  - Copy link on order list, draft list, or other surfaces
  - Backend or permission changes

## User stories

- As a **support agent**, I want to copy a shareable link to the order I'm viewing so that I can paste it into Slack or email without hunting for the address bar.
- As a **warehouse manager**, I want immediate visual confirmation that the link was copied so that I know I can paste it elsewhere.
- As a **staff user with dashboard mounted at a subpath**, I want the copied URL to include the correct mount prefix so that recipients land on the order page.

## Acceptance criteria

- [ ] Order details `TopNav` renders `OrderCopyLinkButton` immediately before the metadata (`Code`) button when `order.id` is present
- [ ] Clicking the button writes `getOrderShareableUrl(order.id)` to the clipboard (absolute URL: `window.location.origin` + `getAppMountUriForRedirect()` + `orderPath(orderId)`)
- [ ] After a successful copy, the button icon switches from copy to check for approximately 2 seconds (`useClipboard` behavior)
- [ ] Button `aria-label` and `title` use `orderCopyLinkButtonMessages.copyOrderLink` before copy and `orderCopyLinkButtonMessages.orderLinkCopied` after copy
- [ ] Button is not rendered when `order.id` is absent
- [ ] Component reuses `useClipboard` from `@dashboard/hooks/useClipboard` and `ClipboardCopyIcon` from `@dashboard/orders/components/OrderCardTitle/ClipboardCopyIcon` (no new clipboard primitives)
- [ ] Storybook story `Orders/OrderCopyLinkButton` includes `Default`, `Hover`, `Focus`, `Active`, `Disabled`, and `Copied` exports; `Copied` is visually distinct from `Default` (check icon vs copy icon)
- [ ] Published Storybook URL is recorded in `./docs/DEV-78/ui-design.md`
