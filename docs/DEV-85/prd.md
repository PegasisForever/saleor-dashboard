# PRD: Copy order link button in order details TopNav

## Goal

Order managers frequently need to share a direct link to a specific order with teammates, support staff, or external partners. Today they must manually copy the browser address bar, which is easy to miss and breaks flow when reviewing order details. This feature adds a one-click copy-link control in the order details TopNav so users can grab a shareable URL without leaving the page.

## Scope

- In scope:
  - Icon button in order details TopNav, placed immediately before the existing metadata (code) button
  - Copies the current page URL (`window.location.href`) to the clipboard on click
  - Visual feedback on successful copy: icon switches from copy to check; `title` and `aria-label` update to confirm success
  - Reuses existing `useClipboard` hook and `ClipboardCopyIcon` component
  - Accessible labels via react-intl messages (`messages.copyOrderLink`, `messages.orderLinkCopied`)
  - `data-test-id="copy-order-link"` for E2E targeting
- Out of scope:
  - Copying a canonical URL without query parameters (current URL is the shareable link)
  - Toast notification on copy (icon + label change is sufficient feedback, matching existing clipboard patterns)
  - Copy link on other pages (orders list, draft orders, etc.)
  - Backend or API changes
  - New clipboard utilities or copy-icon components

## User stories

- As a store operator viewing an order, I want to copy a shareable link from the TopNav so that I can paste it into chat or email without manually selecting the address bar.
- As a support agent, I want clear feedback when the link is copied so that I know the action succeeded before switching apps.

## Acceptance criteria

- [ ] Order details TopNav renders `OrderCopyLinkButton` immediately to the left of the metadata button (`data-test-id="show-order-metadata"`)
- [ ] Clicking the copy button writes `window.location.href` to the system clipboard
- [ ] After a successful copy, the button icon shows a check mark (via `ClipboardCopyIcon`) for 2 seconds, then reverts to the copy icon
- [ ] After a successful copy, the button `aria-label` and `title` read "Order link copied" (via `messages.orderLinkCopied`); before copy they read "Copy order link" (via `messages.copyOrderLink`)
- [ ] When clipboard write fails, the button remains in the default (copy icon, "Copy order link") state and `useClipboard` logs a console warning — no unhandled promise rejection
- [ ] Button uses `variant="secondary"` and `iconSize.medium` to visually match the adjacent metadata button
- [ ] Button is keyboard-focusable; focus ring is visible with ≥3:1 contrast against the TopNav background (WCAG 2.5.5)
- [ ] All user-visible strings are defined in `src/orders/components/OrderCopyLinkButton/messages.ts` and rendered through react-intl
