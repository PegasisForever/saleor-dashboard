# PRD: Order details copy-link button

## Goal

Support staff sharing a direct link to an order from the order details page. Today users must copy the browser address bar manually; a dedicated control in the TopNav next to the metadata button makes sharing faster and keeps them on the page with clear copy feedback.

## Scope

- In scope:
  - Icon button in order details TopNav, placed immediately before the existing metadata button
  - Copies the absolute, shareable URL for the current order (origin + mount URI + `/orders/{id}`)
  - Visual feedback on successful copy (check icon via existing `ClipboardCopyIcon`, 2s reset per `useClipboard`)
  - Accessible label and tooltip via i18n messages
  - Keyboard activation (Enter/Space) with visible focus ring
- Out of scope:
  - Copying deep links with dialog/query params (e.g. open metadata modal)
  - Toast on clipboard failure (matches existing `useClipboard` behavior)
  - Copy-link on order draft list, order list, or other surfaces
  - New clipboard hook or copy-icon implementation

## User stories

- As a staff member viewing an order, I want to copy a shareable link from the TopNav so that I can paste it into chat or email without leaving the page.
- As a staff member, I want visible confirmation when the link is copied so that I know the action succeeded.

## Acceptance criteria

- [ ] Order details TopNav renders `OrderCopyLinkButton` immediately to the left of the metadata (`show-order-metadata`) button
- [ ] Clicking the button writes an absolute URL of the form `{origin}{mountUri}/orders/{orderId}` to the clipboard (no trailing dialog query params)
- [ ] After a successful copy, the button icon switches from copy to check for ~2 seconds, then reverts (via `useClipboard` + `ClipboardCopyIcon`)
- [ ] Button exposes `data-test-id="copy-order-link"` for E2E/tests
- [ ] Button `title` and `aria-label` use `messages.copyOrderLink` from `OrderCopyLinkButton/messages.ts`
- [ ] When `orderId` is empty or `disabled` is true, the button is not interactable (`disabled` attribute)
- [ ] Focus ring on the button meets ≥3:1 contrast against adjacent TopNav background (WCAG 2.5.5 non-text UI)
- [ ] All user-visible strings are defined in `messages.ts` and extracted via react-intl
