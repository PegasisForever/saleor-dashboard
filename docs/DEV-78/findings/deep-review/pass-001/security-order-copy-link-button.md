---
agent: step-7-deep-security-order-copy-link-button-pass-1
input_branch: 04aaf8e902a7277b5e64bee43842a5c4f41bed35
verdict: pass
---

## Summary

Security review of the order-copy-link-button area found no BLOCKER or WARNING issues. The feature reuses existing clipboard and URL-building patterns, adds no dependencies, introduces no dangerous DOM or script patterns, and does not widen the auth boundary beyond users who already reach order details via `MANAGE_ORDERS` and a successful GraphQL `order` fetch.

## Findings

(none)

## Justification

The cumulative diff for this area is client-only UI: `OrderCopyLinkButton`, `getOrderShareableUrl`, TopNav wiring, `ClipboardCopyIcon` sizing props, i18n strings, and tests. There are no new npm dependencies (`package.json` / lockfiles unchanged in `45b5cef8..HEAD`), no secrets in scoped files, and no matches for `dangerouslySetInnerHTML`, `eval`, `innerHTML`, shell execution, or SQL concatenation.

`getOrderShareableUrl` builds `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId))` — scheme and host come from the current page; `orderId` is `order.id` from the GraphQL response (not raw route input) and is written to the clipboard via the existing `useClipboard` hook (`navigator.clipboard.writeText`). That does not create an open-redirect or `javascript:` navigable URL; malicious path segments are out of scope for normal Saleor server-issued IDs.

Auth boundary matches the rest of order details: `/orders` requires `PermissionEnum.MANAGE_ORDERS` (`SectionRoute` in `src/index.tsx`), unauthenticated users never load the orders section, and `OrderDetails` returns `NotFoundPage` when `order === null` before `OrderCopyLinkButton` renders. The copied link is an admin dashboard URL with the same access requirements as copying from the address bar — no new permission surface per PRD.
