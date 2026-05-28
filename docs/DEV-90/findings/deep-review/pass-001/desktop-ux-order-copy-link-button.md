---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-1
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
verdict: pass
---

## Summary

Desktop interaction review of the order copy-link button confirms core PRD flows in Storybook (click/keyboard → clipboard write → ~2s icon/label feedback, TopNav placement before metadata, secondary styling parity). Production app was unreachable (`localhost:9000` connection refused); Storybook `InOrderDetailsTopNav` plus integration source reading served as the production-context proxy. Three SHOULD-FIX gaps remain: stale copied feedback when navigating between orders, premature feedback reset on re-click within 2s due to `useClipboard` timer stacking, and no `aria-live` region for reliable screen-reader confirmation of the transient copied state.

## Findings

### F-001 [SHOULD-FIX] Copied feedback persists after navigating to a different order

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:30-36`
- Description: `OrderCopyLinkButton` holds `useClipboard` state locally and is mounted without a `key` on `order.id`. When the user navigates from order A to order B within the 2s feedback window, the same component instance keeps `copied=true` and shows the check icon plus "Order link copied" label on order B's page even though the user never copied B's link.
- Trigger: On order details for order A, click copy-link (success feedback appears). Within ~2000 ms, navigate to another order (browser back/forward, order list click, or in-app link) so order B's details render. Network round-trip for the new query typically 100–500 ms; feedback window is 2000 ms.
- Impact: User sees "Order link copied" checkmark on order B's TopNav and may believe B's link is already in the clipboard when only A's URL was copied.
- Evidence: Parent renders `{order?.id ? <OrderCopyLinkButton orderId={order.id} /> : null}` with no `key` (`OrderDetailsPage.tsx:211`). Hook state is not reset on `orderId` prop change (`OrderCopyLinkButton.tsx:30-36`; `useClipboard.ts:4-21`). Codebase precedent for remount-on-id: `CustomerOrders.tsx:101` uses `key={order ? order.id : "skeleton"}`.
- Suggested fix: Add `key={order.id}` on `OrderCopyLinkButton` in `OrderDetailsPage.tsx`, or reset clipboard state in `OrderCopyLinkButton` via `useEffect` when `orderId` changes.

### F-002 [SHOULD-FIX] Re-click within 2s shortens copied feedback window

- Location: `src/hooks/useClipboard.ts:12-21`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:32-34`
- Description: Each successful `copy()` schedules a new 2s reset timeout without clearing a prior pending timeout. A second click before the first timeout fires leaves two timers running; when the earlier timer fires, it clears the later timer and sets `copied` false prematurely.
- Trigger: User clicks copy-link on order details; within ~500–1500 ms (before the first 2s window elapses), clicks copy-link again (double-click or confirm-the-copy gesture).
- Impact: Check icon and "Order link copied" label revert to the default copy state hundreds of milliseconds early (~500 ms early if second click at t=1500 ms). Clipboard still holds the latest URL, but visual/a11y confirmation disappears while the user still expects ~2s feedback.
- Evidence: `copy()` overwrites `timeout.current` without calling `clear()` first (`useClipboard.ts:18-21`). `useClipboard.test.ts:105-131` asserts immediate `copied=true` after two calls but never advances timers to expose overlap. Storybook walkthrough confirmed ~2100 ms revert on single click; timer stacking is the gap on multi-click.
- Suggested fix: Call `clear()` at the start of `copy()` before scheduling a new timeout in `useClipboard.ts` (benefits all consumers), or debounce/disable the button while `copied` is true in `OrderCopyLinkButton`.

### F-003 [SHOULD-FIX] No live region for screen-reader copy confirmation

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-57`
- Description: Success feedback updates `aria-label` and `title` on the button only. There is no `aria-live` / `role="status"` element to announce "Order link copied" independently of focus. UI design specifies an SR flow where activation is followed by hearing the copied confirmation (`docs/DEV-90/ui-design.md:42`).
- Trigger: Desktop user activates copy-link via mouse click (or activates then moves focus to another TopNav control such as metadata or overflow menu within ~2000 ms). Screen reader running (NVDA/JAWS/VoiceOver).
- Impact: Keyboard-only users with focus retained on the button may hear the updated label (verified via Enter in Storybook). Mouse users and users who move focus after click often receive no spoken confirmation that copy succeeded — the action appears silent despite the visual check icon swap.
- Evidence: Component sets `aria-label={label}` on the button only (`OrderCopyLinkButton.tsx:55-56`); no live region in render tree. Copied-state a11y snapshot shows a lone button node (`docs/DEV-90/findings/prototype/iteration-002/evidence/copied-a11y.txt`). Repo uses `aria-live` elsewhere (e.g. `ManifestErrorMessage.tsx`) but not here.
- Suggested fix: Add a visually hidden `role="status" aria-live="polite"` element that renders the copied message when `isCopied` is true, or adopt the pattern from other notifier-backed clipboard flows.

## Files / sections inspected

### Touched files (diff since `45b5cef8`)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: click handler, label swap, `useClipboard` wiring, force* Storybook props
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`: hover/focus/active/disabled states; active icon contrast override
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: Default/Copied/TopNav composition stories; no click-flow tests
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts`: absolute URL builder composing `orderUrl` + mount URI + origin
- `src/orders/components/OrderCopyLinkButton/messages.ts`: i18n for default and copied labels
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-233`: TopNav integration, conditional render guard

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (`order?.id ? <OrderCopyLinkButton orderId={order.id} /> : null`; guard respects optional order; no `key`, no `disabled` — **contract gap for F-001**). `OrderCopyLinkButton.stories.tsx:95` (Storybook TopNav composition; passes static `orderId`, contract OK).
- `getShareableOrderUrl` — exported in diff; **no other callers in repo** per `git grep getShareableOrderUrl` (only `OrderCopyLinkButton.tsx:33`).
- `orderCopyLinkButtonMessages` — exported in diff; **single consumer** `OrderCopyLinkButton.tsx:9`.

### Parent / host components

- `OrderDetailsPage.tsx:206-233` — renders copy button inside `<Form>` render prop → `TopNav`; passes `orderId={order.id}` only when `order?.id` truthy; metadata button and menu always present; loading prop not forwarded to copy button
- `OrderNormalDetails/index.tsx:141,201-222` — passes `order={data?.order}` and `loading` to page; order undefined during initial fetch
- `OrderUnconfirmedDetails/index.tsx:137,201-222` — same order prop pattern; narrower loading forward
- `OrderDetails.tsx:62-68,180-255` — route-level loading/not-found/draft branching; not-found bypasses page entirely

### Integration sites (imports / hooks)

- `src/hooks/useClipboard.ts`: 2s timeout, silent `.catch`, timer stacking behavior (F-002)
- `src/hooks/useClipboard.test.ts`: happy path, unmount cleanup, multi-call immediate state; no overlapping-timer test
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: copy/check icon swap at 16px
- `src/orders/urls.ts:234-235`: `orderUrl` applies `encodeURIComponent` — URL builder contract OK
- `src/utils/urls.ts:27-28`: `getAppMountUriForRedirect` used by shareable URL helper
- `src/components/AppLayout/TopNav/Root.tsx:68-83`: flex `gap={2}` action cluster layout
- `src/orders/components/OrderDetailsPage/Title.tsx:31-37`: skeleton title while `order` undefined (copy button absent concurrently)

### Tests overlapping this path

- `src/hooks/useClipboard.test.ts` — hook-level only; no component integration
- `src/components/CopyableText/CopyableText.test.tsx`, `src/orders/components/OrderCustomer/OrderCustomer.test.tsx` — peer clipboard interaction tests; no equivalent for `OrderCopyLinkButton`
- No Playwright/Jest references to `data-test-id="copy-order-link"` outside the component definition

### Storybook / chrome walkthrough evidence

- `docs/DEV-90/review/step7-01-default-story.png` through `step7-09-topnav-keyboard-focus-copy.png`: click, keyboard Enter/Space, focus ring, TopNav placement
- `docs/DEV-90/review/step7-default-snapshot.txt:170`: default label "Copy order link"
- `docs/DEV-90/review/step7-topnav-desktop-snapshot.txt:173-174`: a11y order copy → metadata → menu
