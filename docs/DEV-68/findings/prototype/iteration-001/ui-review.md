---
agent: step-3-ui-reviewer
input_branch: c1c04f5d5402179b16faa1c9390403e3c97d252f
verdict: fail
---

## Summary

Storybook deploy is present and the `OrderCopyLinkButton` component is well-structured (macaw tokens, i18n messages, accessible labels). Active-state contrast passes on all measured states (icon ≥ 3:1, focus ring 16.54:1). However, the **Hover** story fails state-coverage: its settled rendering is pixel-identical to **Default**, so one declared state is not visually exercised. Touch targets measure 32×32 px — matching the metadata neighbor button (same-family convention, WARNING not regression BLOCKER) but still below the 44×44 pt bar.

## Mechanical checks

| Check | Status | Notes |
| --- | --- | --- |
| anti-patterns | pass | No gradient text, nested cards, glassmorphism, or custom system-font overrides in component sources |
| contrast | pass | Active states only: icon 3.81–4.08:1 (non-text, ≥3:1); focus ring 16.54:1; disabled skipped per rules |
| touch-target | fail | All interactive surfaces 32×32 px (`copy-order-link`, `show-order-metadata`); back button 40×40 px — all sub-44 |
| token-purity | pass | No hex/rgb literals in `OrderCopyLinkButton.tsx`, `messages.ts`, or `ClipboardCopyIcon.tsx` |
| state-coverage | fail | Hover story settled output identical to Default (see F-001) |
| cognitive-load | pass | InTopNav composition: back + title + 2 action buttons; well within Miller limits |

## Nielsen heuristics (0–4)

| # | Heuristic | Score | Rationale |
| --- | --- | --- | --- |
| 1 | Visibility of system status | 3 | Copied state swaps icon + aria-label; no in-button progress for clipboard |
| 2 | Match between system and real world | 4 | "Copy order link" / "Link copied" are plain-language |
| 3 | User control and freedom | 4 | Non-destructive one-click action |
| 4 | Consistency and standards | 4 | Reuses `ClipboardCopyIcon` + `useClipboard` orders pattern |
| 5 | Error prevention | 2 | Clipboard failure is console-only per design; no user-facing guard |
| 6 | Recognition rather than recall | 4 | Icon + `title`/`aria-label` on every state |
| 7 | Flexibility and efficiency of use | 4 | Single-click absolute URL copy |
| 8 | Aesthetic and minimalist design | 4 | Icon-only secondary button fits TopNav density |
| 9 | Help users recognize, diagnose, recover from errors | 2 | No UI feedback on clipboard write failure |
| 10 | Help and documentation | 3 | Accessible name present; no contextual help beyond tooltip |

## Findings

### F-001 [BLOCKER] Hover story does not render a visually distinct hover state

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (lines 28–35); Storybook `orders-ordercopylinkbutton--hover`
- Description: After the `play` function completes and animations settle, the Hover story renders the same computed styles as Default (`backgroundColor: rgb(255, 255, 255)`, identical box-shadow). The declared `hover` state in `ui-design.md` § States is therefore not visually covered — reviewers and design sign-off cannot distinguish Hover from Default at rest.
- Evidence:
  - Default settled: `backgroundColor: rgb(255, 255, 255)`, `boxShadow: rgba(19, 32, 48, 0.16) 0px 1px 1px 0px`
  - Hover settled (2 s after navigation): identical values
  - Manual `:hover` on the same button yields `backgroundColor: rgb(246, 247, 249)` — confirming hover styling exists but the story does not preserve it
  - Screenshots: `docs/DEV-68/findings/prototype/iteration-001/evidence/default.png` vs `hover.png` (visually indistinguishable)
- Suggested fix: Pin hover visually in the story — e.g. use Storybook `pseudo` parameter (`hover: true`), a decorator that applies `:hover` via class, or keep the pointer hovered after `userEvent.hover` without releasing (and document that the story requires `:hover` pseudo-state).

### F-002 [WARNING] Touch targets 32×32 px match TopNav secondary-button convention but miss 44×44 pt

- Location: `OrderCopyLinkButton.tsx`; Storybook `InTopNav` composition; `OrderDetailsPage.tsx` metadata button (same family)
- Description: Measured touch targets for `data-test-id="copy-order-link"` are 32×32 px in every state story and in `InTopNav`. The metadata neighbor button (`show-order-metadata`) is also 32×32 px — this matches an established macaw secondary icon-button pattern, not a regression introduced by this component. Still below WCAG 2.5.5 target-size guidance (44×44 pt).
- Evidence:
  - `copy-order-link`: 32×32 px (all 7 story visits)
  - `show-order-metadata` neighbor: 32×32 px (`in-top-nav` story)
  - `app-header-back-button`: 40×40 px (also sub-44)
  - Screenshot: `docs/DEV-68/findings/prototype/iteration-001/evidence/in-top-nav.png`
- Suggested fix: Track as design-system follow-up (macaw `Button` compact sizing). No per-component shrink vs neighbors; do not block on convention match alone once Hover coverage is fixed.

### F-003 [WARNING] ui-design.md overstates macaw Button touch-target size

- Location: `docs/DEV-68/ui-design.md` line 47
- Description: Mobile considerations claim "macaw `Button` meets ≥ 44×44 px touch target at default sizing", but runtime measurement shows 32×32 px for secondary icon buttons in Storybook and production-adjacent `InTopNav` composition.
- Evidence: Chrome `getBoundingClientRect()` measurements above; Lighthouse a11y 100 on Default story does not override explicit dimension measurement.
- Suggested fix: Revise the mobile considerations bullet to reflect measured 32×32 px (or document macaw padding/hit-slop if a larger effective target exists — none observed in bounding rect).
