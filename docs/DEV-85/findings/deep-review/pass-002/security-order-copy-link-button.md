---
agent: step-7-deep-security-order-copy-link-button-pass-2
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
verdict: pass
---

## Summary

Pass-2 security review of the order-copy-link-button area finds no BLOCKER, SHOULD-FIX, or WARNING issues. The cumulative diff adds a TopNav clipboard convenience control (copying `window.location.href`), a shared `useClipboard` timer fix, aria-live success feedback with static i18n text, and placement/E2E tests. No new dependencies, secrets, dangerous DOM/eval patterns, or auth bypass surfaces were introduced. Copied URLs remain behind existing staff session + `MANAGE_ORDERS` route gates; clipboard payload exposure matches explicit PRD scope (same as manual address-bar copy).

## Findings

## Justification

This is a non-trivial feature diff from a correctness/UX perspective, but pass-2 security delta is narrow: timer hardening, static SR announcement, and test coverage. Independent review against all six adversarial prompts found no merge-blocking security defects.

**Prompt 1 — sibling pattern comparison:** Grepped `useClipboard` consumers (`CopyableText`, `OrderCustomer`, `TrackingNumberDisplay`, `PspReference`, `GiftCardCreateDialogCodeContent`) and `orders/urls.ts` helpers. The copy button follows the established pattern of passing raw strings to `navigator.clipboard.writeText` via `useClipboard.ts:12-14` with no sanitization — consistent with siblings. Unlike `OrderCustomer` (which copies email/phone PII), this feature copies only the browser URL. Production does not call `orderUrl()` / `encodeURIComponent`; it snapshots `window.location.href` per PRD. No dangerous drift from sibling URL helpers because the feature intentionally avoids constructing URLs.

**Prompt 2 — PRD runtime security trace:** Traced click → `handleCopy` (`OrderCopyLinkButton.tsx:17-18`) → `writeText(window.location.href)` → success/failure paths. Auth tokens live in memory/localStorage (`legacy-sdk/core/storage.ts:19-47`), not in URLs. Query-param inclusion in copied href is explicit PRD/tech-plan acceptance. Failure path logs fixed warning without echoing URL (`useClipboard.ts:24-25`); success UI tied to clipboard API resolution only. aria-live and labels use static i18n (`OrderCopyLinkButtonContent.tsx:45-48`, `messages.ts`) — URL never rendered in DOM.

**Prompt 3 — absent safeguards:** Noted missing `url` prop validation, canonical URL stripping, component-level `RequirePermissions`, and clipboard-permission UI — all either pre-existing dashboard patterns, explicit PRD out-of-scope items, or latent API surface unused in production (`OrderDetailsPage.tsx:211` passes no props). None constitute a new vulnerability in the shipped integration path.

**Prompt 4 — adversarial inputs:** Production always copies current document URL; `url` prop (tests/Storybook only) could copy arbitrary strings including `javascript:`/`data:` schemes, but `writeText` treats input as plain text with no navigation/eval sink. Special-character order IDs, long URLs, unicode, and concurrent clicks affect clipboard contents only as opaque text. Permission denial keeps `copied` false with no URL in logs. Concurrent rapid copies now correctly reset timers (`useClipboard.ts:16-17` pass-2 fix) without changing security posture.

**Prompt 5 — attacker model:** Traced route stack: unauthenticated → login (`index.tsx:335-340`); non-staff rejected (`useAuthProvider.ts:257`); `/orders` requires `MANAGE_ORDERS` (`index.tsx:248-251`, `SectionRoute.tsx:38`). Shared pasted links are not bearer credentials — recipient needs independent staff session + backend `order(id:)` authorization. IDOR boundary is backend-side (pre-existing). Feature adds no privilege escalation, no token issuance, and smaller clipboard exposure than sibling PII copy controls.

**Prompt 6 — failure modes:** Pass-2 `clear()` before timer reschedule fixes UX race without widening data exposure. Shared-hook change affects all `useClipboard` consumers uniformly; OrderCustomer email copy behavior unchanged in payload, only timer semantics. aria-live announces static "Order link copied" — no sensitive URL content. Extension `useClipboardCopy` token-flow issues are out of this area's diff and hook.

**Mechanical checks:** dep-audit skip (no manifest changes); secrets-scan pass; dangerous-patterns pass (no eval/innerHTML/dangerouslySetInnerHTML in area); auth-boundary pass (route + permission gates verified).

## Files / sections inspected

### Touched files (implementation)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; copies `url ?? window.location.href` via `useClipboard`; optional `url` unused in production.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button; static i18n labels; aria-live with static success message only.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n strings; no dynamic/URL content.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only wrapper; no clipboard logic.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook states; `SAMPLE_ORDER_URL` fixture only.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — mocks `useClipboard`; no real clipboard integration.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — visually-hidden aria-live styling.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only CSS overrides.
- `src/hooks/useClipboard.ts` — pass-2 adds `clear()` before timer reschedule; write-only clipboard API; fixed failure warning.
- `src/hooks/useClipboard.test.ts` — rapid re-copy timer regression + rejection handling tests.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional size/strokeWidth props; no data handling.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-211` — production host; renders `<OrderCopyLinkButton />` with no props before metadata button.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — placement test; mocks `useClipboard`.
- `playwright/pages/ordersPage.ts:62-63` — page object selectors for copy/metadata buttons.
- `playwright/tests/orders.spec.ts:155-178` — E2E placement + success affordance; no clipboard content assertion.
- `locale/defaultMessages.json` — i18n entries for copy-link messages.
- `docs/DEV-85/prd.md` — scope confirms full-href copy, no backend changes.
- `docs/DEV-85/tech-plan.md` — architecture, accepted query-param risk.

### Export call sites

- `OrderCopyLinkButton` — exported in `OrderCopyLinkButton.tsx:11`; production call site: `OrderDetailsPage.tsx:211` (no props — contract respected). Test/story call sites: `OrderCopyLinkButton.test.tsx:22,45,65,88`; `OrderCopyLinkButton.stories.tsx:67`. All respect optional-prop contract.
- `OrderCopyLinkButtonContent` — exported in `OrderCopyLinkButtonContent.tsx:16`; callers: `OrderCopyLinkButton.tsx:21` (wires `onCopy`), `OrderCopyLinkButtonStoryPreview.tsx:32` (story, no `onCopy`), stories direct renders. Production path always passes `onCopy` via container.
- `OrderCopyLinkButtonStoryPreview` — exported in `OrderCopyLinkButtonStoryPreview.tsx:21`; callers: stories only (`OrderCopyLinkButton.stories.tsx:31,35,39`). No production callers.
- `OrderCopyLinkButtonStoryInteractionState` — type export; story-only consumers.
- `messages` — exported from `messages.ts:3`; consumed by `OrderCopyLinkButtonContent.tsx:7`.
- `useClipboard` — modified export; 8+ existing consumers unchanged in signature; pass-2 timer fix is behavior-only.
- `ClipboardCopyIcon` — modified with optional props; callers: `OrderCopyLinkButtonContent.tsx:33`, `TrackingNumberDisplay.tsx:56` (defaults preserved).

### Parent / host components

- `OrderDetailsPage.tsx:210-219` — TopNav host renders `<OrderCopyLinkButton />` before metadata button; no `url`/`disabled` props; order may be loading but button does not dereference order data.
- `OrderDetailsPage` route wrapper `orders/index.tsx:82-87` — decodes path `:id`, parses query params; auth upstream of page render.
- `TopNav` (via `OrderDetailsPage`) — standard app layout; no additional auth on child actions.

### Integration sites

- `src/hooks/useClipboard.ts` — write-only Clipboard API; failure logs fixed string; pass-2 timer `clear()`.
- `src/auth/components/SectionRoute.tsx:18-38` — `MANAGE_ORDERS` permission gate for `/orders`.
- `src/auth/hooks/useAuthProvider.ts:257` — staff-only `authenticated` flag.
- `src/index.tsx:248-251` — orders section permission wrapper.
- `src/orders/views/OrderDetails/OrderDetails.tsx:62-68` — null order → NotFound.
- `src/legacy-sdk/core/storage.ts:19-47` — tokens not in URLs.
- `src/orders/urls.ts:192,234-235` — sibling URL encoding helpers (feature uses href snapshot instead).
- `src/components/CopyableText/CopyableText.tsx:45` — sibling clipboard pattern comparison.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — component tests with mocked hook.
- `useClipboard.test.ts` — hook timer/rejection tests including pass-2 regression.
- `OrderDetailsPage.test.tsx` — TopNav placement order test.
- `playwright/tests/orders.spec.ts:155-178` — E2E presence/feedback test.
- `CopyableText.test.tsx`, `OrderCustomer.test.tsx` — sibling clipboard test patterns (mock hook).
