---
agent: step-3-ui-reviewer
input_branch: 3bad0a0316be83017335df6a609380694e097541
verdict: fail
---

## Summary

The OrderCopyLinkButton prototype delivers the intended TopNav placement, i18n labels, and seven declared Storybook states with visually distinct hover/focus/active/copied previews. Active-state contrast and cognitive-load checks pass. The review fails because story-only interaction-preview logic with five hardcoded rgb/rgba literals is embedded in the production `OrderCopyLinkButtonContent` component (token-purity and story-hygiene violations), and all measured touch targets are below 44×44 px (though copy button matches its metadata sibling at 32×32, indicating an established TopNav icon-button convention rather than a regression).

## Findings

### F-001 [BLOCKER] Story-only preview styles with raw color literals in production component
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` (lines 9–33, 47–48, 67)
- Description: Hover, focus, and active Storybook states are simulated via an `interactionPreview` prop and `interactionPreviewStyle` map containing inline `style={previewStyle}` on the Macaw `Button`. The map uses five raw rgb/rgba literals instead of design tokens, and this story-only mechanism lives in the production component file rather than an isolated story helper or `.story*` CSS module.
- Evidence:
  ```typescript
  const interactionPreviewStyle: Record<OrderCopyLinkButtonInteractionPreview, CSSProperties> = {
    hover: { backgroundColor: "rgba(0, 0, 0, 0.1)", ... },
    focus: { backgroundColor: "rgb(255, 255, 255)", outline: "2px solid rgb(37, 40, 40)", ... },
    active: { backgroundColor: "rgba(0, 0, 0, 0.16)", ... },
  };
  ```
  `interactionPreview` is only referenced from `OrderCopyLinkButton.stories.tsx` (lines 30, 34, 38), never from `OrderCopyLinkButton.tsx` production wrapper.
- Suggested fix: Move `interactionPreview` / `interactionPreviewStyle` into a story-only wrapper (e.g. `OrderCopyLinkButtonStoryPreview.tsx` imported only by stories) or use Storybook `parameters.pseudo` / play functions to trigger real Macaw hover/focus/active states. Replace any remaining preview colors with Macaw CSS variables (`var(--mu-colors-*)`) if manual overrides remain necessary.

### F-002 [WARNING] Touch targets below 44×44 px but consistent with TopNav icon-button family
- Location: `InOrderDetailsTopNav` story / runtime TopNav composition
- Description: Copy button measures 32×32 px; WCAG 2.5.5 recommends ≥44×44 px for touch targets. However, the adjacent metadata secondary icon button (`show-order-metadata`) is also 32×32 px, matching the established TopNav secondary icon-button pattern. Back navigation is 40×40 px (different control family). This is an org-wide Macaw compact-button convention, not a regression where the new button is smaller than its siblings.
- Evidence: Runtime measurement via Storybook iframe (`InOrderDetailsTopNav`):
  - `copy-order-link`: 32×32 px
  - `show-order-metadata`: 32×32 px (neighbor comparison — matches)
  - `app-header-back-button`: 40×40 px (different family)
  - Screenshot: `docs/DEV-85/findings/prototype/iteration-001/screenshots/in-order-details-top-nav.png`
- Suggested fix: Flag for design-system follow-up to increase Macaw secondary icon-button hit area globally (e.g. min 44×44 via padding). No single-component regression fix required for this prototype iteration.

### F-003 [WARNING] Story focus/hover/active previews approximate Macaw tokens rather than exercising real component states
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (Hover, Focus, Active stories)
- Description: Hover/Focus/Active stories inject hardcoded inline styles instead of triggering native Macaw `Button` pseudo-states. Focus story shows `outline: 2px solid rgb(37, 40, 40)` which may diverge from production keyboard focus when users tab to the real button in OrderDetailsPage.
- Evidence: Focus story screenshot shows manual outline ring — `docs/DEV-85/findings/prototype/iteration-001/screenshots/focus.png`. Production path uses `<Button variant="secondary">` without `interactionPreview`.
- Suggested fix: Use Storybook interaction tests or `:hover`/`:focus-visible` pseudo-state parameters so stories reflect actual Macaw rendering.

## Mechanical check summary

| Check | Status | Notes |
|---|---|---|
| anti-patterns | fail | Inline hardcoded preview styles in production component file |
| contrast | pass | Active states: icon 4.08–5.14:1 (non-text ≥3:1); focus ring 14.86:1. Disabled/error skipped per rules |
| touch-target | fail | All targets <44 px; copy matches metadata sibling (32×32) — WARNING not BLOCKER |
| token-purity | fail | Five rgb/rgba literals in `interactionPreviewStyle` |
| state-coverage | pass | All 7 declared states have distinct story exports; Default≡Error is spec-intentional |
| cognitive-load | pass | 3 interactive TopNav items in story (back, copy, metadata); ≤5 nav, ≤4 per group |

## Nielsen heuristic scores (0–4)

| Heuristic | Score | Notes |
|---|---|---|
| 1. Visibility of system status | 3 | Copied state updates icon + aria-label; error intentionally silent per spec |
| 2. Match between system and real world | 3 | Standard clipboard icon; plain-language labels via i18n |
| 3. User control and freedom | 3 | One-click copy; disabled prevents interaction |
| 4. Consistency and standards | 3 | Matches metadata sibling styling; back button larger (40 px) |
| 5. Error prevention | 2 | Disabled guard present; clipboard failure has no UI feedback (by design) |
| 6. Recognition rather than recall | 2 | Icon-only; label available via title/aria-label on focus |
| 7. Flexibility and efficiency | 3 | Single-click copy for power users |
| 8. Aesthetic and minimalist design | 4 | Compact, fits TopNav without clutter |
| 9. Help users recognize/diagnose/recover from errors | 2 | Error state matches default by design — acceptable for prototype but low score |
| 10. Help and documentation | 2 | Relies on tooltip; acceptable for dashboard pattern |
