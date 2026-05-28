---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-3
input_branch: 6feae83ec628e0296d8e2a3652c5db5ed4b58877
verdict: pass
---

## Summary

Pass-3 desktop-UX review of the cumulative `order-copy-link-button` diff confirms iter-5 test remediation closes the prior copied-state and order-navigation feedback gaps. Production integration in `OrderDetailsPage` correctly gates on `order?.id`, remounts via `key={order.id}`, and preserves TopNav placement before the metadata button. Storybook walkthrough (production app unreachable) verified click→copied→2s-reset transitions with a mocked clipboard; keyboard focus ring and native `type="button"` semantics are sound. One WARNING remains for missing keyboard-activation test coverage.

## Findings

### F-001 [WARNING] No keyboard activation test for copy button
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`
- Description: Component tests exercise copy only via `user.click()`; there is no `user.keyboard("{Enter}")` or `{Space}` case verifying keyboard-triggered copy despite PRD/ui-design requiring Enter/Space activation.
- Trigger: Staff user tabs to the copy button on order details TopNav and presses Enter or Space (no mouse). Regression if macaw `Button` ever stops forwarding keyboard activation to `onClick`.
- Impact: Keyboard path would break silently in CI; manual QA or a future Button refactor could ship a control that is focusable but does not copy on Enter/Space without any automated signal.
- Evidence: Only pointer test at `OrderCopyLinkButton.test.tsx:64` (`await user.click(screen.getByTestId("copy-order-link"))`). Chrome walkthrough on Storybook `InOrderDetailsTopNav` shows native `<button type="button">` with visible `:focus-visible` outline (`OrderCopyLinkButton.module.css:5-8`) and successful activation when focused + clicked; no automated keyboard test encodes that contract.
- Suggested fix: Add a test using `user.tab()` (or `focus()`) + `user.keyboard("{Enter}")` with mocked `navigator.clipboard.writeText` (or unmocked hook) asserting `mockCopy` / label transition.

## Files / sections inspected

### Touched files (10 src paths)
- `src/hooks/useClipboard.ts` — iter-2 `clear()` before reschedule; 2s reset timer; silent catch on failure
- `src/hooks/useClipboard.test.ts` — rapid re-click window, unmount cleanup, rejection path
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — click handler, copied label/icon, aria-live status region
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/focus/active/disabled + sr-only `.statusRegion`
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n labels per PRD
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — absolute URL builder
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — encoding, mount subpath, trailing `?`
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — iter-5 remount + copied-state aria/title/status assertions
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — TopNav composition stories
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — conditional mount + `key={order.id}` before metadata button

### Export call sites
- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production; respects `order?.id` guard + remount key); `OrderCopyLinkButton.stories.tsx:95` (Storybook); tests only elsewhere — contract honored at sole production call site
- `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` only production caller; tests in module — no external callers per `git grep getShareableOrderUrl`
- `orderCopyLinkButtonMessages` — `OrderCopyLinkButton.tsx:9,38-40,62` only; no external importers

### Parent / host components
- `OrderDetailsPage.tsx:210-232` — TopNav child order copy → metadata → menu; copy omitted when `order?.id` falsy; metadata/menu always present (loading tab-order shift is PRD-intentional)
- `OrderDetails.tsx:180-254` — routes confirmed/unconfirmed orders to views that render `OrderDetailsPage`; drafts use `OrderDraftPage` (no copy button)
- `OrderNormalDetails/index.tsx`, `OrderUnconfirmedDetails/index.tsx` — pass `order` into `OrderDetailsPage`; no duplicate copy wiring
- `TopNav/Root.tsx:68-82` — `flexWrap="nowrap"` action cluster; optional channel picker precedes children

### Integration dependencies
- `useClipboard.ts` — shared hook; iter-2 timer fix benefits all consumers
- `ClipboardCopyIcon.tsx` — copy/check swap at 16px
- `urls.ts:234-235` — `orderUrl` applies `encodeURIComponent`
- `TrackingNumberDisplay.tsx`, `CopyableText.tsx` — sibling clipboard patterns (no aria-live; static labels)

### Tests overlapping
- `OrderCopyLinkButton.test.tsx` — click payload, copied aria/title/status, key remount (iter-5 delta)
- `useClipboard.test.ts` — timer overlap fix
- `getShareableOrderUrl.test.ts` — URL shape
- No Playwright references to `copy-order-link` (grep empty)

### Chrome walkthrough (Storybook fallback)
- URL: `http://local-deploy:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d/?path=/story/orders-ordercopylinkbutton--in-order-details-top-nav`
- Production `localhost:9000` — connection refused (skip)
- Mocked clipboard in iframe: click → label "Order link copied" + check icon → reset after ~2s
- Tab order in composition: back → copy → metadata → menu
- Published Storybook bundle lacks `[role="status"]` node (predates aria-live addition); HEAD source + unit test assert region — artifact staleness, not production defect
