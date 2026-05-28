---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-2
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
verdict: pass
---

## Summary

Pass-2 desktop-ux review of the order-copy-link-button area finds the pass-1 integration and feedback defects remediated in source: `order?.id` guard with `key={order.id}` remount, `useClipboard` timer `clear()` on rapid re-click, and a visually hidden `aria-live` status region. Storybook TopNav composition confirms placement before metadata and keyboard tab order (back → copy → metadata → menu). Production dashboard (`localhost:9000`) is unreachable in this worker; walkthrough used published Storybook plus parent integration reads. Two SHOULD-FIX gaps remain around automated coverage for navigation remount and copied-state button labels; no BLOCKERs.

## Findings

### F-001 [SHOULD-FIX] No test asserts `key={order.id}` clears copied feedback on order navigation
- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`
- Description: Production wire-up remounts `OrderCopyLinkButton` when `order.id` changes so stale checkmark/label state cannot carry across orders, but no unit or integration test exercises an `orderId` prop change or parent key remount.
- Trigger: Staff copies the link on order A (check icon + "Order link copied" label visible), then navigates to order B within the ~2 s feedback window via in-app order link or browser history (~200–500 ms navigation latency). Order B's TopNav should show default copy affordance, not order A's copied state.
- Impact: A regression removing `key={order.id}` would ship without CI signal; users could briefly see the wrong order's "copied" confirmation on a different order's header.
- Evidence: Parent passes `key={order.id}` at `OrderDetailsPage.tsx:211`. Grep shows no test references `key={order.id}` or remount-on-id-change. Shallow review iter-3 noted the same gap.
- Suggested fix: Add a test rendering `OrderCopyLinkButton` with `useClipboard` mocked to `[true, jest.fn()]`, then `rerender` with a new `key`/`orderId` and assert `aria-label` returns to "Copy order link" and check icon state resets.

### F-002 [SHOULD-FIX] Component test omits copied-state `aria-label` / `title` on the button
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:70-86`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,56-57`
- Description: PRD AC3 requires `aria-label` and `title` to update to "Order link copied" after success. The copied-state test asserts only the `role="status"` region text, not the button's accessible name attributes that keyboard and screen-reader users rely on when focus remains on the button.
- Trigger: User activates copy with Enter while focus is on `[data-test-id="copy-order-link"]`; clipboard write succeeds within ~10 ms. Inspect button `aria-label`/`title` in the DOM.
- Impact: A regression that updates only the icon or live region but not `aria-label`/`title` would pass CI while violating PRD AC3 for assistive-tech users focused on the control.
- Evidence: Label swap is implemented at `OrderCopyLinkButton.tsx:38-40,56-57`. Test at `:70-86` checks `getByRole("status")` text only. Storybook `Copied` story shows button name "Order link copied" in the a11y tree (verified in chrome walkthrough).
- Suggested fix: In the existing copied-state test, add `expect(screen.getByTestId("copy-order-link")).toHaveAttribute("aria-label", "Order link copied")` and matching `title` assertion.

### F-003 [WARNING] Loading window shifts TopNav keyboard order (copy absent, metadata present)
- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211-219`; `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201-222`
- Description: While `order` is `undefined` during fetch, the copy button is omitted but the metadata button and overflow menu remain in the tab order. Documented as intentional in `ui-design.md` (empty = hidden when no `order.id`), but keyboard users traversing the header during the loading window skip the copy slot that appears once data loads.
- Trigger: Navigate to an order details URL on a cold load (network round-trip ~100–500 ms). Press Tab repeatedly through the TopNav before the order query resolves.
- Impact: Tab order is back → metadata → menu during load, then back → copy → metadata → menu after load — one fewer tab stop mid-load, then an inserted stop when the copy button mounts. No functional breakage; mild focus-path discontinuity.
- Evidence: Conditional render at `OrderDetailsPage.tsx:211`; metadata always at `:212-219`. `Title.tsx:31-37` shows skeletons concurrently.
- Suggested fix: Optional follow-up: render a visually hidden/disabled placeholder copy button during loading to preserve tab order, or document the behavior in `ui-design.md` keyboard section.

### F-004 [WARNING] Re-click within 2 s likely silent for screen readers
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:36-40,60-64`; `src/hooks/useClipboard.ts:15-22`
- Description: A second successful copy within the feedback window keeps `isCopied` true, leaves button `aria-label` unchanged, and keeps the polite live region mounted with identical text — polite regions typically do not re-announce duplicate content.
- Trigger: User clicks copy, then clicks copy again within ~300 ms (before the 2 s timer expires) to confirm the action.
- Impact: Visual/icon state stays correct (check icon, copied label); sighted users are fine. Screen-reader users may hear no new confirmation on the second click.
- Evidence: `isCopied` stays true; label string unchanged (`OrderCopyLinkButton.tsx:38-40`). Timer extension covered by `useClipboard.test.ts:105-142`.
- Suggested fix: Consider a persistent live region and append a timestamped or incremented message on each success, or accept as consistent with sibling clipboard controls (`TrackingNumberDisplay.tsx` has no live region).

## Files / sections inspected

- `docs/DEV-90/prd.md` — acceptance criteria for TopNav placement, labels, clipboard reuse, contrast
- `docs/DEV-90/ui-design.md` — Storybook URL, keyboard order, state matrix
- `docs/DEV-90/tech-plan.md` — architecture, URL shape, affected files
- `docs/DEV-90/logs/027-step-7-coordinator-pass-2.md` — touchedFiles scope (10 `src/` paths)
- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/ src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx src/hooks/useClipboard.ts` — full area delta
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — button, labels, aria-live region, force* props
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/focus/active/disabled + `.statusRegion` sr-only
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — absolute URL builder
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n catalog
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — click + aria-live tests (mocked hook)
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — encoding/mount tests
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state + TopNav composition stories
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232` — parent TopNav wire-up
- `src/orders/components/OrderDetailsPage/Title.tsx:31-64` — loading skeleton vs loaded title
- `src/components/AppLayout/TopNav/Root.tsx:57-83` — flex action cluster layout
- `src/hooks/useClipboard.ts` — 2 s timer, `clear()` on success, silent `.catch`
- `src/hooks/useClipboard.test.ts` — timer, rapid re-click, rejection tests
- `src/orders/urls.ts:234-235` — `orderUrl` encodeURIComponent sibling
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — icon swap pattern
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — sibling clipboard UX (no live region)
- `src/orders/views/OrderDetails/OrderDetails.tsx:62-68,180-255` — loading vs null order routing
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:141,201-222` — passes optional `order` during load

**Call sites — `OrderCopyLinkButton` export**
- `OrderDetailsPage.tsx:211` — production; `order?.id` guard + `key={order.id}`; contract respected
- `OrderCopyLinkButton.stories.tsx:95` — TopNav composition; contract respected
- `OrderCopyLinkButton.test.tsx:59,77` — test renders; contract respected
- No other production callers (`git grep OrderCopyLinkButton` in `src/`)

**Call sites — `getShareableOrderUrl` export**
- `OrderCopyLinkButton.tsx:33` — sole production caller via `handleCopy`
- `getShareableOrderUrl.test.ts:46,59,72` — unit tests
- `OrderCopyLinkButton.test.tsx:55` — expected URL in click test
- No other callers in repo

**Parents / hosts read**
- `OrderDetailsPage.tsx:210-232` — TopNav host; conditional mount + key remount; metadata sibling order correct
- `OrderNormalDetails/index.tsx:201-222` — supplies `order` (possibly undefined) and `loading` during fetch

**Chrome walkthrough evidence**
- `http://local-deploy:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d/` — Storybook reachable (HTTP 200)
- `InOrderDetailsTopNav` story — a11y order: back → "Copy order link" → "Edit order metadata" → menu
- `Copied` story — button accessible name "Order link copied"
- `localhost:9000` — `ERR_CONNECTION_REFUSED` (production walkthrough skipped)
- Published Storybook iframe lacks `[role="status"]` in DOM for `Copied` story despite HEAD source including it — deploy appears stale vs current branch; HEAD source + test intent used for new-surface verification
