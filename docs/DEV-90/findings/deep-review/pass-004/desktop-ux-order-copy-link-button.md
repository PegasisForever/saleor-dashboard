---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-4
input_branch: 09886983335621e9c0048186f6f51d0f16611441
verdict: pass
---

## Summary

Pass-4 desktop-UX review of the cumulative `order-copy-link-button` area (anchor `45b5cef8`, HEAD `09886983`) confirms prior loop-back fixes are in place: TopNav wire-up with `key={order.id}`, `aria-live` status region, `useClipboard` timer reset, and a real-hook click→copied→2s-revert integration test. Production app was unreachable (`ERR_CONNECTION_REFUSED` on `:9000`); Storybook walkthrough with injected clipboard mock exercised click/keyboard state transitions and TopNav placement. One SHOULD-FIX remains: no automated test for PRD keyboard activation (Enter/Space), though runtime keyboard activation works on the native Macaw `Button`.

## Findings

### F-001 [SHOULD-FIX] No automated test for PRD keyboard activation (Enter/Space)

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` (integration describe at `:137-231`)
- Description: The PRD and ui-design require copy activation via Click, Enter, and Space. The iter-7 real-hook transition test only uses `fireEvent.click`. There is no `user.keyboard('{Enter}')` or `{Space}` coverage anywhere under `src/orders/components/`.
- Trigger: Staff focuses the copy button via Tab on order details TopNav, presses Enter or Space once. Clipboard API is available (HTTPS dashboard).
- Impact: Keyboard activation works at runtime (verified in Storybook with focused button + Enter → label "Order link copied", check icon, clipboard write), but CI would not catch a regression if Macaw `Button` stopped forwarding keyboard activation to `onClick`.
- Evidence: PRD interaction line (`docs/DEV-90/prd.md` — "Click / Enter / Space"); test uses click only at `OrderCopyLinkButton.test.tsx:206-208`; grep `user.keyboard|keyboard(` under `src/orders/components/` → 0 matches; chrome walkthrough: Enter on focused `[data-test-id="copy-order-link"]` → `aria-label` "Order link copied", `writeText` called.
- Suggested fix: In the `"OrderCopyLinkButton click to copied feedback transition"` describe block, add cases that `tab()` to the button and `await user.keyboard('{Enter}')` / `'{ }'` (with fake timers + mocked `navigator.clipboard.writeText`), asserting the same label/icon transition as the click test.

### F-002 [WARNING] TopNav tab order shifts when copy button mounts after `order.id` resolves

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211-218`; `src/orders/components/OrderDetailsPage/Title.tsx:31-37`
- Description: The copy button is conditionally rendered when `order?.id` is truthy, while metadata and overflow menu are always in the TopNav action cluster. During the loading window (`order` undefined, title skeletons), keyboard users tab to metadata/menu first; when data arrives, a new focusable stop (copy) inserts before metadata.
- Trigger: Staff opens order details on a slow network (order query 200–800 ms). User tabs through TopNav actions before `order.id` is available, then continues tabbing after the copy button appears.
- Impact: Tab sequence changes mid-session (back → [channel?] → metadata → menu becomes back → [channel?] → copy → metadata → menu). No focus trap or jump, but keyboard users may need an extra Tab stop or miss the copy affordance on first pass.
- Evidence: Conditional render at `OrderDetailsPage.tsx:211`; always-mounted metadata at `:212-218`; title skeleton when `!order` at `Title.tsx:31-37`; `TopNav/Root.tsx:68-82` renders `children` in DOM order.
- Suggested fix: Accept as documented loading behavior, or render a disabled placeholder copy button during load to preserve tab order (out of current PRD scope).

## Files / sections inspected

### Touched files (coordinator pass-4 scope)

- `src/hooks/useClipboard.ts:12-32` — `clear()` before reschedule on success; 2s reset; silent `.catch()`.
- `src/hooks/useClipboard.test.ts:105-141` — rapid re-click timer extension test for `clear()` fix.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-67` — button, labels, `aria-live` status region, `handleCopy`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-51` — hover/focus/active/disabled; sr-only `.statusRegion`.
- `src/orders/components/OrderCopyLinkButton/messages.ts:3-14` — i18n catalog.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — absolute URL via `orderUrl` + mount URI.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts:39-75` — encoding and trailing `?`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:57-231` — mock + real-hook tests; key remount test.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:85-123` — `InOrderDetailsTopNav` composition.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232` — TopNav wire-up with `key={order.id}`.

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production); `OrderCopyLinkButton.stories.tsx:95` (Storybook TopNav story); tests at `OrderCopyLinkButton.test.tsx` — contract respected (`orderId` + optional `key`).
- `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` only production caller; tests in `getShareableOrderUrl.test.ts` and `OrderCopyLinkButton.test.tsx` — no other repo callers per `git grep getShareableOrderUrl`.
- `orderCopyLinkButtonMessages` — `OrderCopyLinkButton.tsx:9,38-40,62` only.

### Parent / host components

- `OrderDetailsPage.tsx:210-232` — `{order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}` before metadata; safe optional guard; remount on navigation.
- `TopNav/Root.tsx:57-82` — action cluster flex order; optional `AppChannelSelect` before children.
- `Title.tsx:31-37` — skeleton title while `order` loading.

### Integration dependencies

- `useClipboard.ts` — async clipboard write, 2s feedback, unmount cleanup.
- `ClipboardCopyIcon.tsx:8-15` — copy/check swap at 16px.
- `urls.ts:234-235` — `orderUrl` with `encodeURIComponent`.
- `utils/urls.ts:27-28` — `getAppMountUriForRedirect`.

### Sibling patterns compared

- `TrackingNumberDisplay.tsx:54-61` — tertiary hover-reveal copy; static aria-label.
- `CopyableText.tsx:46-47` — static title/aria-label on copy.
- `CustomerOrders.tsx:101` — `key={order.id}` precedent for list remount.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — full component coverage except keyboard.
- `useClipboard.test.ts` — hook rapid-click and rejection paths.
- `playwright/` — grep `copy-order-link` → 0 (no E2E).

### Runtime walkthrough (Storybook `http://local-deploy:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d/`)

- Default story: click → "Order link copied" + check icon + clipboard URL → 2s revert (evaluate_script with clipboard mock).
- TopNav story: DOM order copy (`copy-order-link`) → metadata (`show-order-metadata`) → menu (`show-more-button`).
- Keyboard: focused button + Enter → copied state (clipboard mock).
- Copied story: a11y name "Order link copied".
