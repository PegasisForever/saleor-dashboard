---
agent: step-3-ui-reviewer
input_branch: 455b378cf3375ec43914bbcaefa4608f9fa4d1c1
verdict: fail
---

## Summary

Independent UI review of `OrderCopyLinkButton` prototype (iteration 001) against deployed Storybook and source artifacts. State-coverage, token-purity, and anti-pattern scans pass. Runtime contrast measurement fails on the **active** state (icon 2.89:1 vs 3:1 non-text minimum). Touch targets measure 32×32 px across all states — below the 44×44 WCAG target but identical to same-family TopNav secondary icon buttons (WARNING, not a regression). Nielsen heuristic walkthrough scores well overall (avg 3.5/4) with minor gaps in error-recovery feedback.

## Findings

### F-001 [BLOCKER] Active-state icon contrast below WCAG 2.5.5 non-text minimum

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:10-12` / Storybook `Active` story
- Description: When the button is in the pressed (`active`) state, the copy icon (`--mu-colors-text-default2`, computed `rgb(124, 126, 126)`) against the active background (`--mu-colors-background-default3`, computed `rgb(216, 217, 217)`) yields a contrast ratio of **2.89:1**, below the 3:1 non-text threshold declared in ui-design.md § Contrast commitments.
- Trigger: User presses and holds the copy button (mouse down or touch start) on order details TopNav at any viewport ≥320 px width, before release. Storybook reproduction: navigate to `orders-ordercopylinkbutton--active` with `forceActive: true`.
- Impact: During the brief press interval, the copy glyph becomes harder to distinguish against its background; users with low vision may not perceive the icon edge against the active fill.
- Evidence: Runtime measurement via `getComputedStyle` on settled active state; screenshot `docs/DEV-90/findings/prototype/iteration-001/evidence/active.png`. Other active states pass: default 4.08:1, hover 3.90:1, focus ring 14.86:1, copied 4.08:1.
- Suggested fix: Darken icon color on `:active` (e.g. `default1` instead of `default2`) or lighten `--mu-colors-background-default3` pairing; alternatively add an `:active` rule setting icon stroke to a token that maintains ≥3:1 against default3.

### F-002 [WARNING] Touch target 32×32 matches design-system convention; ui-design claim inaccurate

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:43-58` / `docs/DEV-90/ui-design.md:34`
- Description: Measured bounding box for `[data-test-id="copy-order-link"]` is **32×32 px** in every story state (default, hover, focus, active, disabled, copied). ui-design.md asserts "Macaw `Button` secondary variant meets ≥44×44 pt minimum," which is not supported by runtime measurement.
- Trigger: Render any `OrderCopyLinkButton` story or inspect the button in order details TopNav after page load at desktop viewport (1280×800).
- Impact: Touch and pointer users must aim at a 32 px target; mitigated because the size matches adjacent controls — no single-control regression vs neighbors.
- Evidence: Copy button 32×32 on all six states. Same-family neighbor `show-more-button` in TopNav `WithMenu` story: **32×32 px** (`components-applayout-topnav--with-menu`). Metadata button in `OrderDetailsPage.tsx:212-219` uses identical `variant="secondary"` + `iconSize.medium` pattern (not story-rendered; source parity). Screenshot: `evidence/default.png`.
- Suggested fix: Update ui-design.md touch-target note to reflect actual 32 px Macaw secondary icon sizing (org-wide convention), or increase button padding to ≥44 px if WCAG Target Size is a hard requirement for this ticket.

### F-003 [WARNING] No TopNav composition story for integrated cognitive-load verification

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (missing composition export)
- Description: ui-design.md describes the copy button within order details TopNav alongside metadata and overflow menu, but no composition story (e.g. `InOrderDetailsTopNav`) exists. Isolated button stories cannot validate action-cluster spacing, wrap behavior, or sibling interaction on narrow viewports.
- Trigger: Reviewer opens Storybook for `Orders/OrderCopyLinkButton` — only six isolated state stories render; no TopNav wrapper story is listed.
- Impact: Mobile wrap layout and action-cluster density (Miller's Law) were verified only via ui-design prose and `OrderDetailsPage.tsx` source, not visually in Storybook; regressions in composed layout would not appear in component-level visual regression.
- Evidence: Grep confirms zero `InOrderDetailsTopNav` / `OrderDetailsTopNav` story exports. `OrderDetailsPage.tsx:210-233` shows production composition (copy → metadata → menu).
- Suggested fix: Add a composition story wrapping `OrderCopyLinkButton` with metadata and `TopNav.Menu` siblings inside `TopNav`, including a narrow-viewport variant.

## Mechanical checks summary

| Check | Status | Notes |
|-------|--------|-------|
| anti-patterns | pass | No gradient text, glassmorphism, nested cards, or system fonts in component source/CSS |
| contrast | fail | Active state icon 2.89:1 < 3:1 non-text threshold |
| touch-target | pass | 32×32 matches same-family TopNav secondary icon buttons (convention, not regression) |
| token-purity | pass | All colors via `var(--mu-colors-*)`; no hex/rgb literals in component files |
| state-coverage | pass | Six declared states → six distinct story exports |
| cognitive-load | pass | Source review: 3 action controls in header cluster (copy, metadata, menu) + back link ≤5 nav items |

## Nielsen heuristics (0–4)

| # | Heuristic | Score | Notes |
|---|-----------|-------|-------|
| 1 | Visibility of system status | 4 | Copied state swaps icon + updates aria-label/title |
| 2 | Match between system and real world | 4 | Standard copy/check iconography |
| 3 | User control and freedom | 3 | Re-click within 2 s feedback window not story-tested |
| 4 | Consistency and standards | 4 | Matches metadata secondary icon button pattern |
| 5 | Error prevention | 3 | Disabled when no order.id (production); no inline validation |
| 6 | Recognition rather than recall | 4 | Icon + tooltip/aria-label, no memorization required |
| 7 | Flexibility and efficiency | 3 | Single action, no keyboard shortcut beyond Enter/Space |
| 8 | Aesthetic and minimalist design | 4 | Compact icon-only control, no visual noise |
| 9 | Help users recognize, diagnose, recover from errors | 2 | Clipboard failure silent per ui-design (known gap) |
| 10 | Help and documentation | 3 | Tooltip via title/aria-label; no contextual help link |

**Average: 3.4 / 4**

## Lighthouse accessibility (per state, snapshot mode)

| State | Score |
|-------|-------|
| default | 100 |
| hover | 100 |
| focus | 100 |
| active | 100 |
| disabled | 100 (contrast skipped per inactive-state rule) |
| copied | 100 |

Note: Lighthouse snapshot did not flag the active-state icon contrast deficit detected via direct color sampling — manual measurement takes precedence for per-element type thresholds.
