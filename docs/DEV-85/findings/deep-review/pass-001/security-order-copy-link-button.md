---
agent: step-7-deep-security-order-copy-link-button-pass-1
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
verdict: pass
---

## Summary

Security review of the order-copy-link-button feature finds no BLOCKER or SHOULD-FIX issues. The button copies `window.location.href` via the existing `useClipboard` hook behind established session, staff, and `MANAGE_ORDERS` route guards. The diff adds no dependencies, no secrets, no dangerous DOM/eval patterns, and no new auth bypass. Residual clipboard/query-string exposure is explicit PRD scope (same as manual address-bar copy) and does not introduce a new attack surface.

## Findings

(none)

## Justification

**Mechanical checks:** `package.json` / `pnpm-lock.yaml` have zero diff lines since pipeline-start (`git diff 45b5cef8..HEAD -- package.json pnpm-lock.yaml` → empty). Area diff grep found no hardcoded credentials; only benign matches (`Reset password` i18n context line, CSS comment "token snapshots"). No `dangerouslySetInnerHTML`, `eval`, `innerHTML`, or shell/exec patterns in scoped source diff.

**Sibling-pattern / consistency (prompt 1):** Grepped `useClipboard` consumers (`CopyableText`, `TrackingNumberDisplay`, `OrderCustomer`, `PspReference`, `GiftCardCreateDialogCodeContent`). All pass arbitrary strings to the same hook with no sanitization — `OrderCopyLinkButton` follows that established pattern. Unlike URL helpers in `src/orders/urls.ts:234-235`, production does not construct URLs from order IDs; it snapshots `window.location.href`, which is PRD-specified (`docs/DEV-85/prd.md:11-12`). No encodeURIComponent drift applies because no path segment is assembled in this feature.

**PRD runtime trace (prompt 2):** Production integration at `OrderDetailsPage.tsx:211` renders `<OrderCopyLinkButton />` with no `url` prop, so runtime always calls `copy(window.location.href)` (`OrderCopyLinkButton.tsx:17-18`). Auth tokens live in memory/localStorage (`src/legacy-sdk/core/storage.ts:19-46`), not in order-detail URLs. Clipboard failure is handled in `useClipboard.ts:23-25` with a fixed console warning (no URL echoed); UI stays on default label when `copied === false`.

**Missing safeguards (prompt 3):** Absence of component-level `RequirePermissions`, query-param stripping, and `url` validation were reviewed. Route-level gates (`SectionRoute` + `MANAGE_ORDERS` at `src/index.tsx:248-252`) already restrict who reaches the button; copying a link does not escalate privilege beyond viewing the page. Query-param inclusion and lack of canonical `orderUrl(id)` stripping are documented accepted risks in `docs/DEV-85/tech-plan.md:49` and PRD out-of-scope (`prd.md:17-18`). Optional `url` prop is unused in production (Storybook/tests only per tech plan line 32).

**Adversarial inputs (prompt 4):** Considered empty/`javascript:`/`data:` strings via `url` prop — would copy verbatim, but no production caller passes `url`. `url ?? window.location.href` means `url=""` copies empty string, not href; unreachable in prod. Long URLs, unicode/RTL, and concurrent clicks inherit pre-existing `useClipboard` behavior shared across the dashboard; not introduced by this diff.

**Attacker model (prompt 5):** Shared pasted URLs require separate authenticated staff session with `MANAGE_ORDERS`; URL is not a bearer credential. Same-origin XSS could spoof `window.location.href` before click — a pre-existing dashboard concern, not a new sink (no `innerHTML`, no link navigation). Social-engineering risk from generic labels without URL preview matches manual address-bar copy semantics accepted in PRD.

**Non-mechanical gaps (prompt 6):** `useClipboard` unmount/promise races and silent failure UX are pre-existing hook limitations; `OrderCopyLinkButton.test.tsx` mocks the hook (consistent with `CopyableText.test.tsx`). No security regression vs existing clipboard callers.

## Files / sections inspected

### Touched files (coordinator scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `copy(url ?? window.location.href)`; optional `url`/`disabled` props.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational Macaw button; static i18n labels in `title`/`aria-label`; no URL rendered in DOM.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two react-intl messages; no dynamic URL content.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — mocks `useClipboard`; asserts href/prop passthrough and label/icon states.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook-only; `SAMPLE_ORDER_URL` fixture; composition story with TopNav.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only wrapper; no clipboard logic.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only CSS pseudo-state tokens.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-211` — production parent; `<OrderCopyLinkButton />` with no props before metadata button.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth`; backward-compatible defaults preserved.
- `locale/defaultMessages.json` — two new i18n entries for copy-link strings.

### Call sites of new/changed exports

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (prod, no `url` prop; contract respected). `OrderCopyLinkButton.stories.tsx:67,16` (Storybook with explicit `url`). `OrderCopyLinkButton.test.tsx:22,45,65,83` (tests). No other repo callers per `git grep OrderCopyLinkButton`.
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21` (wires `copied`/`disabled`/`onCopy`). `OrderCopyLinkButtonStoryPreview.tsx:32` (story, no `onCopy`). `OrderCopyLinkButton.stories.tsx:43,61` (presentational stories). Contract respected at all call sites.
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` only; story-only export, no production callers.
- `OrderCopyLinkButtonStoryInteractionState` (type export) — used only within `OrderCopyLinkButtonStoryPreview.tsx`; no external callers.
- `messages` — `OrderCopyLinkButtonContent.tsx:22-23` only.
- `ClipboardCopyIcon` (modified export) — `OrderCopyLinkButtonContent.tsx:30-34` (passes `size`/`strokeWidth`). `TrackingNumberDisplay.tsx:56` (unchanged call, defaults preserved). Contract respected.

### Parent / host components read

- `OrderDetailsPage.tsx:205-219` — renders `<OrderCopyLinkButton />` inside authenticated order-details TopNav; no `url`/`disabled` props; `order` optional elsewhere but button does not dereference `order.id`.
- `OrderCopyLinkButton.stories.tsx:64-77` — TopNav composition story; passes test `url` only.

### Integration dependencies read

- `src/hooks/useClipboard.ts` — `navigator.clipboard.writeText`; 2s timeout; `.catch` logs fixed warning; shared across dashboard.
- `src/index.tsx:165-172,248-252,335-340` — auth shell + `SectionRoute` with `MANAGE_ORDERS`.
- `src/auth/components/SectionRoute.tsx:18-38` — permission gate returns `<NotFound />` when lacking permissions.
- `src/auth/hooks/useAuthProvider.ts:250-258` — staff-only `authenticated`.
- `src/orders/index.tsx:82-87,161` — order detail route; decodes path id.
- `src/orders/urls.ts:192,234-235` — sibling URL helpers (encodeURIComponent at `orderUrl`); contrast with href snapshot approach.
- `src/legacy-sdk/core/storage.ts:19-46` — tokens not stored in URLs.
- `src/components/CopyableText/CopyableText.tsx:45` — sibling clipboard pattern comparison.

### Tests overlapping

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — unit tests for copy handler wiring and visual states (hook mocked).
- `src/hooks/useClipboard.test.ts` — hook-level failure/unmount tests (referenced for clipboard rejection behavior; not modified in this diff).
