---
agent: step-3-ui-reviewer
input_branch: a97b2c3d3f055f13ef4175119de5dd5b309045ea
verdict: fail
---

## Summary

Prototype iteration 2 delivers a well-structured `OrderCopyLinkButton` with macaw tokens, i18n messages, and six declared Storybook state exports. Icon contrast on active states meets the 3:1 non-text threshold (3.64:1–4.08:1). However, **Focus** and **Copied** stories settle to visuals identical to **Default**, failing state-coverage. Keyboard focus indicator contrast (border 1.35:1 vs page background) falls below the 3:1 non-text threshold declared in the design spec. Touch targets are 32×32 px, matching the metadata sibling but below the 44×44 mechanical bar — classified as WARNING per design-system convention.

## Mechanical checks

| Check | Status | Notes |
| --- | --- | --- |
| anti-patterns | pass | No gradient text, nested cards, glassmorphism, or system fonts in component sources |
| contrast | fail | Icon contrast passes (≥3:1) on default/hover/active/copied; keyboard focus border 1.35:1 vs adjacent bg fails 3:1 non-text threshold |
| touch-target | fail | Copy and metadata buttons measure 32×32 px (below 44×44); matches same-family neighbor → WARNING severity |
| token-purity | pass | No hex/rgb literals in component; stories use `vars.colors.*` tokens |
| state-coverage | fail | Focus and Copied stories render identically to Default at settled state |
| cognitive-load | pass | Single action button; TopNav composition ≤5 interactive items |

## Nielsen heuristics (0–4)

| Heuristic | Score | Rationale |
| --- | --- | --- |
| Visibility of system status | 3 | Copied state toggles icon + aria-label for ~2s; transient and absent from settled Copied story |
| Match between system and real world | 4 | Copy/check icon pair matches clipboard mental model |
| User control and freedom | 4 | Single reversible action; disabled guard available |
| Consistency and standards | 4 | Aligns with tracking-number copy pattern and macaw secondary button |
| Error prevention | 3 | Disabled prop prevents interaction; no clipboard-failure UI |
| Recognition rather than recall | 4 | Icon + tooltip/aria-label; no hidden affordance |
| Flexibility and efficiency | 3 | One-click copy; no keyboard shortcut |
| Aesthetic and minimalist design | 4 | Icon-only, no visual clutter |
| Help users recognize/diagnose errors | 2 | Clipboard failure logs to console only (inherited from `useClipboard`) |
| Help and documentation | 4 | Accessible name via i18n messages |

## Findings

### F-001 [BLOCKER] Focus story renders identically to Default at settled state

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (lines 67–74)
- Description: The `Focus` story uses a play function calling `button.focus()`, which does not trigger `:focus-visible` in the Storybook iframe. At settled render, computed styles match Default (white background, 1px border, no outline). This violates state-coverage: two declared states produce indistinguishable visuals.
- Evidence: Runtime measurement after play settles — `matchesFocusVisible: false`, `outlineWidth: 0px`, `backgroundColor: rgb(255, 255, 255)` — identical to Default. Screenshot comparison: `docs/DEV-68/findings/prototype/iteration-002/evidence/focus-keyboard.png` (keyboard Tab shows `:focus-visible: true` but still no distinct ring beyond default border).
- Suggested fix: Add a `createStateDecorator("focus")` (parallel to Hover/Active) applying macaw focus-ring tokens, or use Storybook pseudo-class addon. Do not rely on `.focus()` alone.

### F-002 [BLOCKER] Copied story reverts to Default before settled render

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (lines 86–99)
- Description: The `Copied` story play function clicks the button, but `useClipboard` resets `copied` to `false` after 2000 ms. At story settle time (≥2.5 s), aria-label is "Copy order link" and icon is `lucide-copy` — identical to Default. Active copied state (check icon, "Link copied") exists only transiently.
- Evidence: After 2.5 s wait on Copied story iframe: `ariaLabel: "Copy order link"`, `lucide-copy` icon. Immediate post-click (100 ms): `ariaLabel: "Link copied"`, `lucide-check` — confirms behavior works but story doesn't capture it.
- Suggested fix: Add story-only decorator forcing `hasBeenClicked={true}` via a wrapper component, or extend stories with a `visualCopied` render override independent of the 2 s timeout.

### F-003 [WARNING] Compact 32×32 touch targets match TopNav convention but fall below 44×44 bar

- Location: `OrderCopyLinkButton.tsx` + `InTopNav` story; documented in `ui-design.md` § Mobile considerations
- Description: Copy button measures 32×32 px across all states. InTopNav composition shows metadata button at identical 32×32 px; back navigation controls are 40×40 px. Sub-threshold but consistent with established macaw secondary icon-button sizing in TopNav — not a regression vs neighbors.
- Evidence: `getBoundingClientRect()` on `[data-test-id="copy-order-link"]`: 32×32; neighbor `[data-test-id="show-order-metadata"]`: 32×32; `[data-test-id="app-header-back-button"]`: 40×40.
- Suggested fix: Track as design-system follow-up for WCAG 2.5.5 target-size (24×24 minimum met; 44×44 recommended). No per-component fix required if org accepts macaw compact sizing.

### F-004 [WARNING] Keyboard focus indicator contrast below 3:1 non-text threshold

- Location: Macaw `Button variant="secondary"` focus styles (inherited); measured on Default story with keyboard Tab
- Description: When `:focus-visible` is true (keyboard Tab), the visible indicator is the existing 1px border (`rgb(217, 222, 227)`) at 1.35:1 vs white page background — below the 3:1 non-text threshold declared for Focus state in ui-design.md. No additional outline or high-contrast ring appears.
- Evidence: `borderContrastVsWhite: 1.35`, `outlineWidth: 0px`, `boxShadow: rgba(24, 40, 58, 0.1) 0px 2px 3px 0px`. Lighthouse accessibility score remains 100 (does not flag this).
- Suggested fix: Inherited from macaw-ui-next; escalate to design-system if focus ring contrast is a platform requirement. For Storybook, ensure Focus story demonstrates whatever production focus treatment is expected.

### F-005 [WARNING] Hover background tint is extremely subtle

- Location: `OrderCopyLinkButton.stories.tsx` Hover decorator; macaw token `vars.colors.background.default1Hovered`
- Description: Hover state applies `rgba(37, 40, 40, 0.06)` — a 6% opacity tint barely perceptible in screenshots. Computed styles differ from Default but low-vision users may not detect the change.
- Evidence: Hover `backgroundColor: rgba(37, 40, 40, 0.06)` vs Default `rgb(255, 255, 255)`; screenshots appear identical at normal viewing distance.
- Suggested fix: Accept as macaw secondary-button hover token, or consider stronger hover feedback if usability testing flags it.
