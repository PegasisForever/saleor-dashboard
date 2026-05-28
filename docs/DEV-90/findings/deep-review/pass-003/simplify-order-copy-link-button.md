---
agent: step-7-deep-simplify-order-copy-link-button-pass-3
input_branch: 6feae83ec628e0296d8e2a3652c5db5ed4b58877
verdict: pass
---

## Summary

Pass-3 simplify review of the order-copy-link-button area (~509 LOC since anchor `45b5cef8`) finds no BLOCKERs. Production code reuses `useClipboard`, `orderUrl`, `getAppMountUriForRedirect`, and `ClipboardCopyIcon` appropriately; iter-5 added only test assertions (remount guard, copied-state aria/title). Remaining complexity is mostly intentional Storybook visual pinning and pass-2 a11y layering. Six WARNINGs flag simplify opportunities: Storybook `force*` props on the production export with mirrored CSS, a no-op `useCallback`, duplicate `formatMessage` on copied state, a single-caller URL helper with overlapping tests, duplicated story fixtures, and a remount test that overclaims `key={order.id}` behavior.

## Findings

### F-001 [WARNING] Storybook `force*` props leak into production component API

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-18,24-27,47-51`; `OrderCopyLinkButton.module.css:24-38`; `OrderCopyLinkButton.stories.tsx:55-82`
- Description: Four optional `forceCopied` / `forceHovered` / `forceActive` / `forceFocused` props exist solely to pin visual states in Storybook, yet they are declared on the shipped component interface. CSS duplicates every hover/focus/active rule as `.buttonForce*` mirror classes — any styling change must be edited twice.
- Trigger: Engineer opens `OrderCopyLinkButton.tsx` to adjust TopNav copy-button styling or adds a new interactive state; must trace both pseudo-class rules and force-class mirrors, and grep confirms `force*` appears only in this component + stories (no production caller passes them).
- Impact: No user-visible defect; maintainers carry extra props, clsx branches, and ~15 lines of duplicate CSS on every visual tweak.
- Evidence: Production integration passes only `orderId` and `key`: `OrderDetailsPage.tsx:211`. Repo-wide grep for `forceCopied|forceHovered|forceActive|forceFocused` hits only `OrderCopyLinkButton.tsx` and `OrderCopyLinkButton.stories.tsx`.
- Suggested fix: Move visual pinning to a story-only wrapper (e.g., `data-force-*` attribute selectors) or a Storybook pseudo-state addon; keep production props to `{ orderId, disabled? }` and delete `.buttonForce*` classes.

### F-002 [WARNING] `useCallback` on `handleCopy` does not stabilize the handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:32-34`; `src/hooks/useClipboard.ts:12-27`
- Description: `handleCopy` is wrapped in `useCallback` with `[copy, orderId]` deps, but `useClipboard` returns a new `copy` function every render (not memoized inside the hook). The callback is recreated every render anyway.
- Trigger: Always present once the button mounts; any code review or profiler pass that assumes `useCallback` prevents child re-renders is misled.
- Impact: No observable user effect; adds an unnecessary import and mental overhead versus peer copy buttons that use inline `onClick={() => copy(...)}` (`TrackingNumberDisplay.tsx:57`, `PspReference.tsx:105`).
- Evidence:
```32:34:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const handleCopy = useCallback((): void => {
    copy(getShareableOrderUrl(orderId));
  }, [copy, orderId]);
```
```12:27:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      // ... not wrapped in useCallback
  };
```
- Suggested fix: Drop `useCallback` and use an inline handler to match sibling copy buttons, or memoize `copy` inside `useClipboard` if stable references are desired repo-wide.

### F-003 [WARNING] Copied message formatted twice on the same render

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,60-63`
- Description: When `isCopied` is true, `label` already holds `intl.formatMessage(messages.orderLinkCopied)` for `title` and `aria-label`, but the `aria-live` status region calls `formatMessage` again on the same message id.
- Trigger: User clicks copy once; component re-renders with `copied=true` (or Storybook `forceCopied=true`).
- Impact: No user-visible difference; duplicate intl lookup and two sources of truth if message ids diverge later.
- Evidence:
```38:40:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const label = isCopied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
```
```60:63:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
        <span role="status" aria-live="polite" className={styles.statusRegion}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
```
- Suggested fix: Render `{label}` in the status region when copied (or derive `copiedLabel` once and reuse for button attributes and live region).

### F-004 [WARNING] Single-caller `getShareableOrderUrl` module with overlapping test coverage

- Location: `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8`; `getShareableOrderUrl.test.ts`; `OrderCopyLinkButton.test.tsx:55-67`
- Description: A four-line URL helper lives in its own module with a 77-line test file, but has one production caller (`handleCopy`). The button click test re-imports the helper and asserts the exact URL string already covered by three dedicated helper tests. Both test files duplicate identical `getAppMountUriForRedirect` mock and `window.location` stub boilerplate (~30 lines each).
- Trigger: Engineer changes URL composition or mount-uri behavior and must update helper tests plus the button test that duplicates URL assertions, plus two copies of mock setup.
- Impact: No runtime defect; extra files and synchronized edits for a one-liner composition over existing `orderUrl` + `urlJoin` (same recipe inlined in auth/staff at `auth/utils.ts:108-109`, `StaffList.tsx:140-144`).
- Evidence: `git grep getShareableOrderUrl` — production caller only `OrderCopyLinkButton.tsx:33`; tests in same directory only. Button test: `expect(mockCopy).toHaveBeenCalledWith(expectedUrl)` where `expectedUrl = getShareableOrderUrl(orderId)`.
- Suggested fix: Colocate `getShareableOrderUrl` beside `orderUrl` in `src/orders/urls.ts`, or inline the composition in `handleCopy` and assert `mockCopy` was called once without re-testing URL shape; extract shared test setup for dashboard origin mocking.

### F-005 [WARNING] Duplicated Storybook `mockUser` / `UserContext` fixtures

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:14-40,86-91`; `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-37,42-47`
- Description: `InOrderDetailsTopNav` re-declares byte-identical `mockUser` and `mockUserContext` blocks and a local `UserContext.Provider` decorator already present on TopNav stories meta.
- Trigger: Storybook fixture fields change (e.g., new required `UserFragment` field) and both files must be updated in lockstep.
- Impact: No user-visible effect; fixture drift risk between TopNav and OrderCopyLinkButton composition stories.
- Evidence: Side-by-side comparison shows identical `mockUser` object literals; both wrap stories in `UserContext.Provider value={mockUserContext}`.
- Suggested fix: Extract shared story fixtures/decorators (e.g., under `src/storybook/`) and import in both story files.

### F-006 [WARNING] Remount test overclaims `key={order.id}` without exercising real remount semantics

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:91-125`; `OrderDetailsPage.tsx:211`
- Description: Iter-5 added a test titled "resets copied feedback when remounted with a different key (order navigation)" but it flips `mockUseClipboard` from `[true]` to `[false]` between rerenders. With the hook mocked to always return `[true]`, a key-only remount would still show copied state — the test validates mock reset, not `key={order.id}` remount behavior.
- Trigger: Engineer relies on this test as proof that order-to-order navigation clears copied feedback without reading `OrderDetailsPage` integration or running an unmocked hook test.
- Impact: False confidence in navigation reset coverage; test comment and title mislead maintainers about what is under test.
- Evidence: Test comment at line 110 references `key={order.id}`; act block at lines 111-112 explicitly changes mock return before rerender with `key={orderIdB}`.
- Suggested fix: Test with real `useClipboard` + fake timers (click → navigate rerender with new key → assert default label), integrate at `OrderDetailsPage` level, or rename test to reflect mock-driven state change only.

## Files / sections inspected

### Touched files (coordinator starting scope)

- `src/hooks/useClipboard.ts:16` — iter-4 `clear()` before reset timer; shared hook contract for copy feedback
- `src/hooks/useClipboard.test.ts:105-141` — rapid re-copy timer test validating hook fix used by button
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — main component; force* props, label/live-region duplication, useCallback
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — pseudo + force mirror classes, sr-only statusRegion
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — force* story args, duplicated fixtures, TopNav composition
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — iter-5 copied-state + remount tests; mock overlap with URL tests
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — thin urlJoin wrapper over orderUrl
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — URL shape tests; shared mock boilerplate
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two-message i18n catalog
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — TopNav integration with `order?.id` guard and `key={order.id}`

### Export call sites

- `getShareableOrderUrl` — exported in `getShareableOrderUrl.ts:5`; callers: `OrderCopyLinkButton.tsx:33` (production), `OrderCopyLinkButton.test.tsx:55` (test assertion only); no other repo callers per `git grep getShareableOrderUrl`
- `OrderCopyLinkButton` — exported in `OrderCopyLinkButton.tsx:21`; call sites: `OrderDetailsPage.tsx:211` (production — passes `key={order.id}` and `orderId={order.id}`; respects optional-order guard via parent conditional); `OrderCopyLinkButton.stories.tsx:95` (Storybook composition); tests in `OrderCopyLinkButton.test.tsx`
- `orderCopyLinkButtonMessages` — exported in `messages.ts:3`; single consumer `OrderCopyLinkButton.tsx:9,38-40,62`; contract respected

### Parent / host components

- `OrderDetailsPage.tsx:210-232` — renders `<OrderCopyLinkButton key={order.id} orderId={order.id} />` inside `TopNav` before metadata button; gated on `order?.id`; `order` prop typed on page — wire-up correct for loading/empty (button omitted when id absent)
- `OrderNormalDetails/index.tsx:201-222` — passes `order={order}` into `OrderDetailsPage`; order loaded from route query before render
- `OrderUnconfirmedDetails/index.tsx:201-222` — same host pattern for unconfirmed orders
- `OrderDetails.tsx:17` — route view imports metadata schema from OrderDetailsPage utils only; does not render copy button directly

### Integration hooks / siblings read

- `src/hooks/useClipboard.ts` — clipboard write + 2s reset; `copy` not memoized
- `src/orders/urls.ts:234-235` — `orderUrl` with encodeURIComponent + trailing `?`
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect`
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — shared icon toggle reused by button
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx:52-62` — closest sibling copy pattern (inline onClick, no useCallback)
- `src/components/CopyableText/CopyableText.tsx` — generic copy button pattern for comparison
- `src/auth/utils.ts:108-109` — parallel absolute-URL urlJoin recipe
- `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-47` — fixture duplication source

### Tests overlapping this code path

- `OrderCopyLinkButton.test.tsx` — click path, copied aria/title/status (iter-5), remount scenario
- `getShareableOrderUrl.test.ts` — URL encoding/mount cases
- `useClipboard.test.ts:105-141` — rapid re-copy timer (supports button double-click UX)

### Planning artifacts

- `docs/DEV-90/prd.md` — acceptance criteria for reuse of useClipboard/ClipboardCopyIcon; no mandate for force* props
- `docs/DEV-90/tech-plan.md` — notes force* props as Storybook-only visual pinning; architecture matches implementation
