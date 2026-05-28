---
agent: step-7-deep-security-order-copy-link-button-pass-1
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
verdict: pass
---

## Summary

Security review of the order-copy-link-button area found no new dependencies, no secrets, no dangerous DOM/eval patterns, and no auth-boundary regression. `getShareableOrderUrl` composes a same-origin dashboard URL via existing `orderUrl` (`encodeURIComponent`) and the same `getAppMountUriForRedirect` + `window.location.origin` pattern used for auth redirects; clipboard writes reuse `useClipboard` without introducing share tokens or permission bypass. Mechanical checks pass or skip; no BLOCKER, SHOULD-FIX, or WARNING findings for this angle.

## Findings

(none)

## Justification (zero findings)

This diff adds ~60 LOC of client-only UI: a TopNav button that copies an absolute order-details URL to the clipboard. Security-relevant surfaces were exercised as follows:

1. **Sibling patterns:** Grepped `orderUrl`, `orderFulfillUrl`, `urlJoin(window.location.origin, getAppMountUriForRedirect(), …)` in `src/auth/`, `src/staff/`, and clipboard consumers. `getShareableOrderUrl` delegates encoding to `orderUrl` at `src/orders/urls.ts:234-235` (`encodeURIComponent`); it does not skip encoding unlike raw `orderPath` helpers used elsewhere for sub-routes. Absolute-URL assembly matches auth redirect builders; trailing `?` from `orderUrl` is consistent with in-app routing, not a security defect.

2. **PRD runtime trace:** Click → `handleCopy` → `getShareableOrderUrl` → `navigator.clipboard.writeText` confirmed. Copied state only flips in `useClipboard` `.then` (`src/hooks/useClipboard.ts:15-16`). No share tokens or backend URLs. Permissions remain `MANAGE_ORDERS` via `SectionRoute` on `/orders` (`src/index.tsx:248-251`).

3. **Missing defenses:** Deliberate PRD omissions (no failure toast, no extra permission gate, no share tokens) are product scope, not security holes. `useClipboard` silent `console.warn` on denial does not set `copied=true`, so the UI does not falsely claim success. No additional hardening required for merge from a security perspective.

4. **Adversarial `orderId`:** Production `orderId` is GraphQL `order.id` (`OrderDetailsPage.tsx:211`). Path metacharacters and `javascript:` payloads are confined by `encodeURIComponent` to a single `/orders/{segment}` path; `window.location.origin` fixes scheme/host. Empty `orderId` is gated by `order?.id`.

5. **Attacker model:** No open redirect, no clipboard/display split, no IDOR primitive beyond copying the same URL visible in the address bar. DOM clobbering of `origin` would require same-document HTML injection (XSS), which is out of scope for this localized feature.

6. **Failure modes:** Clipboard races and post-unmount `setCopyStatus` are pre-existing `useClipboard` behaviors shared by order email/tracking copy buttons; they do not introduce new confidentiality or integrity risks for the copied URL string.

**Files / sections inspected**

*Touched files*

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: clipboard handler, i18n labels, no `href`/DOM injection
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts`: absolute URL builder via `orderUrl` + mount URI + origin
- `src/orders/components/OrderCopyLinkButton/messages.ts`: i18n only
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`: scoped styles only
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: Storybook fixtures; mock user context only
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-211`: conditional render with `order?.id` guard

*Call sites of new/changed exports*

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production): passes `orderId={order.id}` when `order?.id` truthy; respects optional-order contract
- `OrderCopyLinkButton` — `OrderCopyLinkButton.stories.tsx:46,95` (Storybook): fixture ID `T3JkZXI6MQ==`; not production auth surface
- `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` only caller in `src/` per `rg getShareableOrderUrl`
- `orderCopyLinkButtonMessages` — `OrderCopyLinkButton.tsx:9,38-40` only consumer in `src/`

*Parent / host components*

- `OrderDetailsPage.tsx:210-211` — renders `<OrderCopyLinkButton orderId={order.id} />` inside `TopNav` when `order?.id` present; matches PRD guard pattern
- `OrderDetails.tsx:62-68` — `order === null` → `NotFoundPage` before details page with copy button
- `src/index.tsx:248-251` — `/orders` behind `SectionRoute` + `MANAGE_ORDERS`
- `SectionRoute.tsx:26-38` — permission denial renders `NotFound`

*Integration dependencies*

- `src/orders/urls.ts:192,234-235` — `orderUrl` / `encodeURIComponent` path encoding
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect`
- `src/config.ts:5-6` — `getAppMountUri` from `__SALEOR_CONFIG__`
- `src/hooks/useClipboard.ts:12-25` — `writeText` + failure handling
- `src/orders/index.tsx:82-87,161` — route `decodeURIComponent` for order id param

*Tests*

- No `*.test.*` for `OrderCopyLinkButton` or `getShareableOrderUrl` (grep clean); `useClipboard.test.ts` covers hook rejection only — noted as coverage gap, not a security defect in this diff
