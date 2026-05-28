---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-2
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
verdict: pass
---

## Summary

Pass-2 mobile-UX review of the order-copy-link-button area finds the remediation work (aria-live status region, `key={order.id}` remount, hook timer fix) addresses the primary pass-1 mobile gaps. Storybook narrow-viewport walkthrough at 320–390 px confirms tap-to-copy, icon/label feedback, and TopNav action-row fit without horizontal scroll. Production app was unreachable; verification used Storybook `InOrderDetailsTopNavNarrow` plus expanded source tracing. Three non-blocking WARNINGs remain around touch hover stickiness, narrow-story fidelity vs production `Title` layout, and duplicate screen-reader announcement paths.

## Findings

### F-001 [WARNING] Ungated `:hover` styles can stick after tap on touch devices

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-3`
- Description: Hover background styling applies unconditionally on `:hover`, without a `@media (hover: hover)` guard used elsewhere in the codebase (e.g. `OrderValue.module.css:24-28`). On iOS Safari and some Android browsers, the first tap can leave the button on the hover background until another element is tapped.
- Trigger: On a phone or tablet (320–390 px viewport), user single-taps the copy-link button once. Browser applies `:hover` pseudo-class after touch-up; user does not tap elsewhere for several seconds.
- Impact: Copy button background stays on the lighter hover color (`--mu-colors-background-default2`) while adjacent metadata and menu buttons return to default — inconsistent pressed/rest appearance that can look like the button is still active or selected.
- Evidence:
```1:3:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css
.button:hover:not(:disabled) {
  background-color: var(--mu-colors-background-default2);
}
```
- Suggested fix: Wrap hover rules in `@media (hover: hover) and (pointer: fine) { … }`, matching the pattern in `OrderValue.module.css`.

### F-002 [WARNING] Narrow TopNav story does not stress production title layout on mobile

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:93-95,118-123` vs `src/orders/components/OrderDetailsPage/Title.tsx:43-62`
- Description: `InOrderDetailsTopNavNarrow` renders TopNav with a plain string title `"Order #1234"`, but production passes `<Title order={order} />` — a horizontal flex row with order number, status pill, and created date inside an ellipsis wrapper. The story therefore under-tests title/action-row crowding that occurs on real order details at mobile widths.
- Trigger: Staff opens order details on a 320 px phone for an order with a long localized status label (e.g. "Partially fulfilled") and a visible created date. TopNav must fit back link, multi-part title, copy button, metadata button, and overflow menu in one row (`TopNav/Root.tsx:57-74`, `flexWrap="nowrap"`).
- Impact: Layout may truncate the title more aggressively or clip status/date text compared to what narrow Storybook composition validated; copy button itself fits in isolation but its addition is not verified against the wider production title footprint.
- Evidence:
```93:95:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
  render: () => (
    <TopNav title="Order #1234" href="/orders">
      <OrderCopyLinkButton orderId="T3JkZXI6MQ==" />
```
```43:52:src/orders/components/OrderDetailsPage/Title.tsx
    <div className={classes.container}>
      <Box display="flex" justifyContent="center" alignItems="center">
        {intl.formatMessage(
          { id: "AqXzM2", defaultMessage: "Order #{orderNumber}" },
          { orderNumber: order?.number },
        )}
        <div className={classes.statusContainer}>
          <Pill data-test-id="status-info" label={localized} color={status} />
```
- Suggested fix: Update `InOrderDetailsTopNavNarrow` to render production `Title` with an order fixture (including status pill and date), or add a Playwright mobile viewport test on the real order details page.

### F-003 [WARNING] Duplicate screen-reader announcement paths on copy success

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,56-57,60-64`
- Description: On successful copy, both the button's `aria-label`/`title` change to "Order link copied" and a new `role="status" aria-live="polite"` region mounts with the same string. Mobile VoiceOver/TalkBack may announce the success twice in quick succession.
- Trigger: User taps copy-link button on a phone with screen reader enabled. Clipboard write resolves within ~50 ms; React re-renders with updated label and mounts live region.
- Impact: Screen reader user hears "Order link copied" twice (once from focused button name change, once from live region), which is redundant but not blocking.
- Evidence:
```38:40:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const label = isCopied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
```
```60:64:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
      {isCopied ? (
        <span role="status" aria-live="polite" className={styles.statusRegion}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
      ) : null}
```
- Suggested fix: Pick one announcement path — either keep the live region and leave the button `aria-label` static ("Copy order link"), or remove the live region and rely on the dynamic label (ui-design.md documents label-based SR flow). If both are kept intentionally, document the redundancy.

## Files / sections inspected

### Touched files (diff since `45b5cef8`)

- `src/hooks/useClipboard.ts:16` — pass-2 `clear()` before timer reset; fixes double-tap timer race on mobile re-tap.
- `src/hooks/useClipboard.test.ts:105-142` — rapid-copy timer test covers mobile double-tap scenario at hook level.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — full component; tap handler, aria-live region, label swap.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/active/focus/statusRegion styles.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — narrow TopNav composition at `mobile1` viewport.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — click + aria-live unit tests.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — URL builder.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — encoding tests.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n labels.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232` — TopNav integration with `key={order.id}` guard.

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production; gated `order?.id`, passes `orderId={order.id}`, `key={order.id}` — contract respected); `OrderCopyLinkButton.stories.tsx:95` (Storybook composition).
- `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` (sole production caller); tests at `getShareableOrderUrl.test.ts`, `OrderCopyLinkButton.test.tsx:55`.
- `orderCopyLinkButtonMessages` — `OrderCopyLinkButton.tsx:9` only (module-local).

### Parent / host components

- `OrderDetailsPage.tsx:210-232` — renders inside `TopNav`; copy button first child before metadata/menu; conditional on `order?.id`; `key={order.id}` remount resets copied state on order navigation.
- `TopNav/Root.tsx:57-83` — action cluster `flexWrap="nowrap"`, title `overflow="hidden"` + ellipsis; mobile layout host.
- `TopNav/TopNavWrapper.tsx:30-48` — fixed header height, padding.
- `OrderDetailsPage/Title.tsx:31-63` — production title flex layout (pill + date); not used in narrow story.

### Integration sites

- `src/hooks/useClipboard.ts` — async clipboard write, 2s timer, silent failure on mobile permission denial.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — 16px copy/check icon swap.
- `src/orders/urls.ts:234-235` — `orderUrl` with `encodeURIComponent`.
- `src/utils/urls.ts` — `getAppMountUriForRedirect` (via grep/read).
- `src/components/AppLayout/TopNav/Menu.tsx:20-24` — sibling overflow menu button pattern.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — click handler, aria-live region presence.
- `getShareableOrderUrl.test.ts` — URL shape/encoding.
- `useClipboard.test.ts` — timer, rapid copy, unmount cleanup.
- No Playwright/mobile E2E for `copy-order-link` (grep: zero hits).

### Planning artifacts

- `docs/DEV-90/prd.md` — acceptance criteria traced.
- `docs/DEV-90/ui-design.md` — mobile touch target, narrow layout, SR flow.
- `docs/DEV-90/tech-plan.md` — architecture and affected files.

### Chrome walkthrough evidence

- `docs/DEV-90/review/a11y-baseline-320-narrow.txt` — baseline a11y tree at 320 px.
- `docs/DEV-90/review/a11y-after-tap-320-copied.txt` — post-tap label "Order link copied", check icon state.
- `docs/DEV-90/review/a11y-after-single-tap.txt` — 390 px tap feedback.
