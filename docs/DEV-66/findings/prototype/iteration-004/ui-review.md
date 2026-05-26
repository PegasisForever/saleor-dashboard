---
agent: step-3-ui-reviewer
input_branch: 3b7f75ab9ea285ec7b621260829aff022f08b6a6
verdict: fail
---

## Summary

Iteration-004 delivers eight visually distinct Storybook states with token-pure CSS and a passing Focus-story affordance (accent1 outline 6.42–6.89:1 vs backgrounds). Active-state icon contrast meets WCAG 2.5.5 on default/hover/focus/active stories. However, the ≥3:1 focus ring documented in `ui-design.md` exists only in story CSS — production `OrderCopyLinkButton` still relies on macaw secondary defaults with no measurable focus-visible indicator — which blocks merge. Secondary icon buttons remain 32×32, matching the metadata neighbor (fleet convention, WARNING).

## Mechanical checks

| Check | Status | Notes |
|---|---|---|
| anti-patterns | pass | No gradient text, glassmorphism, nested cards, or system fonts in component/story sources |
| contrast | pass | Active states: icon non-text ≥3.02:1; Focus story outline ≥6.42:1. Inactive states skipped. Resting border 1.35:1 is supplementary, not the declared focus affordance |
| touch-target | pass | Copy button 32×32; matches `show-order-metadata` secondary icon neighbor (WARNING, not regression) |
| token-purity | pass | Story CSS uses `var(--mu-colors-*)` only; no hex/rgb literals in component tree |
| state-coverage | pass | 8 declared states ↔ 8 story exports; Disabled (opacity 1) vs Loading (opacity 0.5) visually distinct |
| cognitive-load | pass | TopNav action cluster: copy + metadata + menu = 3 items (≤4); total interactive chrome ≤5 |

## Nielsen heuristics (0–4)

| # | Heuristic | Score | Rationale |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Icon swap on copy is clear; loading/error are story-only placeholders |
| 2 | Match system / real world | 4 | Standard copy/check iconography consistent with orders domain |
| 3 | User control & freedom | 4 | Single reversible action; no traps |
| 4 | Consistency & standards | 4 | Aligns with `ClipboardCopyIcon` / `TrackingNumberDisplay` patterns |
| 5 | Error prevention | 3 | Empty `orderId` returns null; clipboard is synchronous |
| 6 | Recognition vs recall | 4 | `aria-label` + `title` from `messages.copyOrderLink` |
| 7 | Flexibility / efficiency | 3 | Keyboard-activatable; no shortcut beyond standard button |
| 8 | Aesthetic & minimalist design | 4 | Icon-only secondary control fits TopNav density |
| 9 | Help users recognize/diagnose/recover from errors | 2 | Error story documents alert; production has no failure path |
| 10 | Help & documentation | 3 | Tooltip via `title`; no inline help for empty/null case |

## Findings

### F-001 [BLOCKER] Production keyboard focus lacks documented ≥3:1 affordance

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`; contrast with `OrderCopyLinkButton.stories.module.css:5-10` and `docs/DEV-66/ui-design.md:29-30`
- Description: UI design declares a `text-accent1` outline ring as the focus indicator (≥3:1 non-text contrast). That ring is implemented only in the Focus **story** via `.storyFocus`. The production component uses vanilla macaw `Button` with no focus override; programmatic/keyboard focus on the Default story shows `outlineWidth: 0px` and resting border contrast 1.35:1 vs page — below the 3:1 non-text threshold for a focus indicator.
- Evidence: Focus story measurement — outline `rgb(35, 57, 251)` vs page 6.89:1 (`evidence/state-focus.png`). Default story keyboard focus — `outlineWidth: 0px`, border vs page 1.35:1 (`evidence/state-default-keyboard-focus.png`). Story CSS lines 5–10; production TSX has no equivalent styles.
- Suggested fix: Port the Focus-story ring (or equivalent macaw `:focus-visible` override using `--mu-colors-text-accent1`) into production styles on `OrderCopyLinkButton`, or extend macaw Button focus tokens so keyboard users in `OrderDetailsPage` receive the same affordance validated in the Focus story.

### F-002 [WARNING] Resting secondary button border below non-text contrast threshold

- Location: Default story / macaw secondary `Button` chrome
- Description: Resting border `rgb(217, 222, 227)` vs fill `rgb(255, 255, 255)` measures 1.35:1 (non-text threshold 3:1). Icon glyph at 4.08:1 still identifies the control; this is fleet-wide macaw secondary chrome, not copy-button-specific regression.
- Evidence: Live measurement on deploy `3334d95e…` Default iframe; `evidence/state-default.png`
- Suggested fix: Track as design-system follow-up; do not block solely on this if icon + focus affordance pass.

### F-003 [WARNING] Touch target 32×32 matches established TopNav icon-button fleet

- Location: `OrderCopyLinkButton.tsx:33-42`; neighbor `OrderDetailsPage.tsx:212-218`
- Description: Copy button measures 32×32 px, below the 44×44 pt guideline. The adjacent metadata secondary icon button uses the same macaw secondary icon-only sizing — convention match, not a regression introduced by this control.
- Evidence: `getBoundingClientRect` width/height 32 on all active-state stories; metadata button same `variant="secondary"` + icon pattern in `OrderDetailsPage.tsx:212-218`
- Suggested fix: Flag for org-wide Macaw compact-button audit; optional `min-width/min-height` padding wrapper if policy changes.

### F-004 [WARNING] Error affordance is Storybook-only

- Location: `OrderCopyLinkButton.stories.tsx:81-99`; `OrderCopyLinkButton.tsx`
- Description: Error story renders `role="alert"` failure copy, but production component has no clipboard-failure branch or alert UI.
- Evidence: Error story snapshot shows alert text (`evidence/state-error.png`); production component ends at `useClipboard` with no error handling.
- Suggested fix: Implement failure feedback in production or defer Error story until implementation phase and note in tech plan.

### F-005 [WARNING] No TopNav composition story for integration preview

- Location: `OrderCopyLinkButton.stories.tsx` (story list)
- Description: All eight stories isolate the button on a padded canvas. There is no story placing the button beside metadata/menu in a `TopNav` layout, so spacing overlap and action-cluster density are unverified in Storybook.
- Evidence: Story titles under `Orders/OrderCopyLinkButton` only; integration exists only in `OrderDetailsPage.tsx:210-232`
- Suggested fix: Add `InOrderDetailsTopNav` composition story with copy + metadata + menu siblings for holistic review.
