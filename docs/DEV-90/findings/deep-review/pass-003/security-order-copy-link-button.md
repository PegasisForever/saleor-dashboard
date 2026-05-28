---
agent: step-7-deep-security-order-copy-link-button-pass-3
input_branch: 6feae83ec628e0296d8e2a3652c5db5ed4b58877
verdict: pass
---

## Summary

Pass-3 security review of the cumulative `order-copy-link-button` area (~509 LOC across 10 `src/` files since anchor `45b5cef8`) found no auth-boundary regressions, no new dependencies, no secrets, and no dangerous DOM/eval patterns. The iter-5 delta is test-only (remount guard, copied-state aria/title assertions); production URL construction (`encodeURIComponent` via `orderUrl`), same-origin clipboard payload, and `MANAGE_ORDERS` section gating are unchanged from prior implementation. Mechanical checks pass or skip; no BLOCKER, SHOULD-FIX, or WARNING findings for this angle.

## Findings

(none)

## Justification (zero findings)

**Diff shape:** `git diff 45b5cef8..HEAD -- src/` touches 10 files; commits since pass-2 remediation are `91ab4fb79` (remount test) and `a9e83951c` (aria-label/title assertions) — no production-line changes in pass-3.

**Sibling-pattern grep (forced prompt 1):** Compared `getShareableOrderUrl` to `orderUrl`, `orderFulfillUrl`, and auth redirect builders (`useAuthRedirection.ts:23-27`, `Login.tsx:63`, `auth/utils.ts:108-109`). Encoding is delegated to `orderUrl` → `encodeURIComponent(id)` at `urls.ts:234-235`; tests lock encoding for `=` and path metacharacters (`getShareableOrderUrl.test.ts:39-75`). Trailing bare `?` matches established `orderUrl` contract, not an open-redirect vector.

**PRD security trace (forced prompt 2):** Copied payload is `origin + getAppMountUriForRedirect() + orderUrl(orderId)` with no `params` — no session tokens, no address-bar query leakage (`getShareableOrderUrl.ts:5-8`). Button renders only behind `order?.id` on a page already gated by `SectionRoute` `MANAGE_ORDERS` (`index.tsx:248-251`, `SectionRoute.tsx:18-38`) and GraphQL `order(id:)` (`OrderDetails.tsx:62-68`). PRD explicitly excludes share tokens and extra permission gates (`prd.md:19-20`).

**Adversarial inputs (forced prompt 4):** Mentally traced `javascript:`, `https://evil.com`, `../`, `#`, `%`, unicode, and empty string through `encodeURIComponent` + `urlJoin(window.location.origin, …)`. Host/scheme stay on `window.location.origin`; encoded ids remain under `/orders/…`. Empty `orderId` is blocked in production by `order?.id` guard (`OrderDetailsPage.tsx:211`).

**Attacker model (forced prompt 5):** Copied link is an identifier pointer, not a capability token — recipient still needs staff session + `MANAGE_ORDERS` + backend authorization. No `dangerouslySetInnerHTML`, no `orderId` in DOM/ARIA (static i18n only). Clipboard hook is write-only (`useClipboard.ts:13-14`).

**Considered then rejected as findings:**
- *Silent clipboard denial* — PRD/tech-plan accepted (`prd.md:18`, `tech-plan.md:50`); async rejection does not set `copied=true` (no false-success leak).
- *Missing `navigator.clipboard` sync throw* — pre-existing shared-hook behavior, not introduced by this diff; out of v1 scope per tech plan.
- *Order global ID in shared URL* — intentional deep-link behavior per PRD; not an auth bypass.
- *`forceCopied` on production props* — Storybook-only wiring; `OrderDetailsPage` never passes it; no attacker-controlled input path.
- *Out-of-order `writeText` races* — requires sub-human click timing on a single button; not a realistic security trigger.

**Mechanical checks:** `package.json` / lockfile unchanged (dep-audit skip). Secrets pattern grep on `src/` diff: clean (secrets-scan pass). No eval/HTML-injection/shell patterns in touched files (dangerous-patterns pass). Auth-boundary trace: pass.

## Files / sections inspected

### Touched files (read)

- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — same-origin URL builder; delegates encoding to `orderUrl`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-67` — click → `copy(getShareableOrderUrl(orderId))`; static i18n labels; no `href`/HTML sinks.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — generic copy/copied strings only.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts:39-75` — encoding + mount cases.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:48-125` — pass-3 remount + aria/title tests; mocked clipboard.
- `src/hooks/useClipboard.ts:3-33` — `writeText` only; denial logs generic warn without URL.
- `src/hooks/useClipboard.test.ts` — referenced for denial behavior (hook layer).
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — `order?.id` guard + `key={order.id}` remount.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook only; static `href="/orders"`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — visual/a11y styles only.

### Export call sites

| Export | Call sites | Contract |
|--------|------------|----------|
| `getShareableOrderUrl` | `OrderCopyLinkButton.tsx:33` (production); `getShareableOrderUrl.test.ts`, `OrderCopyLinkButton.test.tsx` (tests) | Single production caller passes GraphQL `orderId`; encoding via `orderUrl`. |
| `OrderCopyLinkButton` | `OrderDetailsPage.tsx:211` (production); `OrderCopyLinkButton.stories.tsx:95`; tests | Parent passes `orderId={order.id}` only when `order?.id` truthy. |
| `useClipboard` (modified) | Existing consumers unchanged: `OrderCopyLinkButton.tsx:30`, `CopyableText.tsx:14`, `OrderCustomer.tsx:132-134`, `TrackingNumberDisplay.tsx:16`, `PspReference.tsx:19`, `GiftCardCreateDialogCodeContent.tsx:21`, `ChannelForm.tsx:95` | One-line `clear()` before reschedule; no new clipboard surface. |

### Parent / host components (read)

- `OrderDetailsPage.tsx:211` — `{order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}` before metadata button; respects optional `order` during load.
- `OrderNormalDetails/index.tsx:201` — renders `OrderDetailsPage` for confirmed orders.
- `OrderUnconfirmedDetails/index.tsx:201` — same host path for unconfirmed orders.
- `OrderDetails.tsx:62-68` — `order === null` → `NotFoundPage` before page with copy button.
- `OrderDraftPage.tsx:111-127` — TopNav without copy button (draft out of PRD scope).

### Integration surfaces (read)

- `src/orders/urls.ts:192,234-235` — `orderPath` + `orderUrl` with `encodeURIComponent`.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` from deploy config.
- `src/config.ts:5-6` — `getAppMountUri` / `getAppDefaultUri`.
- `src/auth/components/SectionRoute.tsx:18-38` — permission gate renders `NotFound` when missing `MANAGE_ORDERS`.
- `src/index.tsx:165-172,248-251` — authenticated shell + orders section permissions.
- `src/orders/index.tsx:82-87` — route param `decodeURIComponent` before GraphQL id.
- `src/orders/views/OrderDetails/useOrderDetails.ts:4-8` — `order(id:)` query variables.
- `src/graphql/client.ts:40-47` — `credentials: "include"` (cookies not in copied URL).

### Planning artifacts (read)

- `docs/DEV-90/prd.md` — scope, out-of-scope security items (no share tokens, no extra gate).
- `docs/DEV-90/tech-plan.md` — URL shape, clipboard risk table, no new deps.

### Tests overlapping security paths

- `getShareableOrderUrl.test.ts` — path encoding adversarial case (`order/with/special chars`).
- `OrderCopyLinkButton.test.tsx:91-125` — remount resets copied UI (prevents cross-order feedback leak; not clipboard-content race).
- `useClipboard.test.ts` — denial does not set copied; warn message does not include payload (referenced, not re-run this pass).
