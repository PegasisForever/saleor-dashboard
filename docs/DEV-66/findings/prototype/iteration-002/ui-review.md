---
agent: step-3-ui-reviewer
input_branch: 9a98d2fd75f21b7d9a968ded8b8968085e7ae902
verdict: fail
---

## Summary

Iteration-002 delivers a well-scoped `OrderCopyLinkButton` with correct i18n, token-based styling in production code, and full Storybook state exports (8/8). Static checks (anti-patterns, token purity, cognitive load, state-story presence) pass. Runtime review against the deployed Storybook found **non-text contrast failures on three declared active states** (hover, focus, active stories) and **story CSS that misrepresents production Macaw secondary-button interaction colors**. Touch targets measure 32×32px—below WCAG 44pt guidance but consistent with the existing TopNav icon-button family (WARNING, not a regression). Nielsen heuristic average ~3.1/4; weakest areas are error-recovery (story-only) and hover/focus story fidelity.

## Mechanical checks

| Check | Status | Notes |
|---|---|---|
| anti-patterns | pass | No gradient text, nested cards, glassmorphism, or system fonts in component sources |
| contrast | fail | Hover/active story icon 1.11:1 (non-text, threshold 3:1); Focus story outline 1.76:1 (non-text, threshold 3:1). Default story passes (icon 4.08:1). Inactive states skipped per rules |
| touch-target | pass | 32×32px on all button states; matches macaw secondary icon-only neighbor in `OrderDetailsPage` (convention-calibrated WARNING) |
| token-purity | pass | Production TSX uses macaw tokens only; story CSS uses `var(--mu-colors-*)` (no hex/rgb literals) |
| state-coverage | pass | 8 declared states → 8 story exports; each renders visually distinct output |
| cognitive-load | pass | TopNav action cluster: copy + metadata + menu (3 items); no pricing tiers |

## Nielsen heuristics (0–4)

| # | Heuristic | Score | Rationale |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Copy→check icon swap gives transient success feedback; loading/error not wired in production |
| 2 | Match between system and real world | 4 | Standard clipboard iconography; localized label |
| 3 | User control and freedom | 4 | Simple reversible action; no destructive side effects |
| 4 | Consistency and standards | 4 | Matches orders-domain copy controls (`ClipboardCopyIcon`, `TrackingNumberDisplay`) |
| 5 | Error prevention | 3 | Empty `orderId` returns null (silent omission—see F-004) |
| 6 | Recognition rather than recall | 3 | Icon-only but `aria-label`/`title` provide text equivalent |
| 7 | Flexibility and efficiency | 3 | Keyboard activatable; no shortcut |
| 8 | Aesthetic and minimalist design | 4 | Single icon button; no visual clutter |
| 9 | Help users recognize, diagnose, recover from errors | 2 | Error story documents intent; production component has no failure affordance |
| 10 | Help and documentation | 3 | Storybook states document interaction variants |

**Average: 3.1 / 4**

## Findings

### F-001 [BLOCKER] Hover and Active story states fail non-text contrast
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` (`.storyHover`, `.storyActive`); Storybook stories Hover, Active
- Description: Clipboard icon (`color: default2`, rgb(124,126,126)) against story-forced accent backgrounds (`--mu-colors-background-accent1-hovered` / `pressed`) yields **1.11:1** non-text contrast, below the 3:1 WCAG 2.5.5 threshold for active interaction states.
- Evidence: Measured in deployed Storybook (`docs/DEV-66/findings/prototype/iteration-002/evidence/hover.png`, `active.png`); independent verification via `evaluate_script` on hover story returned `iconContrast: "1.11"`.
- Suggested fix: Replace story-only background overrides with selectors that mirror production macaw `:hover`/`:active` computed styles, or adjust icon token on accent backgrounds so contrast ≥ 3:1.

### F-002 [BLOCKER] Focus story focus-ring fails non-text contrast
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` (`.storyFocus`); Storybook story Focus
- Description: Story-forced `outline: 2px solid var(--mu-colors-border-default1-focused)` measures **1.76:1** against the default button background—below the 3:1 non-text threshold for focus indicators on an active state.
- Evidence: `docs/DEV-66/findings/prototype/iteration-002/evidence/focus.png`; `evaluate_script` on focus story returned `outlineContrast: "1.76"`.
- Suggested fix: Use the production macaw focus-visible treatment (border change at 3.34:1 on default story) or pick a focus token pairing that meets 3:1 against the button surface.

### F-003 [WARNING] Story hover/active backgrounds do not match production Macaw secondary Button
- Location: `OrderCopyLinkButton.stories.module.css` vs runtime on Default story
- Description: Hover/Active stories force `--mu-colors-background-accent1-hovered/pressed` (blue tint), but real macaw secondary button hover/press on the Default story yields `rgb(246, 247, 249)` with icon contrast **3.81:1** (passes). Stories therefore misdocument the interaction states declared in `ui-design.md` § States.
- Evidence: Real hover via chrome-devtools MCP on Default story: `bg: "rgb(246, 247, 249)", iconContrast: "3.81"`. Hover story: `bg: "rgba(5, 109, 255, 0.12)", iconContrast: "1.11"`.
- Suggested fix: Update `.storyHover`/`.storyActive` to apply the same background tokens macaw renders on `:hover`/`:active` for `Button variant="secondary"`, or document that accent1 tokens are aspirational and not production-accurate.

### F-004 [WARNING] Empty state renders blank canvas with no affordance
- Location: `OrderCopyLinkButton.tsx:26-28`; Storybook story Empty
- Description: When `orderId` is empty the component returns `null`, leaving a blank story canvas. This is intentional per ui-design but provides no visual or textual cue in isolation—admins cannot distinguish "missing order" from a broken story.
- Evidence: `docs/DEV-66/findings/prototype/iteration-002/evidence/empty.png`; a11y tree shows empty iframe main.
- Suggested fix: Add a story-only placeholder caption (e.g., "Component hidden when orderId is empty") or a dashed outline in the Empty story wrapper.

### F-005 [WARNING] Touch target 32×32px matches org-wide compact icon-button convention
- Location: `OrderCopyLinkButton.tsx`; all interactive story states
- Description: Copy button measures 32×32px, below the 44×44pt WCAG target-size guidance. This matches the adjacent metadata `Button variant="secondary"` icon-only pattern in `OrderDetailsPage.tsx` (same macaw primitive, 16px icon)—an established codebase convention, not a regression introduced by this feature.
- Evidence: `getBoundingClientRect` → 32×32 on Default story; neighbor comparison in `OrderDetailsPage.tsx:212-218`.
- Suggested fix: Track as design-system follow-up to enlarge TopNav icon buttons or add invisible hit-area padding; no blocker for this ticket.

### F-006 [WARNING] Loading and error states are story-only prototypes
- Location: `OrderCopyLinkButton.stories.tsx` (Loading, Error); `OrderCopyLinkButton.tsx`
- Description: Loading (opacity + `aria-busy`) and error (`role="alert"`) affordances are documented in ui-design and rendered in Storybook but not implemented in the production component. Acceptable for prototype iteration but creates a gap between design artifacts and shippable UI.
- Evidence: `OrderCopyLinkButton.tsx` has no loading/error props; Loading story uses `storyStyles.storyLoading`; Error story renders external alert span.
- Suggested fix: Either wire failure/loading handling before production merge or mark these states explicitly as "future" in ui-design to avoid task-plan drift.
