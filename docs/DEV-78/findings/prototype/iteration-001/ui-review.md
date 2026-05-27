---
agent: step-3-ui-reviewer
input_branch: 7db08b0a576c44b419ce7563f02c20c5d229aad2
verdict: fail
---

## Summary

The OrderCopyLinkButton prototype delivers a coherent TopNav copy affordance with correct i18n, macaw secondary styling, and passing non-text contrast on all active states (3.9–4.08:1 vs 3:1 threshold). Review fails on two mechanical checks: **state-coverage** (`Focus` story renders identical static args to `Default`, relying solely on `play()` for differentiation) and **token-purity** (raw `rgba()` box-shadow literals in the CSS module). Touch targets measure 32×32 px for the copy button but match same-family TopNav neighbors (metadata, menu), so this is flagged as a convention WARNING rather than a regression BLOCKER.

## Mechanical checks

| Check | Status | Notes |
|---|---|---|
| anti-patterns | pass | No gradient text, glassmorphism, nested cards, or system fonts |
| contrast | pass | Active states only; icon non-text 3.9–4.08:1 (≥3:1); disabled skipped |
| touch-target | pass | Copy 32×32 matches metadata 32×32 and menu 32×32 (convention, not regression) |
| token-purity | fail | `rgba(24, 40, 58, …)` literals in `OrderCopyLinkButton.module.css:3,8` |
| state-coverage | fail | `Focus` export lacks distinct static render/args vs `Default` |
| cognitive-load | pass | 4 TopNav items; 2 menu items; no pricing tiers |

## Nielsen heuristic scores (0–4)

| # | Heuristic | Score | Rationale |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Copy→Check icon + `aria-label` update; ~2 s revert may be missed |
| 2 | Match system ↔ real world | 4 | Conventional copy icon and labels |
| 3 | User control & freedom | 4 | Single reversible action; no modal trap |
| 4 | Consistency & standards | 4 | Matches metadata secondary icon button + `ClipboardCopyIcon` pattern |
| 5 | Error prevention | 3 | Disabled when no `orderId`; no guard for clipboard API failure |
| 6 | Recognition vs recall | 4 | Icon + tooltip/`aria-label`; no memorization required |
| 7 | Flexibility & efficiency | 3 | One-click copy; no keyboard shortcut |
| 8 | Aesthetic & minimalist | 4 | Icon-only; fits TopNav cluster without clutter |
| 9 | Help recognize/diagnose/recover | 2 | Clipboard failure logs `console.warn` only (`useClipboard.ts:24`) |
| 10 | Help & documentation | 2 | Relies on familiar copy affordance; no inline help |

**Average:** 3.3 / 4

## Runtime evidence (Storybook)

Base URL: `http://localhost:11000/ced5a50a-8962-4084-ba5d-267f52ba8ae5`

Screenshots: `docs/DEV-78/findings/prototype/iteration-001/screenshots/{default,hover,focus,active,disabled,copied}.png`

Lighthouse accessibility (desktop snapshot): **87** on all states. Failures are story-decorator issues (back link/button without accessible name), not the copy button itself.

### Per-state measurements

| State | Copy touch (W×H) | Neighbor metadata | Icon contrast (non-text) | Contrast skipped? |
|---|---|---|---|---|
| default | 32×32 | 32×32 | 4.08:1 ✓ | no |
| hover | 32×32 | 32×32 | 3.9:1 ✓ | no |
| focus | 32×32 | — | 4.08:1 ✓ | no |
| active | 32×32 | — | 3.9:1 ✓ | no |
| disabled | 32×32 | — | — | yes (inactive) |
| copied | 32×32 | — | 4.08:1 ✓ | no |

## Findings

### F-001 [BLOCKER] Focus story lacks static visual state differentiation

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:98-109`
- Description: The `Focus` export uses the same default render/args as `Default` (full `OrderCopyLinkButton` with `orderId`). Visual focus is applied only via `play()` calling `button.focus()`. Static/Chromatic snapshots and any viewer without interaction execution render `Focus` identically to `Default`, violating the one-distinct-visual-per-declared-state requirement.
- Evidence: `export const Default: Story = {}` (line 85) vs `export const Focus: Story = { play: … }` with no `render` override (lines 98–109). `Hover`/`Active` use `previewState` + CSS module classes for static differentiation (lines 88, 112).
- Suggested fix: Add a `previewState="focus"` (or equivalent CSS class simulating `:focus-visible` ring/box-shadow) to `OrderCopyLinkButtonView`, mirroring the `hover`/`active` pattern, and use it in the `Focus` story `render`.

### F-002 [BLOCKER] Hardcoded rgba box-shadow values violate token purity

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:3,8`
- Description: Storybook preview classes use raw `rgba(24, 40, 58, …)` box-shadow literals instead of macaw design tokens. Project styling rules require `var(--mu-colors-*)` (or equivalent token references) and prohibit hardcoded color values outside token files.
- Evidence:
  ```css
  box-shadow: rgba(24, 40, 58, 0.1) 0px 2px 3px 0px !important;
  box-shadow: rgba(24, 40, 58, 0.16) 0px 1px 2px 0px inset !important;
  ```
  No other component CSS in the repo uses this rgba pattern (repo-wide grep returns only this file).
- Suggested fix: Replace rgba literals with macaw shadow tokens if available, or reference documented macaw CSS variables for elevation/shadow rather than measured raw values.

### F-003 [WARNING] TopNav icon buttons measure 32×32 px (below 44×44 guideline)

- Location: Storybook TopNav composition — `docs/DEV-78/findings/prototype/iteration-001/screenshots/default.png`
- Description: The copy button measures 32×32 px via `getBoundingClientRect`. This is below the 44×44 pt touch-target guideline. However, same-family neighbors in the action cluster (metadata button, overflow menu trigger) also measure 32×32 px, matching the established macaw secondary icon-only button convention in TopNav — not a regression introduced by this component.
- Evidence: Runtime measurement on `default` story — copy 32×32, metadata 32×32, menu 32×32; back button 40×40. Production metadata button uses identical `variant="secondary"` without explicit size (`OrderDetailsPage.tsx:210-217`).
- Suggested fix: Track as org-wide design-system follow-up to increase TopNav icon button hit area (e.g., padding/min-size) without singling out this PR.

### F-004 [WARNING] Clipboard failure has no user-facing feedback

- Location: `src/hooks/useClipboard.ts:23-25`, consumed by `OrderCopyLinkButton.tsx:12-20`
- Description: When `navigator.clipboard.writeText` rejects (permissions denied, insecure context), the hook logs `console.warn` only. The button gives no visual or aria-live indication of failure, leaving users without diagnosis or recovery path.
- Evidence: `useClipboard.ts:23-25` — `.catch(() => { console.warn("Failed to use clipboard…"); })`; no state update or error callback.
- Suggested fix: Surface a toast or temporary error state on copy failure; at minimum, expose error state from the hook for the view to announce via `aria-live`.

### F-005 [WARNING] Story TopNav decorator back control lacks accessible name

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:45-47`
- Description: The story decorator's TopNav back link wraps an icon-only button with no `aria-label` or visible text. Lighthouse flags `button-name` and `link-name` on every state (score 87). This is a story-fixture gap, not production copy-button logic, but it depresses accessibility audit scores for the published Storybook bundle.
- Evidence: Lighthouse `button-name` failure on `div._18fs8ps2al > … > a._18fs8ps12c > button`; a11y snapshot shows unnamed back link button (uid=1_3).
- Suggested fix: Add `aria-label="Back to orders"` (or reuse existing TopNav back-link pattern) to the decorator's back control.
