---
agent: step-7-deep-simplify-order-copy-link-button-pass-4
input_branch: 09886983335621e9c0048186f6f51d0f16611441
verdict: pass
---

## Summary

Pass-4 delta is iter-7 test work (~107 LOC) atop stable production code (~575 LOC cumulative). The feature is functionally lean, but Storybook-only `force*` props and mirror CSS inflate the production export surface, copied-label i18n is formatted twice per render, `useCallback` adds ceremony without stabilizing the handler, and the test file now has two top-level `describe` blocks with duplicated env stubs that iter-7 did not consolidate. No BLOCKERs; six WARNING simplification opportunities remain actionable before merge or as follow-up.

## Findings

### F-001 [WARNING] Storybook `force*` props and mirror CSS live on the production export

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-18,47-51`; `OrderCopyLinkButton.module.css:24-38`; `OrderCopyLinkButton.stories.tsx:55-82`
- Description: Four optional `force*` booleans and four `.buttonForce*` CSS classes duplicate real pseudo-state rules solely so Storybook can pin hover/focus/active/copied visuals. Grep shows these props are used only in stories; production passes only `orderId` at `OrderDetailsPage.tsx:211`.
- Trigger: Any engineer importing `OrderCopyLinkButton` sees five optional props beyond `orderId`/`disabled` on the public interface; Storybook authors maintain parallel CSS blocks whenever production pseudo-rules change.
- Impact: No runtime user effect today, but the shipped API and stylesheet carry ~16 lines of Storybook-only surface that must stay in sync with four production pseudo-rules — a recurring maintenance tax on a one-caller component.
- Evidence: `forceHovered && styles.buttonForceHover` at `OrderCopyLinkButton.tsx:49` mirrors `.button:hover:not(:disabled)` at `OrderCopyLinkButton.module.css:1-3`; ui-design.md:51 documents intent as Storybook-only.
- Suggested fix: Move visual pinning to a Storybook-only wrapper or `data-force-*` attribute selectors in a `.stories.module.css`; keep production props to `{ orderId }` (optionally drop `disabled` if production never passes it per PRD AC10).

### F-002 [WARNING] Copied label formatted twice on the same render path

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,56-57,62`
- Description: When `isCopied` is true, `label` is derived via `intl.formatMessage(messages.orderLinkCopied)` and applied to both `title` and `aria-label`, then the aria-live region calls `intl.formatMessage(messages.orderLinkCopied)` again.
- Trigger: User clicks copy once; component re-renders with `copied=true` (always, on every successful copy).
- Impact: Two independent i18n lookups and two sources of truth for the same string on one render; a future message change could update button labels but miss the live region (or vice versa) without a compile-time tie.
- Evidence:
  ```tsx
  const label = isCopied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
  // ...
  title={label}
  aria-label={label}
  // ...
  {intl.formatMessage(messages.orderLinkCopied)}
  ```
- Suggested fix: Reuse `label` inside the status region when `isCopied` (`{label}` or `{isCopied ? label : null}`), or derive a single `copiedLabel` constant consumed by all three outputs.

### F-003 [WARNING] `useCallback` on `handleCopy` does not stabilize the handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:32-34`; `src/hooks/useClipboard.ts:12-27`
- Description: `handleCopy` is wrapped in `useCallback([copy, orderId])`, but `useClipboard` returns a fresh `copy` function every render (not memoized). Sibling copy buttons use inline handlers.
- Trigger: Component mounts in TopNav (always when `order.id` present); re-renders on any parent state change re-create both `copy` and `handleCopy` identically to an inline `() => copy(getShareableOrderUrl(orderId))`.
- Impact: Extra hook allocation and mental overhead with no measurable render optimization; inconsistent with `TrackingNumberDisplay.tsx:57`, `CopyableText.tsx:45`, and `PspReference.tsx:105`.
- Evidence: `const copy = (text: string): void => { ... }` at `useClipboard.ts:12` is recreated each render; `useCallback` at `OrderCopyLinkButton.tsx:32-34` depends on `[copy, orderId]`.
- Suggested fix: Drop `useCallback` and use `onClick={() => copy(getShareableOrderUrl(orderId))}` to match sibling patterns.

### F-004 [WARNING] Test env stubs duplicated across two describes; iter-7 did not extract shared setup

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:34-54,137-177`; `getShareableOrderUrl.test.ts:19-37`
- Description: Pass-4 added a second top-level describe for the real-hook click→copied transition but duplicated `window.location` stubbing, `getAppMountUriForRedirect` default mock, `orderId` constant, and typed `jest.requireActual` wiring already present in the first describe. The same location stub also appears in `getShareableOrderUrl.test.ts`.
- Trigger: Developer adds a fourth test case requiring dashboard origin or mount-uri mocking — must copy ~15 lines into a third location or risk drift.
- Impact: No user-visible effect; increases test maintenance cost and the chance that one describe updates origin URL while another does not.
- Evidence: Identical `Object.defineProperty(window, "location", { value: { origin: "https://dashboard.example.com" } })` at `OrderCopyLinkButton.test.tsx:41-45` and `:155-160`; `mockGetAppMountUriForRedirect.mockReturnValue("")` at `:46` and `:161`; triple `jest.requireActual<typeof import("@dashboard/hooks/useClipboard")>` at `:11-13`, `:163-165`, `:174-176`.
- Suggested fix: Extract `setupDashboardOriginMock()` / `restoreWindowLocation()` helpers (shared with `getShareableOrderUrl.test.ts`) and a `useRealClipboard()` helper for the integration describe's beforeEach/afterEach.

### F-005 [WARNING] Standalone `getShareableOrderUrl` module for a single production caller

- Location: `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8`; `getShareableOrderUrl.test.ts`; sole production call at `OrderCopyLinkButton.tsx:33`
- Description: A dedicated file and 77-line test suite wrap a three-line composition of existing helpers (`orderUrl`, `getAppMountUriForRedirect`, `urlJoin`). The same absolute-URL recipe is inlined in auth/staff (`auth/utils.ts:108-109`, `StaffList.tsx:140-144`) without a shared dashboard helper.
- Trigger: Engineer traces "where is the shareable order URL built?" — must open a separate module; component tests re-assert exact URL strings already covered in `getShareableOrderUrl.test.ts:39-76`.
- Impact: No incorrect URLs at runtime; file proliferation and overlapping test contracts make the feature harder to navigate than its logic warrants.
- Evidence: `export const getShareableOrderUrl = (orderId: string): string => { const relativePath = orderUrl(orderId); return urlJoin(window.location.origin, getAppMountUriForRedirect(), relativePath); };` — grep shows only `OrderCopyLinkButton.tsx:33` as production caller.
- Suggested fix: Either inline at the call site (9 LOC total) or colocate as `orderShareableUrl` in `src/orders/urls.ts` next to `orderUrl` if reuse is anticipated; component tests can assert `mockCopy`/`writeText` was called without re-importing the helper.

### F-006 [WARNING] Dual screen-reader feedback channels beyond PRD minimum

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,56-57,60-64`; `OrderCopyLinkButton.module.css:41-50`
- Description: PRD scope specifies "icon + aria-label feedback only" (prd.md:17). Implementation adds a visually hidden `role="status" aria-live="polite"` region that announces the same copied string already applied to dynamic `aria-label`/`title`. No other copy button in the repo uses an aria-live region.
- Trigger: Staff user activates copy via click or keyboard; both `aria-label` updates and the live region mounts with "Order link copied".
- Impact: Assistive technology may announce success twice on first copy; adds 10 lines of sr-only CSS, conditional mount logic, and a dedicated mocked test (`OrderCopyLinkButton.test.tsx:79-98`) beyond what PRD/ui-design.md:42 describe. Re-click within 2s does not re-announce (region stays mounted with unchanged text).
- Evidence: Only `role="status"` in orders copy UI at `OrderCopyLinkButton.tsx:61`; peers `TrackingNumberDisplay`, `CopyableText`, `PspReference` rely on icon + static/dynamic label only.
- Suggested fix: If double-announcement is confirmed in AT testing, pick one channel (dynamic label **or** live region, not both). If live region is kept, drop dynamic label change on copy to match PRD literally and reduce duplication.

## Files / sections inspected

### Touched files (coordinator pass-4 scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — production component; clipboard wiring, dual feedback paths, Storybook props on export.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — thin absolute-URL helper over `orderUrl` + mount URI.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two-message i18n catalog.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — pseudo-states + mirror force classes + sr-only status region.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — seven stories; force* args; duplicated TopNav fixtures.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — two describes; pass-4 iter-7 real-hook transition test; mock/real hook split.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — three URL shape cases; duplicated location stub.
- `src/hooks/useClipboard.ts` — shared hook; pass-4 cumulative includes `clear()` before timer reschedule.
- `src/hooks/useClipboard.test.ts` — rapid re-copy timer test at hook layer.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — production integration; conditional render + `key={order.id}`.

### Export call sites

- **`OrderCopyLinkButton`** — production: `OrderDetailsPage.tsx:211` (`orderId={order.id}` only; respects contract). Stories: `OrderCopyLinkButton.stories.tsx:53-95` (passes `force*` for visual pinning). Tests: `OrderCopyLinkButton.test.tsx:68,86,109,124,194`.
- **`getShareableOrderUrl`** — production: `OrderCopyLinkButton.tsx:33` (single caller). Tests: `getShareableOrderUrl.test.ts:46,59,72`; `OrderCopyLinkButton.test.tsx:64,190` (re-assert URL shape).
- **`orderCopyLinkButtonMessages`** — production: `OrderCopyLinkButton.tsx:9,39-40,62` only; no external importers per grep.
- **`useClipboard` (modified)`** — production callers unchanged: `OrderCopyLinkButton.tsx:30`, `TrackingNumberDisplay.tsx:16`, `CopyableText.tsx:14`, `PspReference.tsx:19`, `OrderCustomer.tsx:132-134`, `GiftCardCreateDialogCodeContent.tsx:21`, `ChannelForm.tsx:95`; tuple contract respected at all sites.

### Parent / host components

- **`OrderDetailsPage.tsx:210-219`** — renders `OrderCopyLinkButton` as first TopNav child before metadata button when `order?.id` truthy; passes `key={order.id}` for remount-on-navigation; no `disabled` or `force*` props — wire-up correct for production contract.

### Integration dependencies read

- **`src/hooks/useClipboard.ts`** — sync `copy(text)` API; 2s timer with `clear()` on re-copy; no memoization of `copy`.
- **`src/orders/urls.ts:234-235`** — `orderUrl` applies `encodeURIComponent`; trailing `?` preserved.
- **`src/utils/urls.ts:27-28`** — `getAppMountUriForRedirect()` mount-prefix helper.
- **`src/auth/utils.ts:108-109`** — sibling absolute-URL pattern (`getNewPasswordResetRedirectUrl`).
- **`src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`** — reused icon toggle.
- **`src/components/CopyableText/CopyableText.tsx`**, **`TrackingNumberDisplay.tsx`**, **`PspReference.tsx`** — sibling copy-button patterns for comparison.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — mock click, mocked copied state + live region, key remount narrative, real-hook 2s transition (pass-4 delta).
- `getShareableOrderUrl.test.ts` — URL encoding/mount cases overlapping component test URL assertions.
- `useClipboard.test.ts:59-77,105-141` — 2s reset and rapid re-copy covered at hook layer; component integration test partially overlaps.
