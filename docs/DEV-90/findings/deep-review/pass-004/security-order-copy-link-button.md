---
agent: step-7-deep-security-order-copy-link-button-pass-4
input_branch: 09886983335621e9c0048186f6f51d0f16611441
verdict: pass
---

## Summary

Pass-4 security review of the cumulative `order-copy-link-button` area (~614 LOC across 10 `src/` files since anchor `45b5cef8`) found no BLOCKER, SHOULD-FIX, or WARNING security defects. The feature copies a same-origin dashboard deep link via `navigator.clipboard.writeText`; it adds no new dependencies, auth surfaces, network calls, or dangerous DOM patterns. URL construction correctly delegates encoding to `orderUrl(encodeURIComponent(id))`; the copied payload excludes session tokens, cookies, and address-bar query params. Auth boundaries inherit staff login → `MANAGE_ORDERS` section gate → GraphQL `order(id:)` authorization. Pass-4 delta since pass-3 is test-only (iter-7 real-hook integration test); production security surface is unchanged.

## Justification

Six adversarial forced prompts and four mechanical checks were applied independently (no prior-pass findings read):

1. **Sibling-helper compare:** `getShareableOrderUrl` correctly routes through `orderUrl(orderId)` which applies `encodeURIComponent` at `src/orders/urls.ts:234-235`, matching all sibling `*Url` helpers. Absolute URL assembly uses the same `urlJoin(window.location.origin, getAppMountUriForRedirect(), …)` pattern as auth redirect builders. No auth tokens appear in URL construction; extension token copy uses a separate `useClipboardCopy` hook.

2. **PRD runtime trace (security aspects):** Copied string is `{origin}{mount}/orders/{encodedId}?` with empty query — no share tokens, no `location.search` dialog params, no network egress on click. Permission model matches PRD out-of-scope: no extra button gate beyond existing order-details access chain.

3. **Missing safeguards:** Absent input validation, failure toasts, component-level permission checks, and audit logging are either PRD/tech-plan explicit out-of-scope (`docs/DEV-90/prd.md:18-20`) or pre-existing shared `useClipboard` patterns consumed identically by `OrderCustomer`, `CopyableText`, and `TrackingNumberDisplay`. None introduce a new security boundary defect in this diff.

4. **Adversarial inputs:** Production `orderId` is GraphQL-sourced (`OrderDetailsPage.tsx:211`); path metacharacters (`/`, `#`, `?`, `&`, `=`, `%`, unicode) are percent-encoded via `orderUrl`. `orderId` is not rendered in DOM labels (static i18n only). Empty/falsy IDs are gated by `order?.id`. Scheme/host come from `window.location.origin`, not user-controlled `orderId`.

5. **Attacker model:** No client-side auth bypass, open redirect, XSS sink, or session-token leakage in the copy path. Copied links are identifier pointers requiring the same staff auth + backend authorization as manual navigation. Residual IDOR reliance is on backend `order(id:)` — pre-existing architecture, not introduced by this feature.

6. **Failure modes:** Concurrent `writeText` races and post-unmount `setState` are pre-existing `useClipboard` behaviors shared across the dashboard; the pass-4 hook change (`clear()` before `setCopyStatus`) improves timer correctness without expanding attack surface. Clipboard denial correctly avoids false-success UI (`copied` set only in `.then()`).

Mechanical checks: `dep-audit` pass (no manifest changes), `secrets-scan` pass (no credential literals in scoped diff), `dangerous-patterns` pass (zero matches for eval/innerHTML/SQL/shell), `auth-boundary` pass (full chain traced).

## Files / sections inspected

### Touched files (cumulative diff)

- `src/hooks/useClipboard.ts:12-27` — `navigator.clipboard.writeText` only; `clear()` before success state; generic failure warn without URL logging.
- `src/hooks/useClipboard.test.ts:105-141` — rapid-copy timer test for pass-4 hook fix.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-67` — click handler copies `getShareableOrderUrl(orderId)`; labels from i18n only; no permission checks.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — composes origin + mount + `orderUrl(orderId)`; no auth material.
- `src/orders/components/OrderCopyLinkButton/messages.ts:3-14` — static user-facing strings; no dynamic orderId in messages.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — visual states only; no content injection surface.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:42-123` — Storybook fixtures with placeholder IDs; not production auth path.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:57-229` — success-path and real-hook integration tests; no security regression vectors.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts:39-76` — encoding and mount-path assertions including special chars.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — conditional render with `order?.id` guard and `key={order.id}` remount.

### Export call sites

- `OrderCopyLinkButton` — exported in `OrderCopyLinkButton.tsx:21`; call sites:
  - `OrderDetailsPage.tsx:211` — `{order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}`; respects contract (guards falsy id, passes server-sourced id).
  - `OrderCopyLinkButton.stories.tsx:95` — Storybook composition with fixture `orderId="T3JkZXI6MQ=="`; non-production.
  - `OrderCopyLinkButton.test.tsx:68,86,109,124,194` — unit/integration tests with fixture IDs.
- `getShareableOrderUrl` — exported in `getShareableOrderUrl.ts:5`; call sites:
  - `OrderCopyLinkButton.tsx:33` — sole production caller; passes prop `orderId`.
  - `OrderCopyLinkButton.test.tsx:64,190` — test assertions.
  - `getShareableOrderUrl.test.ts:46,59,72` — URL builder unit tests.
- `orderCopyLinkButtonMessages` — exported in `messages.ts:3`; call site:
  - `OrderCopyLinkButton.tsx:9,38-40,62` — i18n labels only; contract respected.

### Parent / host components

- `OrderDetailsPage.tsx:210-211` — TopNav host; `order?.id` guard before render; `key={order.id}` for remount on navigation.
- `OrderNormalDetails/index.tsx:201-222` — passes `order={order}` from GraphQL-loaded data into `OrderDetailsPage`.
- `OrderUnconfirmedDetails/index.tsx:201-222` — same wiring as normal flow.
- `OrderDetails.tsx:62-68,180+` — `useOrderDetails(id)` GraphQL gate; `order === null` → NotFoundPage before button reachable; draft orders route to separate page without copy button.

### Integration dependencies

- `src/orders/urls.ts:192,234-235` — `orderUrl` applies `encodeURIComponent(id)`; trailing `?` with empty params.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect()` from deploy config; not user-controlled.
- `src/auth/components/SectionRoute.tsx:18-38` — `MANAGE_ORDERS` permission gate on `/orders`.
- `src/index.tsx:248-251,165-172` — section route registration and authenticated shell gate.
- `src/auth/hooks/useAuthProvider.ts:257` — staff-only `authenticated` check.
- `src/graphql/client.ts:42` — session via `credentials: "include"` cookies; not in copied URL.

### Sibling copy patterns (comparison)

- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx:16-17,57` — same `useClipboard` + `ClipboardCopyIcon` pattern; copies plain text not URL.
- `src/extensions/.../useClipboardCopy.ts:22-36` — separate hook for bearer tokens with error notification; not used here.

### Overlapping tests

- `src/hooks/useClipboard.test.ts` — hook-level rejection and rapid-copy timer coverage.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — component click, aria-live, remount, real-hook transition (pass-4 delta).
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — encoding adversarial string test.
