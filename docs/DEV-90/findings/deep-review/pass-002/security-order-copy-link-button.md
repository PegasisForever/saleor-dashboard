---
agent: step-7-deep-security-order-copy-link-button-pass-2
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
verdict: pass
---

## Summary

Security review of the pass-2 `order-copy-link-button` area (~470 LOC across 10 `src/` files, including post-pass-1 remediation: unit tests, `useClipboard` timer fix, `aria-live` status, `key={order.id}` remount) found no auth-boundary regressions, no new dependencies, no secrets, and no dangerous DOM/eval patterns. `getShareableOrderUrl` builds a same-origin dashboard path via existing `orderUrl` (`encodeURIComponent`) and `getAppMountUriForRedirect`; the copied URL contains no session tokens and deliberately omits address-bar query params that could auto-open destructive dialogs. Mechanical checks pass; no BLOCKER, SHOULD-FIX, or WARNING findings for this angle.

## Findings

(none)

## Files / sections inspected

### Touched files (diff since `45b5cef8`)

- `src/hooks/useClipboard.ts:16` — post-success `clear()` before timer reset; clipboard write only via `navigator.clipboard.writeText`; failure logs generic warning without URL.
- `src/hooks/useClipboard.test.ts:105-142` — rapid-copy timer behavior test; no security-sensitive assertions.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — click handler copies `getShareableOrderUrl(orderId)`; labels from i18n only (no `orderId` in DOM); `aria-live` announces static success string.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — absolute URL from `window.location.origin` + mount + `orderUrl(orderId)`; no user-controlled scheme/host.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — static i18n strings only.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — visual states; `.statusRegion` is visually hidden, no URL content.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook fixtures; not a production auth surface.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — mocks clipboard hook; verifies URL passed to copy mock.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts:65-75` — confirms path metacharacters encoded via `orderUrl`.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — gated render `{order?.id ? …}`; passes GraphQL `order.id`.

### Export call sites

- `getShareableOrderUrl` — exported in diff; callers per `git grep getShareableOrderUrl`: `OrderCopyLinkButton.tsx:33` (production), `OrderCopyLinkButton.test.tsx:55` (test), `getShareableOrderUrl.test.ts` (unit tests). Production call site passes server-sourced `orderId` prop; contract respected.
- `OrderCopyLinkButton` — exported; callers: `OrderDetailsPage.tsx:211` (production), `OrderCopyLinkButton.stories.tsx:95` (Storybook). Production call site guards on `order?.id` and passes `order.id`; contract respected.
- `useClipboard` — modified export (1-line `clear()` addition); existing callers unchanged; no new security surface.

### Parent / host components

- `OrderDetailsPage.tsx:210-211` — renders `<OrderCopyLinkButton key={order.id} orderId={order.id} />` inside `TopNav` when `order?.id` truthy; optional chaining prevents render without ID.
- `OrderNormalDetails/index.tsx:201` — passes `order={order}` from `useOrderDetails(id)` after null check in `OrderDetails.tsx:66-68`.
- `OrderUnconfirmedDetails/index.tsx:201` — same `OrderDetailsPage` host pattern for unconfirmed orders.
- `OrderDetails.tsx:62-68` — GraphQL fetch + `NotFoundPage` when `order === null`; copy button unreachable without authorized order data.

### Integration dependencies

- `src/orders/urls.ts:234-235` — `orderUrl` applies `encodeURIComponent(id)`; sibling pattern matches `orderFulfillUrl` etc.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` reads deploy config, not user input.
- `src/config.ts:5-6` — `APP_MOUNT_URI` from `__SALEOR_CONFIG__`.
- `src/index.tsx:248-251` — `/orders` behind `SectionRoute` with `MANAGE_ORDERS`.
- `src/auth/hooks/useAuthProvider.ts:257` — staff-only `authenticated` gate.

### Tests overlapping security paths

- `getShareableOrderUrl.test.ts` — encoding and mount-prefix cases.
- `OrderCopyLinkButton.test.tsx` — click invokes copy with constructed URL; aria-live on copied state.
- `useClipboard.test.ts` — timer/cleanup behavior (shared hook).
- No `OrderDetailsPage` integration test for copy button (coverage gap noted; not a security defect — URL/auth path unchanged from manual address-bar copy).

## Justification

Honest application of all six adversarial prompts and four mechanical checks yields no actionable security findings:

1. **Sibling pattern grep:** `getShareableOrderUrl` delegates encoding to `orderUrl` (`encodeURIComponent`), matching every public `*Url` helper in `urls.ts`. Absolute-URL assembly mirrors auth redirect builders (`auth/utils.ts`, `useAuthRedirection.ts`). Clipboard uses shared `useClipboard`, same as `CopyableText` and `OrderCustomer`; bearer-token flows use separate `useClipboardCopy` — this feature correctly avoids the secret-copy path.

2. **PRD runtime trace:** Click → `getShareableOrderUrl(orderId)` → `writeText`. Copied URL is `{origin}{mount}/orders/{encodedId}?` with empty query string — no share tokens (PRD out-of-scope), no session material. Recipient must pass existing staff auth + `MANAGE_ORDERS` + backend `order(id:)` authorization; the button does not weaken IDOR controls beyond what address-bar sharing already allows.

3. **Missing defenses:** Deliberate PRD/tech-plan omissions (no share tokens, no extra permission gate, silent clipboard denial) are product scope choices, not security regressions. Missing runtime `orderId` format validation is acceptable because production wiring sources GraphQL `order.id` and path encoding confines arbitrary strings to a single segment.

4. **Adversarial inputs:** `/`, `?`, `#`, `&`, `%`, `javascript:`, unicode/RTL in `orderId` are percent-encoded in the path; scheme/host fixed to `window.location.origin`. `orderId` never reflected in JSX or clipboard HTML — plain text only. Empty `orderId` blocked by `order?.id` gate.

5. **Attacker model:** Unauthenticated recipients hit login shell. Crafted `orderId` prop cannot open-redirect (encoded path segment only). Clipboard is write-on-click only; no `readText`. Copied links omit `?action=` dialog params present in address-bar URLs — strictly narrower sharing surface than manual URL copy.

6. **Failure modes:** `useClipboard` async races and unmount-after-write are inherited hook behaviors shared across the dashboard; `key={order.id}` resets UI state on navigation. These are integrity/UX concerns, not auth-boundary or confidentiality breaches between privilege levels (staff already authorized for viewed orders). No new network endpoints, crypto, serialization, or process boundaries introduced.

Mechanical checks: `dep-audit` pass (no manifest changes), `secrets-scan` pass, `dangerous-patterns` pass, `auth-boundary` pass.
