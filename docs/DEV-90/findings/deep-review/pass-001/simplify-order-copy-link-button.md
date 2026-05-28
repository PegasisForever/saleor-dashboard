---
agent: step-7-deep-simplify-order-copy-link-button-pass-1
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
verdict: pass
---

## Summary

The order-copy-link-button implementation is small and correctly reuses `useClipboard`, `ClipboardCopyIcon`, `orderUrl`, and `getAppMountUriForRedirect`. Simplify findings are WARNING-tier only: Storybook-only `force*` props and paired CSS force classes add production API and stylesheet surface that is unique in the repo; story fixtures duplicate `TopNav.stories.tsx`; and `getShareableOrderUrl` is a single-caller helper colocated in the component folder rather than beside `orderUrl` in `urls.ts`. No BLOCKERs from this angle.

## Findings

### F-001 [WARNING] Storybook `force*` props leak into production component API

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-18`, `24-27`, `36`, `46-50`
- Description: Four optional props (`forceCopied`, `forceHovered`, `forceActive`, `forceFocused`) exist solely to pin visual states in Storybook. They are the only `force*` props on any production component export in `src/`; production `OrderDetailsPage` never passes them.
- Trigger: A developer opens `OrderCopyLinkButton` props in the IDE or passes `forceCopied={true}` while debugging integration outside Storybook.
- Impact: Production component contract looks like it supports manual state override; integrators may assume `forceCopied` drives clipboard success without calling `useClipboard`, producing a check icon and “Order link copied” label with nothing in the clipboard.
- Evidence: Grep `forceCopied|forceHovered|forceActive|forceFocused` under `src/**/*.tsx` returns only `OrderCopyLinkButton.tsx` and `OrderCopyLinkButton.stories.tsx`. `OrderDetailsPage.tsx:211` passes only `orderId`.
- Suggested fix: Move visual pinning to a story-only wrapper (e.g. `OrderCopyLinkButtonStory` with `data-force-*` attributes) or Storybook pseudo-state tooling so `OrderCopyLinkButton` exports only `orderId` and optional `disabled`.

### F-002 [WARNING] CSS pseudo-state rules duplicated for Storybook force classes

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-39`
- Description: Hover, focus, and active styling is declared twice—once for real pseudo-classes (`.button:hover`, `:focus-visible`, `:active`) and again for `.buttonForceHover`, `.buttonForceActive`, `.buttonForceFocus` (plus matching `svg` rules). Any design tweak must be applied in two places.
- Trigger: Designer or engineer updates active-state contrast in `.button:active:not(:disabled) svg` but forgets `.buttonForceActive svg`.
- Impact: Storybook `Active` / `Hover` / `Focus` stories drift from production button appearance; reviewers approve stale visuals while production changes.
- Evidence: Lines `1:3` vs `24:26` (hover bg), `5:8` vs `36:39` (focus outline), `10:17` vs `28:34` (active bg + icon). Force classes exist only in this module.
- Suggested fix: Share declarations via CSS custom properties on `.button` (set once, read in both pseudo and `[data-force-active]` selectors) or drop force classes and use Storybook interaction/pseudo addons so production CSS stays a single rule set.

### F-003 [WARNING] Duplicated Storybook `UserContext` fixtures

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:14-40`, `86-91`; compare `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-47`
- Description: `mockUser` and `mockUserContext` are copy-pasted verbatim between `OrderCopyLinkButton.stories.tsx` and `TopNav.stories.tsx`. `InOrderDetailsTopNav` adds a local decorator while `TopNav` stories apply the same provider at meta level.
- Trigger: Staff user fixture fields change (e.g. `UserFragment` shape) and only one story file is updated.
- Impact: `InOrderDetailsTopNav` composition story breaks or renders with stale auth context while `TopNav` stories still work—silent Storybook-only regression.
- Evidence: Byte-identical fixture blocks at `OrderCopyLinkButton.stories.tsx:14-37` and `TopNav.stories.tsx:11-37`.
- Suggested fix: Extract `mockUser` / `mockUserContext` and a `withUserContext` decorator to a shared Storybook helper (e.g. under `src/storybook/` or `.storybook/decorators/`) and reuse in both story files.

### F-004 [WARNING] Single-caller URL helper in component folder vs `urls.ts` convention

- Location: `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:1-9`; `docs/DEV-90/project-context.md:41`
- Description: `getShareableOrderUrl` is a 4-line composition of existing helpers with one caller (`OrderCopyLinkButton.tsx:33`). Project context documents URL helpers in feature `urls.ts` (e.g. `orderUrl`). Auth already names a parallel absolute helper (`getNewPasswordResetRedirectUrl` in `auth/utils.ts:108-109`).
- Trigger: Another surface needs a shareable order URL; engineer searches `urls.ts`, misses the helper under `OrderCopyLinkButton/`, and reimplements `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderUrl(id))`.
- Impact: Duplicate absolute-URL builders diverge over time (e.g. one strips trailing `?`, one does not).
- Evidence: `git grep getShareableOrderUrl` → only `getShareableOrderUrl.ts` and `OrderCopyLinkButton.tsx`. Parallel pattern at `auth/utils.ts:108-109`.
- Suggested fix: Move `getShareableOrderUrl` next to `orderUrl` in `src/orders/urls.ts` (or add `getAbsoluteDashboardUrl(relativePath)` in `src/utils/urls.ts` if multiple domains need it). Alternatively inline the one-liner into `handleCopy` if the team prefers zero extra files for a single call site.

### F-005 [WARNING] Unnecessary `useCallback` on one-line copy handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:32-34`, `53`
- Description: `handleCopy` only calls `copy(getShareableOrderUrl(orderId))` and is memoized with `useCallback`. Sibling clipboard buttons (`TrackingNumberDisplay.tsx:57`, `PspReference.tsx:105`) use inline `onClick={() => copy(...)}` without `useCallback`.
- Trigger: Always (every render allocates callback only when deps unchanged—marginal).
- Impact: No user-visible effect; slightly more code and import surface (`useCallback`) than neighboring copy controls.
- Evidence: `OrderCopyLinkButton.tsx:32-34` vs `TrackingNumberDisplay.tsx:57` `onClick={() => copy(trackingNumber)}`.
- Suggested fix: Use inline `onClick={() => copy(getShareableOrderUrl(orderId))}` and drop `useCallback` import unless profiling shows TopNav re-render cost matters.

## Files / sections inspected

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — clipboard flow, `force*` props, `useCallback`, i18n labels
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — absolute URL composition
- `src/orders/components/OrderCopyLinkButton/messages.ts` — `orderCopyLinkButtonMessages` catalog
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — pseudo + force class duplication
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories, TopNav composition, mock user boilerplate
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:38,210-232` — parent wire-up: `{order?.id ? <OrderCopyLinkButton orderId={order.id} /> : null}` before metadata button; matches PRD guard
- `src/hooks/useClipboard.ts` — 2s feedback contract, no error UI
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — shared icon swap
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — nearest sibling copy-button pattern
- `src/orders/components/OrderTransaction/.../PspReference.tsx` — alternate inline-icon clipboard pattern
- `src/orders/urls.ts:234-235` — `orderUrl` encoding + trailing `?`
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect`
- `src/auth/utils.ts:108-109`, `src/staff/views/StaffList/StaffList.tsx:140-144` — parallel absolute `urlJoin` patterns
- `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-47` — duplicate mock user fixtures
- `docs/DEV-90/prd.md`, `tech-plan.md`, `ui-design.md`, `project-context.md` — acceptance criteria and architecture
- `git diff 45b5cef8f4ddd1d99d7a2a497bb055d6bb3f2634..HEAD -- src/orders/components/OrderCopyLinkButton/ src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — full area delta

### Call sites of new exports

| Export | Call sites | Contract note |
|--------|------------|---------------|
| `OrderCopyLinkButton` | `OrderDetailsPage.tsx:211` — `orderId={order.id}` when `order?.id` truthy; respects optional order | OK |
| `OrderCopyLinkButton` | `OrderCopyLinkButton.stories.tsx:95` — fixture `orderId="T3JkZXI6MQ=="` | OK (Storybook) |
| `getShareableOrderUrl` | `OrderCopyLinkButton.tsx:33` only — no other repo callers per `git grep getShareableOrderUrl` | OK |
| `orderCopyLinkButtonMessages` | `OrderCopyLinkButton.tsx:9,38-40` only | OK |

### Parent / host components read

- `OrderDetailsPage.tsx:210-232` — TopNav host; conditional render avoids missing-id case; copy button before metadata `Button` with matching `variant="secondary"` and `marginRight={3}`

### Tests overlapping

- No `*.test.*` references `OrderCopyLinkButton`, `getShareableOrderUrl`, or `copy-order-link` (grep over repo)
- `src/hooks/useClipboard.test.ts` — covers hook only, not URL builder or TopNav integration
