---
agent: step-3-ui-reviewer
input_branch: 39bcb876e2596c04f815d420781de977f9e5b243
verdict: fail
---

## Summary

OrderCopyLinkButton is well-structured (token-pure CSS, i18n labels, macaw secondary pattern aligned with the metadata sibling), and active-state contrast passes WCAG thresholds. Storybook state coverage fails mechanically: three declared interaction states (`hover`, `active`, `copied`) do not render visually distinct settled output in their dedicated stories—hover/active rely on ephemeral pointer/focus chrome that collapses after play, and the Copied story never reaches the copied visual on load. Verdict is **fail**.

## Mechanical checks

| Check | Status | Notes |
| --- | --- | --- |
| anti-patterns | pass | No gradient text, nested cards, glassmorphism, or system fonts in component CSS/TSX |
| contrast | pass | Active states only: icon non-text 3.81–4.08:1 (≥3:1); focus ring 13.87:1 (≥3:1). Disabled skipped (inactive) |
| touch-target | pass | Measured 32×32 px; matches same-family metadata `Button` neighbor at 32×32 (WARNING F-004, not a regression) |
| token-purity | pass | `OrderCopyLinkButton.module.css` uses `--mu-colors-*` tokens only; no hex/rgb literals |
| state-coverage | fail | Hover≈Default, Active≈Focus, Copied story never settles to copied visuals after play |
| cognitive-load | pass | Single icon control; TopNav cluster ≤5 items |

## Nielsen heuristics (0–4)

| Heuristic | Score | Rationale |
| --- | --- | --- |
| Visibility of system status | 3 | Copied state swaps icon + `aria-label`; no toast (by design). Storybook copied story fails to demonstrate feedback |
| Match between system and real world | 4 | Copy/check icons are standard affordances |
| User control and freedom | 4 | Single reversible click; no modal trap |
| Consistency and standards | 4 | Matches metadata icon-only secondary TopNav pattern |
| Error prevention | 3 | Synchronous clipboard; no error surface (N/A per design) |
| Recognition rather than recall | 4 | `title` + `aria-label` expose action text |
| Flexibility and efficiency of use | 4 | One-click copy for staff workflow |
| Aesthetic and minimalist design | 4 | Icon-only preserves TopNav space |
| Help users recognize, diagnose, recover from errors | 2 | No error/empty state; clipboard failure silent |
| Help and documentation | 3 | Tooltip via `title`; no inline help beyond label |

## Findings

### F-001 [BLOCKER] Hover story settled output identical to Default

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (`Hover` export, lines 39–46)
- Description: After the play function completes, the Hover story renders the same settled fingerprint as Default (white background `rgb(255,255,255)`, no outline, copy icon). Hover styling only appears while the pointer is actively over the button (`rgb(246,247,249)` + shadow when hovered live), so the dedicated story does not exercise the declared `hover` state for review or design sign-off.
- Evidence: Runtime fingerprints on deploy — Default and Hover stories both report `bg: rgb(255, 255, 255)`, `outlineWidth: 0px`, `aria-label: Copy order link`. Live hover on Default story confirms hover styles exist but are not captured by the Hover story export. Screenshot: `docs/DEV-78/findings/prototype/iteration-001/evidence/hover.png` vs `default.png`.
- Suggested fix: Use a persistent pseudo-state (e.g. Storybook `parameters.pseudo.hover: true`) or a story-only wrapper that applies the macaw hover class/token background so settled output differs from Default.

### F-002 [BLOCKER] Active story settled output identical to Focus

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (`Active` export, lines 54–61); `:active` rule in `OrderCopyLinkButton.module.css` lines 6–8
- Description: The Active story play (`userEvent.pointer` mouse-down) settles to the same visual as Focus: `bg rgb(246,247,249)`, `outline 2px solid`, copy icon, `aria-label Copy order link`. The `:active` pressed background matches focus/hover tint, so the declared `active` state is not visually distinguishable from `focus` in Storybook.
- Evidence: Runtime fingerprints — Focus and Active stories both report identical `bg`, `outline`, `boxShadow`, `aria-label`, and `lucide-copy` icon after 2.5s settle. Screenshot: `docs/DEV-78/findings/prototype/iteration-001/evidence/active.png` vs `focus.png`.
- Suggested fix: Give `:active` a distinct pressed treatment (darker inset/shadow or remove focus ring during active-only story via `parameters.pseudo.active: true` isolated from focus), or split stories with explicit story decorators.

### F-003 [BLOCKER] Copied story does not render copied state after play settles

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (`Copied` export, lines 69–76)
- Description: After navigation and ≥5s settle, the Copied story still shows `aria-label="Copy order link"` and `lucide-copy`. Manual click in the iframe succeeds (`Order link copied` + check icon), proving the component works but the story play/interaction pipeline does not reach the declared `copied` state for static review.
- Evidence: `evaluate_script` on deploy after 5s wait: `{ aria: "Copy order link", icon: "lucide lucide-copy" }`; after manual click: `{ aria: "Order link copied", icon: "lucide lucide-check" }`.
- Suggested fix: Seed copied state via a decorator wrapping `useClipboard` mock, or use `play` with `await userEvent.click` + `await waitFor(() => expect(...))` and ensure clipboard mock is idempotent; alternatively export a `Copied` story with a thin wrapper that passes `hasBeenClicked` if exposed.

### F-004 [WARNING] Touch target 32×32 px matches established TopNav icon-button convention

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` lines 33–49; sibling `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` lines 212–219
- Description: Measured touch target is 32×32 px on all states, below the 44×44 pt WCAG target. The new button matches the existing metadata secondary icon `Button` (same `variant="secondary"`, `iconSize.medium`, `marginRight={3}`)—this is org-wide macaw sizing, not a regression introduced by this component.
- Evidence: `getBoundingClientRect()` → width/height 32 on `[data-test-id="copy-order-link"]` across all six stories.
- Suggested fix: Track as design-system follow-up to increase macaw secondary icon button hit area (padding/min-size) across TopNav actions; out of scope for blocking this prototype if convention is accepted.

### F-005 [WARNING] Storybook clipboard mock throws on repeat story navigation

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` lines 8–14 (decorator `mockClipboard`)
- Description: `Object.assign(navigator, { clipboard: ... })` fails on subsequent story loads with "Cannot set property clipboard of #<Navigator> which has only a getter", surfacing a Storybook error overlay when navigating between stories in one session.
- Evidence: Sub-agent observed error overlay on Default→Hover sidebar navigation; brittle decorator pattern.
- Suggested fix: Use `Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } })` or Storybook `beforeEach` spy pattern used elsewhere in the repo.

### F-006 [WARNING] ui-design.md overstates touch-target size

- Location: `docs/DEV-78/ui-design.md` line 46
- Description: Mobile section claims "44×44 pt touch target via default Button padding" but runtime measurement shows 32×32 px for both copy and metadata buttons.
- Evidence: Runtime `getBoundingClientRect()` on deployed Storybook; macaw secondary icon button actual size.
- Suggested fix: Update ui-design.md to document actual 32×32 px macaw secondary sizing and reference org-wide follow-up, or plan padding adjustment if 44 pt is a hard requirement.
