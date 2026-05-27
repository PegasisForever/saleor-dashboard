---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-1
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
verdict: fail
---

## Summary

Mobile walkthrough used published Storybook (`InOrderDetailsTopNav` + `Copied`) at 320×568, 375×812, and 390×844 with touch emulation; production dev server was unreachable (`localhost:9000` connection refused). TopNav layout is stable at phone widths (no horizontal scroll; copy/metadata remain 32×32 with ~20px gap). Single tap updates icon and `aria-label` when clipboard is available. **Verified failure:** rapid double-tap within the 2s feedback window reverts to “Copy order link” ~700ms after the second tap instead of 2s after the last success — `useClipboard` schedules stacked timeouts without clearing the prior timer before a new copy.

## Findings

### F-001 [SHOULD-FIX] Double-tap on mobile truncates “copied” feedback below PRD’s 2s window

- Location: `src/hooks/useClipboard.ts` (consumed by `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`)
- Description: PRD AC3 requires copied icon/labels for 2 seconds after a successful copy. On mobile, users often tap twice when feedback is subtle. `useClipboard` assigns a new `setTimeout` on each success without calling `clear()` first; the first tap’s timer can fire after a second tap and reset `copied` to `false` while the user still expects success feedback from the latest tap.
- Evidence: Reproduced in Storybook iframe at 320×568 touch emulation with mocked `navigator.clipboard.writeText`: first tap → `aria-label` “Order link copied”; second tap at +1500ms → still copied; at +2200ms (only +700ms after second tap) → reverted to “Copy order link”. Code path:

```12:21:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyStatus(true);

        timeout.current = window.setTimeout(() => {
          clear();
          setCopyStatus(false);
        }, 2000);
```

- Suggested fix: At the start of the `.then()` handler (before `setCopyStatus(true)`), call `clear()` to cancel any pending timeout so each successful copy gets a fresh 2s window from the most recent tap.

### F-002 [WARNING] `InOrderDetailsTopNav` Storybook omits overflow menu — understates narrow-width toolbar pressure

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:64-77` vs `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:221-232`
- Description: The mobile layout story validates copy + metadata only. Production order details also render `TopNav.Menu` (⋮), channel picker when active, and a multi-row `Title` (order number + status pill + date). Mechanical layout checks at 320–390px therefore do not exercise the fullest production action cluster.
- Evidence: Story render stops at metadata button; production adds `TopNav.Menu` immediately after (`OrderDetailsPage.tsx:221-232`). `ui-design.md:17` wireframe shows three action controls.
- Suggested fix: Extend `InOrderDetailsTopNav` with a stub `TopNav.Menu` (and optional channel-select placeholder) so mobile reviewers approximate production crowding without requiring a live backend.

### F-003 [WARNING] No `aria-live` region for copy-success announcement on touch/SR paths

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:36-40`
- Description: Success feedback relies on swapping `aria-label`/`title` on the icon button. Mobile browsers do not surface `title` on tap; screen readers may not re-announce the button unless focus moves or the user explores again. No polite `aria-live` status accompanies the state change.
- Evidence: Only `title` and `aria-label` are bound to `label`; no live region in component tree (`OrderCopyLinkButtonContent.tsx:38-39`). `ui-design.md:59` documents intended SR flow but no mechanism beyond label swap.
- Suggested fix: Consider a visually hidden `aria-live="polite"` node that mirrors `messages.orderLinkCopied` for 2s, or document as accepted limitation if Macaw/top-nav patterns forbid it.

### F-004 [WARNING] No Playwright/mobile E2E for `data-test-id="copy-order-link"`

- Location: `playwright/` (absent), `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:37`
- Description: PRD scopes `data-test-id="copy-order-link"` for E2E. Unit tests mock `useClipboard` and use `userEvent.click`; no viewport-emulated touch flow validates TopNav integration on a real order-details route.
- Evidence: `grep` over `playwright/` returns no matches for `copy-order-link` or `OrderCopyLinkButton`.
- Suggested fix: Add a narrow Playwright spec that opens order details at mobile viewport, taps `[data-test-id="copy-order-link"]`, and asserts label/icon copied state (with clipboard permissions stubbed if needed).

## Files / sections inspected

### Touched files (coordinator scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `url ?? window.location.href`, wires `useClipboard` to content.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational Macaw secondary icon button; `aria-label`/`title` toggle; `marginRight={3}`.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — `copyOrderLink` / `orderLinkCopied` i18n ids.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + `InOrderDetailsTopNav` composition.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only Macaw token snapshots.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only hover/focus/active wrapper (no `onCopy`).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — four unit tests; mocked hook; click-only activation.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232` — TopNav host; `<OrderCopyLinkButton />` before metadata; no `url`/`disabled` props.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth` (defaults preserve existing callers).
- `locale/defaultMessages.json` — `bqtu1/`, `FzcMi0` catalog entries.
- `docs/DEV-85/prd.md`, `docs/DEV-85/ui-design.md`, `docs/DEV-85/tech-plan.md` — mobile ACs and TopNav conventions.

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production; contract: no props, uses `window.location.href`); `OrderCopyLinkButton.stories.tsx:67` (`url` override); `OrderCopyLinkButton.test.tsx:22,45,65,83` (tests). Production call site respects contract.
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21`; `OrderCopyLinkButtonStoryPreview.tsx:32` (no `onCopy` — story-only inert taps); `OrderCopyLinkButton.stories.tsx:43,61` (static states). Story preview call site intentionally omits `onCopy`.
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` only (story-only export).
- `messages` — `OrderCopyLinkButtonContent.tsx:22-23` only.
- `ClipboardCopyIcon` (modified export) — `OrderCopyLinkButtonContent.tsx:30-34` (passes `iconSize.medium`); `TrackingNumberDisplay.tsx:56` (unchanged defaults). Existing caller contract preserved.

### Parent / host components

- `OrderDetailsPage.tsx:210-232` — renders copy before `show-order-metadata`; `order` optional elsewhere but copy button does not dereference `order`; safe wire-up.
- `src/components/AppLayout/TopNav/Root.tsx:57-83` — action cluster `flexWrap="nowrap"`, title `ellipsis` + `overflow="hidden"`; copy participates in nowrap toolbar.
- `src/components/AppLayout/TopNav/TopNavLink.tsx:8-15` — back button `size="large"` (40×40 neighbor).
- `src/orders/components/OrderDetailsPage/Title.tsx:43-63` — multi-row title inside ellipsis wrapper (narrow-width title compression context).

### Integration dependencies

- `src/hooks/useClipboard.ts` — async clipboard + 2s timer; failure `console.warn`; unmount cleanup; **no `clear()` before reschedule** (F-001).
- `src/hooks/useClipboard.test.ts:59-81,105-131` — timer and multi-copy tests do not cover interleaved timer cancellation.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — wiring/label/icon states; no double-tap, no clipboard denial, no timer integration.
- `useClipboard.test.ts` — hook-level rejection and 2s revert (not through TopNav button).

### Mobile mechanical walkthrough (Storybook)

- `http://local-deploy:11000/348e26e0-70be-420f-9890-0f733b21134b/?path=/story/orders-ordercopylinkbutton--in-order-details-top-nav` at 320/375/390 widths.
- `docs/DEV-85/findings/deep-review/pass-001/evidence/mobile-ux-375-before-tap.png` — screenshot at 375×812.
- `docs/DEV-85/findings/prototype/iteration-002/evidence/inOrderDetailsTopNav-measurements.json` — 32×32 copy/metadata targets (Step 3 baseline; not re-measured).
