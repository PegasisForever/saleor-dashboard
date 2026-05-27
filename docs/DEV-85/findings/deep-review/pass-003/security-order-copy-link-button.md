---
agent: step-7-deep-security-order-copy-link-button-pass-3
input_branch: 7a4e0a69c93b1092d88419dfd90b9dd892bbc0d8
verdict: pass
---

## Summary

Security review of the order-copy-link-button feature finds no auth bypass, credential leakage, XSS, or new dependency/secrets surface. Production copies `window.location.href` behind existing `MANAGE_ORDERS` route gates — equivalent to manual address-bar copy. Residual WARNINGs document intentional PRD/tech-plan tradeoffs (full URL including query-driven modal state), a latent unvalidated `url` prop API, and clipboard integrity edge cases in the shared `useClipboard` hook.

## Findings

### F-001 [WARNING] Copied URL includes URL-driven modal/workflow query params

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:17-18`; `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`; `src/utils/handlers/dialogActionHandlers.ts:39-46`; `src/orders/urls.ts:194-227`
- Description: Production omits the `url` prop and copies the full browser URL. When order-detail modals are open, `action`, `id`, and `type` query params are included. Recipients with `MANAGE_ORDERS` who open the pasted link may auto-open the same workflow dialogs. This is not an auth bypass but shares operational UI state beyond the bare order path.
- Evidence: `copy(url ?? window.location.href)`; dialog navigation merges `action` into URL via `dialogActionHandlers`; tech plan row “`window.location.href` includes sensitive query params” marks this acceptable (`docs/DEV-85/tech-plan.md:49`). E2E asserts `clipboardText === page.url()` (`playwright/tests/orders.spec.ts:183-185`).
- Suggested fix: If tighter sharing is desired later, build a canonical path-only URL via `orderUrl(order.id)` at copy time (PRD currently out of scope). No change required for current spec.

### F-002 [WARNING] Optional `url` prop copies arbitrary strings without validation

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:6-8, 17-18`; `src/hooks/useClipboard.ts:13-15`
- Description: The exported `url?: string` prop is forwarded verbatim to `navigator.clipboard.writeText` with no scheme, origin, or length checks. Production integration does not pass it, but the public API could copy misleading off-origin URLs if a future caller supplies untrusted input. Empty string `""` is copied as-is (`??` does not treat empty string as missing).
- Evidence: `OrderDetailsPage.tsx:211` renders `<OrderCopyLinkButton />` with no `url`; unit test confirms arbitrary absolute URL passthrough (`OrderCopyLinkButton.test.tsx:40-56`).
- Suggested fix: Restrict `url` to same-origin dashboard paths in production code paths, or make the prop Storybook-internal (e.g. rename/document as test-only) and validate `new URL(url, window.location.origin)` before write.

### F-003 [WARNING] Failed re-copy after prior success leaves stale success UI

- Location: `src/hooks/useClipboard.ts:16-28`
- Description: On clipboard write rejection, the `.catch` handler logs a warning but does not reset `copied` to `false`. If the user already has `copied === true` from an earlier success (within the 2s window) and a subsequent click fails (permission revoked, secure-context loss), the button continues to show “Order link copied” while the latest write did not execute. On shared machines this increases the chance an operator pastes stale clipboard content believing a fresh copy succeeded.
- Evidence: Success path sets `setCopyStatus(true)` (`useClipboard.ts:18`); catch path only `console.warn` (`useClipboard.ts:26-28`); rejection test covers initial failure with `copied === false` only (`useClipboard.test.ts:202-224`), not failure-after-success.
- Suggested fix: In the `.catch` block, call `clear()` and `setCopyStatus(false)` (and optionally surface user-visible failure consistent with `useClipboardCopy.ts`).

## Files / sections inspected

### Touched / feature files

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; copies `url ?? window.location.href` via `useClipboard`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button; static i18n labels only (URL never rendered in DOM).
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n strings; no dynamic URL interpolation.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only wrapper; no clipboard side effects.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook states; `SAMPLE_ORDER_URL` is demo placeholder only.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — unit tests mock hook; covers copy invocation and a11y live region.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — visually hidden live region styling.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only pseudo-state CSS.
- `src/hooks/useClipboard.ts` — shared clipboard hook; adds `copyGeneration`, clears prior timer on success.
- `src/hooks/useClipboard.test.ts` — timer, rejection, rapid re-copy tests.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth`; backward-compatible defaults.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — parent host; renders `<OrderCopyLinkButton />` before metadata button with no `url`/`disabled` props.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — placement test with mocked `useClipboard`.
- `docs/DEV-85/prd.md` — ACs: copy `window.location.href`, clipboard failure behavior, no backend changes.
- `docs/DEV-85/tech-plan.md` — architecture, query-param risk accepted, no new packages.
- `docs/DEV-85/ui-design.md` — (referenced via PRD alignment) visual/interaction spec.

### Call sites of new/changed exports

| Export | Call sites | Contract respected? |
|--------|------------|---------------------|
| `OrderCopyLinkButton` | `OrderDetailsPage.tsx:211` — production host, no props | Yes — uses `window.location.href` fallback |
| `OrderCopyLinkButton` | `OrderCopyLinkButton.stories.tsx:67` — passes `url={SAMPLE_ORDER_URL}` | Yes for Storybook; demo URL only |
| `OrderCopyLinkButton` | `OrderCopyLinkButton.test.tsx:23,46,66,89` — tests | Yes — exercises default and explicit `url` |
| `OrderCopyLinkButtonContent` | `OrderCopyLinkButton.tsx:22-27` — container wiring | Yes — passes `copied`, `copyGeneration`, `onCopy` |
| `OrderCopyLinkButtonContent` | `OrderCopyLinkButtonStoryPreview.tsx:32` — story preview | Yes — presentational only |
| `OrderCopyLinkButtonContent` | `OrderCopyLinkButton.stories.tsx:43,61` — Disabled/Copied stories | Yes |
| `OrderCopyLinkButtonContent` | `OrderCopyLinkButton.test.tsx:106,117` — live-region remount test | Yes |
| `OrderCopyLinkButtonStoryPreview` | `OrderCopyLinkButton.stories.tsx:31,35,39` — Hover/Focus/Active | Yes — story-only |
| `OrderCopyLinkButtonStoryInteractionState` (type) | `OrderCopyLinkButtonStoryPreview.tsx:4,13` — internal type map | Yes — story-only |
| `messages` | `OrderCopyLinkButtonContent.tsx:26-27,49` | Yes — static strings |
| `useClipboard` (changed signature) | `OrderCopyLinkButton.tsx:15` — uses 3-tuple | Yes |
| `useClipboard` | `CopyableText.tsx:14`, `TrackingNumberDisplay.tsx:16`, `PspReference.tsx:19`, `OrderCustomer.tsx:132-134`, `ChannelForm.tsx:95`, `GiftCardCreateDialogCodeContent.tsx:21` — 2-tuple destructuring | Yes — extra return element ignored |
| `useClipboard` | `CopyableText.test.tsx`, `OrderCustomer.test.tsx`, `OrderDetailsPage.test.tsx` — mocks updated to 3-tuple | Yes |
| `ClipboardCopyIcon` (changed props) | `OrderCopyLinkButtonContent.tsx:35-39` — passes `iconSize.medium` | Yes |
| `ClipboardCopyIcon` | `TrackingNumberDisplay.tsx:56` — default size 16 | Yes — backward compatible |

### Parent / host components read

- `OrderDetailsPage.tsx:205-233` — TopNav host; `<OrderCopyLinkButton />` with no props while `order` is in scope; button always rendered in same TopNav block as metadata (not gated on `loading`).
- `src/index.tsx:248-251,335-340` — app auth shell; orders route requires `MANAGE_ORDERS`; unauthenticated users get `Auth`.
- `src/auth/components/SectionRoute.tsx:18-38` — permission gate returns `NotFound` when lacking permissions.

### Integration dependencies read

- `src/orders/urls.ts:192-235` — `orderPath` / `orderUrl` with `encodeURIComponent`; not used by copy button (copies live URL instead).
- `src/orders/index.tsx:82-87` — route decodes order id from path.
- `src/utils/handlers/dialogActionHandlers.ts:39-46` — modal actions push query params into URL.
- `src/legacy-sdk/apollo/client.ts:99-104` — bearer token on request headers, not URL.
- `src/legacy-sdk/core/storage.ts:35-47` — tokens in memory/localStorage, not URL.
- `src/components/CopyableText/CopyableText.tsx` — sibling clipboard pattern comparison.
- `src/extensions/.../useClipboardCopy.ts:25-33` — alternate clipboard helper with user-visible error notify.

### Tests overlapping

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — copy payload, labels, live region.
- `src/hooks/useClipboard.test.ts` — rejection, timers, rapid re-copy.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:91-108` — DOM order vs metadata button.
- `playwright/tests/orders.spec.ts:155-190` — E2E clipboard success with pre-granted permissions; asserts full `page.url()`.
