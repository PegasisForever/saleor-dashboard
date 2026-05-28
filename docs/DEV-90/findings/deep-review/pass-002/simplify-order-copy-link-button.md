---
agent: step-7-deep-simplify-order-copy-link-button-pass-2
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
verdict: pass
---

## Summary

Pass-2 remediation (aria-live region, unit tests, `useClipboard` timer fix, `key={order.id}`) keeps the feature small and correctly reuses `useClipboard`, `ClipboardCopyIcon`, `orderUrl`, and `urlJoin`. Simplify findings remain WARNING-tier only: Storybook-only `force*` props and mirror CSS inflate the production API/stylesheet, test and story fixtures duplicate nearby patterns, `getShareableOrderUrl` is a single-caller module beside domain URL helpers, and pass-2 adds minor redundant `formatMessage` / ineffective `useCallback` noise. No BLOCKERs.

## Findings

### F-001 [WARNING] Storybook `force*` props and mirror CSS duplicate pseudo-state rules on the production component

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-18,47-51`; `OrderCopyLinkButton.module.css:1-17,24-38`
- Description: Four optional `forceHovered` / `forceFocused` / `forceActive` / `forceCopied` props and paired `.buttonForce*` classes mirror the real `:hover`, `:focus-visible`, and `:active` rules in the same CSS module. Only Storybook stories consume these props; production passes `orderId` only.
- Trigger: Maintainer updates hover/focus/active styling and must edit both the pseudo-class block and the `.buttonForce*` mirror block to keep Storybook snapshots aligned.
- Impact: No end-user-visible regression; extra production props/CSS surface and drift risk between paired rule sets.
- Evidence: `OrderDetailsPage.tsx:211` renders `<OrderCopyLinkButton key={order.id} orderId={order.id} />` with no force props. Stories at `OrderCopyLinkButton.stories.tsx:55-82` are the sole `force*` call sites. UI design documents the tradeoff (`docs/DEV-90/ui-design.md:51`) but the repo has no `@storybook/addon-pseudo-states` (`.storybook/main.ts:5`).
- Suggested fix: Pin visual states in a story-only wrapper (e.g. `data-force-hover` + attribute selectors) or add a pseudo-state Storybook addon so production props stay `{ orderId, disabled? }`.

### F-002 [WARNING] `getShareableOrderUrl` is a single-caller helper colocated under the component folder

- Location: `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8`; `src/orders/urls.ts:234-235`
- Description: A four-line absolute-URL builder wraps existing `orderUrl` + `urlJoin(origin, mount, path)` but lives in the component directory with its own 77-line test file. Relative order paths and sibling URL helpers already live in `src/orders/urls.ts`; auth uses the same absolute-URL recipe in `src/auth/utils.ts:108-109`.
- Trigger: N/A — structural placement; no runtime trigger.
- Impact: No user-visible effect; adds an extra module and test file for logic that sits next to `orderUrl` by domain convention.
- Evidence: `git grep getShareableOrderUrl` shows one production caller (`OrderCopyLinkButton.tsx:33`) plus co-located tests. Parallel pattern: `getNewPasswordResetRedirectUrl` in `auth/utils.ts`, not beside its route helper file.
- Suggested fix: Move `getShareableOrderUrl` next to `orderUrl` in `src/orders/urls.ts`, or inline `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderUrl(orderId))` in `handleCopy` if the dedicated test module is dropped.

### F-003 [WARNING] Storybook `mockUser` / `mockUserContext` fixtures duplicated from `TopNav.stories.tsx`

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:14-40`; `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-37`
- Description: Identical `UserFragment` and `UserContextType` fixtures are copy-pasted into the OrderCopyLinkButton composition stories, and `InOrderDetailsTopNav` re-declares a `UserContext.Provider` decorator that TopNav stories already apply at meta level.
- Trigger: A future Storybook user fixture change (new required field on `UserFragment`) requires updating both files or stories break independently.
- Impact: No production impact; maintenance duplication only.
- Evidence: Byte-identical fixture blocks at the cited line ranges; `InOrderDetailsTopNav` decorator at `OrderCopyLinkButton.stories.tsx:86-91` duplicates `TopNav.stories.tsx:42-47`.
- Suggested fix: Export shared fixtures from `src/storybook/` or `@test/*` and import into both story files.

### F-004 [WARNING] Twin test files repeat identical mock/setup boilerplate and overlap URL assertions

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:11-46,48-67`; `getShareableOrderUrl.test.ts:5-37,39-76`
- Description: Both files duplicate the `getAppMountUriForRedirect` Jest mock and the `window.location` `defineProperty` stub/teardown. The button click test imports `getShareableOrderUrl` and asserts `mockCopy` receives its output — re-exercising URL composition already covered by three dedicated helper tests.
- Trigger: N/A — maintainability when adding a fourth mount/origin scenario.
- Impact: No user-visible effect; duplicated ~30 lines per file and redundant test maintenance when URL shape changes.
- Evidence: Parallel mock blocks at cited lines; click test at `OrderCopyLinkButton.test.tsx:55-67` vs helper cases at `getShareableOrderUrl.test.ts:39-76`. No shared helper under `@test/*` for this location stub pattern.
- Suggested fix: Extract a `setupDashboardOriginMock()` helper; in the button test assert `mockCopy` was called once with a string matching `/orders/` rather than re-importing the URL builder.

### F-005 [WARNING] `useCallback` on `handleCopy` does not stabilize the handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:32-34`; `src/hooks/useClipboard.ts:12-27`
- Description: `handleCopy` is wrapped in `useCallback` with `[copy, orderId]` deps, but `useClipboard` returns a new `copy` function every render (not memoized inside the hook). The callback is therefore recreated every render anyway.
- Trigger: Component renders in TopNav on every parent re-render (e.g. form state updates in `OrderDetailsPage` render prop).
- Impact: No observable user effect; unnecessary `useCallback` import and mental overhead. Peer copy buttons use inline handlers (`TrackingNumberDisplay.tsx:57`, `PspReference.tsx:105`).
- Evidence: `const copy = (text: string): void => { ... }` inside hook body without `useCallback`.
- Suggested fix: Drop `useCallback` and use `onClick={() => copy(getShareableOrderUrl(orderId))}`.

### F-006 [WARNING] Copied-state message formatted twice when aria-live region renders (pass-2 addition)

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,60-62`
- Description: When `isCopied` is true, `label` already holds `intl.formatMessage(messages.orderLinkCopied)` for `title`/`aria-label`, but the status region calls `formatMessage` on the same message id again.
- Trigger: User clicks the copy button once; clipboard write succeeds; copied state lasts ~2 s.
- Impact: No user-visible difference (same string both times); redundant intl work on each copied render.
- Evidence: `label` assignment at lines 38-40; status span at lines 60-62 uses separate `formatMessage(messages.orderLinkCopied)`.
- Suggested fix: Render `{label}` inside the status region when `isCopied`, or assign `const copiedLabel = intl.formatMessage(messages.orderLinkCopied)` once when copied.

## Files / sections inspected

### Touched files (coordinator pass-2 scope)

- `src/hooks/useClipboard.ts:16` — pass-2 `clear()` before timer reschedule; shared hook fix, not an abstraction target.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — production component; force props, useCallback, duplicate formatMessage.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — pseudo + force mirror rules; hand-rolled sr-only `.statusRegion`.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — single-caller URL helper.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two-message i18n catalog.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — force* stories, duplicated fixtures, TopNav composition.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — click + aria-live tests; duplicated setup.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — URL builder tests; duplicated setup.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — production integration with optional chaining + `key={order.id}`.

### Export call sites

- `OrderCopyLinkButton` — production: `OrderDetailsPage.tsx:211` (`order?.id` guard, passes `orderId={order.id}`; contract respected). Stories: `OrderCopyLinkButton.stories.tsx:95`. Tests: `OrderCopyLinkButton.test.tsx:59,77`.
- `getShareableOrderUrl` — production: `OrderCopyLinkButton.tsx:33` only. Tests: `getShareableOrderUrl.test.ts:46,59,72`; imported for assertion in `OrderCopyLinkButton.test.tsx:55`.
- `orderCopyLinkButtonMessages` — exported from `messages.ts`; consumed only inside `OrderCopyLinkButton.tsx:9,38-40,62` (no external callers per `git grep orderCopyLinkButtonMessages`).

### Parent / host components

- `OrderDetailsPage.tsx:210-219` — renders copy button before metadata `Button` inside `TopNav`; gated on `order?.id`; `key={order.id}` remounts clipboard state on order navigation.
- `OrderNormalDetails/index.tsx:201` — passes loaded order into `OrderDetailsPage` (read import/call site; wire-up inherits page-level guard).
- `OrderUnconfirmedDetails/index.tsx:201` — same host pattern as normal details.

### Integration dependencies read

- `src/hooks/useClipboard.ts` — 2s copied timer; `copy` not memoized.
- `src/orders/urls.ts:234-235` — `orderUrl` with `encodeURIComponent` + trailing `?`.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — shared copy/check icon primitive.
- `src/components/CopyableText/CopyableText.tsx` — generic copy pattern (static label, inline icons).
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — orders-domain copy button peer (inline onClick, static aria-label).
- `src/auth/utils.ts:108-109` — parallel absolute-URL composition via `urlJoin`.
- `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-47` — fixture source duplicated by OrderCopyLinkButton stories.

### Tests overlapping this area

- `OrderCopyLinkButton.test.tsx` — click path + aria-live status region.
- `getShareableOrderUrl.test.ts` — URL shape/mount/encoding cases.
- `src/hooks/useClipboard.test.ts` — hook timer/clear behavior (read grep hit; not duplicated in component tests).

### Planning artifacts

- `docs/DEV-90/prd.md` — acceptance criteria for TopNav placement, reuse of existing hook/icon, no toast.
- `docs/DEV-90/tech-plan.md` — architecture map; `getShareableOrderUrl` file placement.
- `docs/DEV-90/ui-design.md:51` — documents intentional `force*` Storybook props.
