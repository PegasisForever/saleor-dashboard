---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-3
input_branch: 7a4e0a69c93b1092d88419dfd90b9dd892bbc0d8
verdict: pass
---

## Summary

Pass-3 mobile-ux review on the cumulative `order-copy-link-button` diff confirms iter-6 loop-back fixes hold for touch usage: double-tap within 2s keeps copied affordances (timer `clear()` + `copyGeneration`), TopNav placement is correct, and Storybook `InOrderDetailsTopNav` at 320×568 and 375×812 shows no horizontal overflow with 32×32 copy/metadata targets. Production dev server was unreachable; mobile walkthrough used published Storybook with clipboard mocked. No BLOCKERs; two WARNINGs remain on automated mobile viewport coverage and production TopNav composition fidelity at narrow widths.

## Findings

### F-001 [WARNING] Playwright copy-link E2E never runs at a mobile viewport

- Location: `playwright.config.ts:64-66`, `playwright/tests/orders.spec.ts:155-190`
- Description: `TC: SALEOR_218` exercises copy placement, clipboard payload, icon/label feedback, and 2s revert, but the sole E2E project uses `devices["Desktop Chrome"]` with no `setViewportSize` or mobile device profile. Mobile-specific regressions (TopNav nowrap crowding, touch synthesis quirks, on-screen-keyboard focus overlap) are not guarded in CI.
- Evidence: `use: { ...devices["Desktop Chrome"] }` in config; test uses `copyOrderLinkButton.click()` with no viewport setup. `playwright/pages/basePage.ts` exposes `setViewportSize` but SALEOR_218 does not call it.
- Suggested fix: Add a mobile-viewport variant (e.g. iPhone 13 profile or `page.setViewportSize({ width: 375, height: 812 })`) and optionally a second tap within 1s asserting copied state persists before revert.

### F-002 [WARNING] Storybook TopNav proxy understates production toolbar crowding at phone widths

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:64-77` vs `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232`
- Description: `InOrderDetailsTopNav` renders copy + metadata only, while production mounts `TopNav.Menu`, optional `AppChannelSelect`, and a multi-row `Title` inside a `flexWrap="nowrap"` action cluster (`TopNav/Root.tsx:68-73`). At 320–375px the story passes layout checks, but production may compress or clip actions more aggressively than the story approximates.
- Evidence: Story omits menu/channel; production adds `TopNav.Menu` after metadata (`OrderDetailsPage.tsx:221-232`). Chrome walkthrough at 320×568 and 375×812 on the story: `overflow: false`, copy/metadata `32×32` and fully visible — screenshots `docs/DEV-85/findings/deep-review/pass-003/evidence/mobile-ux-375-in-topnav-before-tap.png`, `mobile-ux-375-copied-state.png`.
- Suggested fix: Extend the composition story (or add a dedicated narrow-viewport story) to include overflow menu + channel picker stubs, or add a Playwright mobile-viewport assertion on the real order-details page.

## Files / sections inspected

### Touched files (coordinator scope)

- `src/hooks/useClipboard.ts` — `clear()` before reschedule, `copyGeneration` third tuple element; 2s revert timer.
- `src/hooks/useClipboard.test.ts` — double-tap timer regression (`:160-200`), generation increment (`:133-158`).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — wires `copyGeneration` to content; `url ?? window.location.href`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — icon-only Macaw button, `key={copyGeneration}` aria-live span.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — visually hidden live region pattern.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n labels for copy/copied states.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — clipboard mock tests, live-region remount on generation bump.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + `InOrderDetailsTopNav` composition.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only Macaw token snapshots.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — hover/focus/active preview wrapper.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232` — TopNav integration host.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth` props (defaults unchanged).
- `playwright/tests/orders.spec.ts:155-190` — SALEOR_218 E2E clipboard + revert.
- `playwright/pages/ordersPage.ts:62` — `copyOrderLinkButton` locator.
- `docs/DEV-85/prd.md`, `docs/DEV-85/ui-design.md`, `docs/DEV-85/tech-plan.md` — mobile ACs and 32×32 TopNav convention.

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production, no props); `OrderCopyLinkButton.stories.tsx:67` (story with `url` override). Contract respected: production omits `url` → `window.location.href` at click.
- `OrderCopyLinkButtonContent` — stories/tests/preview only; not imported by production parents besides container.
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` only.
- `ClipboardCopyIcon` (modified export) — `OrderCopyLinkButtonContent.tsx:35-39` (`iconSize.medium`); `TrackingNumberDisplay.tsx:56` (default `size=16`, unchanged behavior).
- `useClipboard` (return tuple extended) — third element consumed only by `OrderCopyLinkButton.tsx:15`; 2-tuple callers (`CopyableText.tsx:14`, `TrackingNumberDisplay.tsx:16`, `OrderCustomer.tsx:132-134`, `PspReference.tsx:19`, `GiftCardCreateDialogCodeContent.tsx:21`, `ChannelForm.tsx:95`) unchanged.

### Parent / host components

- `OrderDetailsPage.tsx:210-232` — renders `<OrderCopyLinkButton />` before metadata button and `TopNav.Menu`; does not pass `disabled` or `url`; `order` optional but copy path does not dereference `order` (uses `window.location.href`).
- `TopNav/Root.tsx:57-83` — nowrap flex action cluster hosting copy + siblings.
- `TopNav/TopNavWrapper.tsx:30-48` — page header shell, no mobile breakpoint overrides.
- `OrderDetails/OrderDetails.tsx:62-68` — loading renders page with `order` undefined; copy still mounts (acceptable: copies current route URL).

### Integration / siblings

- `src/components/icons/index.ts:12-16` — `iconSize.medium` = 20 for TopNav icons.
- `Title.tsx:31-37` — skeleton when `order` missing; title reflow independent of copy button.
- `TrackingNumberDisplay.tsx`, `CopyableText.tsx` — hover-gated copy siblings (contrast: TopNav copy is always touch-visible).

### Tests overlapping

- `OrderDetailsPage.test.tsx:91-108` — DOM order `copy-order-link` before `show-order-metadata`.
- `OrderCopyLinkButton.test.tsx` — mocked hook + live-region remount test.
- `useClipboard.test.ts` — timer and generation behavior.
- `playwright/tests/orders.spec.ts:155-190` — desktop-only E2E path.

### Chrome mobile walkthrough (Storybook fallback)

- Published Storybook `InOrderDetailsTopNav` at 375×812 and 320×568; production `localhost:9000` unreachable (connection refused).
- Touch tap → copied label/icon; rapid double-tap via script keeps copied ≥1.5s (timer fix verified).
- Published Storybook bundle predates `aria-live` in DOM (`querySelectorAll('[aria-live]').length === 0`); branch source and unit tests assert live region — walkthrough for SR remount relied on source + `OrderCopyLinkButton.test.tsx:101-126`.
