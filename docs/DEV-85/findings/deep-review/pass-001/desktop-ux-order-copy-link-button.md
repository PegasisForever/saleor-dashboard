---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-1
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
verdict: pass
---

## Summary

Desktop interaction review of the order-details TopNav copy-link button confirms correct placement, keyboard operability, icon/label state transitions, and TopNav integration in Storybook (production app unreachable). Two SHOULD-FIX gaps affect assistive-technology success feedback and rapid re-click continuity against the PRD’s 2-second copied window; neither blocks mouse/keyboard users on the primary path.

## Findings

### F-001 [SHOULD-FIX] Success feedback not reliably announced to screen readers

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` (lines 21–39); `docs/DEV-85/ui-design.md` (line 59)
- Description: Copy success updates `aria-label`/`title` on the focused button, but there is no `aria-live` (or `role="status"`) region. Mutating `aria-label` on a focused control is not consistently re-announced by NVDA/JAWS/VoiceOver. The UI design document explicitly promises a screen-reader flow of `"Copy order link, button" → after click → "Order link copied, button"`, which may not occur in practice.
- Evidence: Button binds both attributes to the same `label` string with no live region:

```21:39:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
  // ...
      title={label}
      aria-label={label}
```

  UI design SR flow claim at `docs/DEV-85/ui-design.md:59`. Grep of `OrderCopyLinkButton/` finds zero `aria-live` matches; codebase precedent exists in `ManifestErrorMessage.tsx:83`. Storybook a11y snapshot after click shows `"Order link copied"` in the accessibility tree (verified in chrome walkthrough), but tree presence ≠ live announcement.
- Suggested fix: Add a visually hidden `aria-live="polite"` element that renders `messages.orderLinkCopied` when `copied === true` (and optionally clears on revert), or use an established dashboard pattern for transient status text.

### F-002 [SHOULD-FIX] Rapid re-clicks can truncate the 2-second copied feedback window

- Location: `src/hooks/useClipboard.ts` (lines 12–21); consumed by `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (lines 15–18)
- Description: PRD AC requires the check icon and copied label for 2 seconds after each successful copy. `useClipboard` schedules a reset timer on every successful write but does not clear a prior timer before assigning a new one. A second click within the first 2s window orphans the earlier timer; when it fires, it clears the newer timer ref and forces `copied` false prematurely—shortening or flickering the success state.
- Evidence:

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

  Hook test `"should handle multiple copy calls"` (`useClipboard.test.ts:105–130`) never advances timers between copies, so the orphan-timer path is untested. `OrderCopyLinkButtonContent` does not disable the button while `copied === true` (line 28), so rapid activation is unconstrained.
- Suggested fix: Call `clear()` at the start of each successful `.then()` before scheduling a new timeout (or reset the timer on every copy invocation). Add a test that copies twice within 2s and asserts `copied` stays true until 2s after the *last* successful copy.

### F-003 [WARNING] Storybook TopNav composition omits production-only focus stops

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (lines 64–77) vs `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` (lines 210–232)
- Description: The `InOrderDetailsTopNav` story renders copy + metadata only. Production TopNav also includes `TopNav.Menu` (overflow) and, when active, `AppChannelSelect` before action buttons (`TopNav/Root.tsx:75–80`). Desktop keyboard tab order documented in ui-design cannot be fully validated from the story alone.
- Evidence: Story ends at metadata button; production continues with menu items at `OrderDetailsPage.tsx:221–232`. Prototype a11y snapshot confirms story tab order stops at metadata (`docs/DEV-85/findings/prototype/iteration-002/evidence/inOrderDetailsTopNav-a11y.txt`).
- Suggested fix: Extend the integration story (or add a production-parity story) with `TopNav.Menu` and optional channel picker so desktop tab-order review matches production without requiring a live backend.

## Files / sections inspected

### Touched / diff files

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container wiring `useClipboard`, `url ?? window.location.href` fallback
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button, dynamic label/icon, TopNav spacing
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n strings for default/copied labels
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + `InOrderDetailsTopNav` composition
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only hover/focus/active wrapper
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — Macaw token snapshots for interaction states
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — unit tests (mocked hook; label/icon assertions)
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210–232` — production TopNav integration site
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — shared icon with optional sizing props
- `src/hooks/useClipboard.ts` — clipboard async + 2s revert timer (integration dependency, unchanged in diff)
- `locale/defaultMessages.json` — catalog entries for `bqtu1/` and `FzcMi0`
- `docs/DEV-85/prd.md`, `docs/DEV-85/ui-design.md`, `docs/DEV-85/tech-plan.md` — acceptance criteria and interaction spec

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (bare `<OrderCopyLinkButton />`; respects contract: no `url`/`disabled`, uses `window.location.href`); `OrderCopyLinkButton.stories.tsx` (multiple stories with optional `url`); `OrderCopyLinkButton.test.tsx` (4 test renders)
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21`; `OrderCopyLinkButtonStoryPreview.tsx:32`; `OrderCopyLinkButton.stories.tsx:43,61` (Disabled/Copied presentational stories)
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` (Hover/Focus/Active stories only)
- `messages` (from `messages.ts`) — `OrderCopyLinkButtonContent.tsx:22-23` only
- `ClipboardCopyIcon` (modified export) — `OrderCopyLinkButtonContent.tsx:30`; `TrackingNumberDisplay.tsx:56` (unchanged defaults, still valid)

### Parent / host components

- `OrderDetailsPage.tsx:210–232` — renders copy button before metadata inside `<Form>`-wrapped TopNav; `order` optional elsewhere (`order?.id`) but copy button needs no order props; always mounted when page renders (including loading skeleton title state)
- `src/components/AppLayout/TopNav/Root.tsx:57–82` — flex layout, `gap={2}`, optional channel picker before children
- `src/components/AppLayout/TopNav/TopNavLink.tsx:8–16` — back control (first tab stop)
- `src/components/AppLayout/TopNav/Menu.tsx:19–24` — overflow menu trigger (follows metadata in production)
- `src/orders/views/OrderDetails/OrderDetails.tsx:66–68,180+` — routes: not-found/draft exclude copy button by design; normal/unconfirmed use `OrderDetailsPage`

### Integration dependencies

- `src/hooks/useClipboard.ts` — async clipboard, 2s timer, failure → console.warn only
- `src/hooks/useClipboard.test.ts` — timer and multi-copy tests (gap: no inter-click timer advance)
- `src/components/Form/Form.tsx:61–63` — copy button nested inside `<form>` (same as metadata neighbor)

### Sibling / pattern comparisons

- `CopyableText.tsx`, `TrackingNumberDisplay.tsx`, `OrderCustomer.tsx` — static aria-label on copy success (icon-only feedback); contrast with intentional dynamic labels here
- `WarehouseDetailsPage.tsx`, `ProductUpdatePage.tsx` — TopNav secondary button spacing conventions

### Tests overlapping feature paths

- `OrderCopyLinkButton.test.tsx` — wiring + static copied/default label/icon (mocked hook)
- `useClipboard.test.ts` — timer and failure behavior at hook layer
- No Playwright/E2E or `OrderDetailsPage` integration test for TopNav DOM order or real clipboard keyboard flow

### Runtime verification (Storybook fallback)

- Chrome walkthrough on `InOrderDetailsTopNav` story (1280×800): click → `"Order link copied"` aria-label + focused state; production `localhost:9000` → `ERR_CONNECTION_REFUSED`
