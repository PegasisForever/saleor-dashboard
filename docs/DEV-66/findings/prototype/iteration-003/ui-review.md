---
agent: step-3-ui-reviewer
input_branch: 9eee24eef25fa1c7e0c5c4987c8a8aab47c7bb34
verdict: fail
---

## Summary

Iteration 3 resolves the iteration-002 icon-contrast regression (copy/check glyph now ≥3:1 on all active pseudo-states using macaw secondary tokens). State story coverage, token purity, anti-patterns, and cognitive-load checks pass. The review **fails** because the Focus story's keyboard-focus indicator — border token `--mu-colors-border-default1-focused` at 1.76:1 vs page background and 1.64:1 vs button fill — does not meet WCAG 2.4.11 / 1.4.11 non-text contrast (3:1), contradicting the ui-design claim that focus pseudo-states "pass WCAG non-text contrast." Touch targets remain 32×32, matching the existing TopNav secondary icon-button fleet (WARNING, not a regression).

## Mechanical checks

| Check | Status | Notes |
|---|---|---|
| anti-patterns | pass | No gradient text, nested cards, glassmorphism, or system fonts in component or story CSS |
| contrast | **fail** | Focus-state focus indicator border 1.76:1 vs page / 1.64:1 vs fill; focused-vs-unfocused bg delta 1.07:1 |
| touch-target | pass | Copy button 32×32 matches metadata `Button variant="secondary"` neighbor in `OrderDetailsPage.tsx:212-218` |
| token-purity | pass | Story CSS uses `--mu-colors-*` tokens only; component has no color literals |
| state-coverage | pass | All 8 declared states have distinct story exports |
| cognitive-load | pass | TopNav action cluster = 3 items (copy, metadata, menu) |

## Nielsen heuristics (0–4)

| # | Heuristic | Score | Rationale |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Icon swap to check communicates success; no live region (documented as intentional parity with orders copy controls) |
| 2 | Match between system and real world | 4 | "Copy order link" label is plain language |
| 3 | User control and freedom | 4 | Single reversible action; no modal trap |
| 4 | Consistency and standards | 4 | Matches `ClipboardCopyIcon` / `TrackingNumberDisplay` orders-domain pattern |
| 5 | Error prevention | 3 | Empty `orderId` returns null; no accidental copy of invalid URL |
| 6 | Recognition rather than recall | 4 | Universal copy icon + `aria-label` / `title` |
| 7 | Flexibility and efficiency of use | 4 | One-click absolute URL copy from TopNav |
| 8 | Aesthetic and minimalist design | 4 | Single icon button; no toast noise |
| 9 | Help users recognize, diagnose, and recover from errors | 2 | Error story documents `role="alert"` failure text, but production component does not surface clipboard errors |
| 10 | Help and documentation | 3 | Accessible name present; no contextual help beyond tooltip |

## Findings

### F-001 [BLOCKER] Focus indicator contrast below WCAG 3:1 threshold

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css:5-10` (Focus story); mirrors macaw secondary `:focus-visible` in production
- Description: The Focus story forces `--mu-colors-border-default1-focused` as the keyboard-focus indicator with `outline: none`. Measured settled-state contrast on the deployed Storybook (`orders-ordercopylinkbutton--focus`): border vs page background **1.76:1**, border vs button fill **1.64:1**, focused background vs page **1.07:1**. All are below the 3:1 non-text / focus-visible threshold. The copy icon itself passes (3.81:1 vs fill), but the border/background change is the declared focus affordance and remains sub-threshold. This contradicts ui-design.md L54 ("pass WCAG non-text contrast").
- Evidence: Independent `evaluate_script` measurement on `http://local-deploy:11000/c4afff6b-ce38-4250-86c6-57fc0458832b/iframe.html?id=orders-ordercopylinkbutton--focus&viewMode=story`; sub-agent evidence at `docs/DEV-66/findings/prototype/iteration-003/evidence/focus-a11y.txt`; Lighthouse a11y score 100 does not override manual focus-indicator measurement
- Suggested fix: Use a focus treatment with ≥3:1 contrast — e.g. a darker focus border token, an outline ring, or a focus background delta that meets 3:1 against adjacent colors. Re-measure focused-vs-unfocused state delta per WCAG 2.4.11. Update ui-design.md claim once verified.

### F-002 [WARNING] Touch target 32×32 below 44×44 WCAG target

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:33-42`; all active-state stories
- Description: Copy button measures 32×32 px (`getBoundingClientRect`) on every story with a rendered button. Below the 44×44 pt guideline, but **matches** the same-family metadata secondary icon button in `OrderDetailsPage.tsx:212-218` (also Macaw `Button variant="secondary"` icon-only). Classified as design-system convention, not a single-component regression.
- Evidence: `evaluate_script` on Default story (32×32); neighbor comparison documented in chrome audit
- Suggested fix: Track as a fleet-wide TopNav secondary icon-button improvement; no iteration-003 blocker.

### F-003 [WARNING] Resting secondary button border contrast 1.35:1

- Location: Macaw secondary `Button` default styling (visible in Default/Hover/Active stories)
- Description: Resting border `rgb(217,222,227)` vs white page/button fill yields **1.35:1**, below 3:1 non-text contrast. Icon glyph passes at 4.08:1 and identifies the control; border is supplementary macaw chrome shared across secondary icon buttons.
- Evidence: Default story `evaluate_script`: `borderVsPage: 1.35`, `iconVsBg: 4.08`
- Suggested fix: Defer to macaw design-system token review; not blocking this ticket unless border becomes the sole identifying affordance.

### F-004 [WARNING] Clipboard failure affordance is story-only

- Location: `OrderCopyLinkButton.stories.tsx:81-99` (Error story); `OrderCopyLinkButton.tsx` (no error UI)
- Description: Error story renders `messages.copyOrderLinkFailed` with `role="alert"`, but production component never surfaces clipboard write failures. Nielsen heuristic #9 score reduced accordingly; ui-design.md L33 acknowledges this is not yet in production UI.
- Evidence: `docs/DEV-66/findings/prototype/iteration-003/evidence/review-error.png`; component source has no error branch
- Suggested fix: Wire error feedback when clipboard API rejects, or defer Error story to a future iteration with explicit scope.

### F-005 [WARNING] No TopNav composition story

- Location: Storybook catalog / `OrderCopyLinkButton.stories.tsx`
- Description: No `InOrderDetailsTopNav` or `OrderDetailsPage` composition story exists to validate copy-button placement alongside metadata button and menu in realistic TopNav layout. Isolation stories cover component states but not spatial/context integration.
- Evidence: Storybook sidebar search returned 0 composition matches; integration only visible in `OrderDetailsPage.tsx:210-232` source
- Suggested fix: Add a composition story wrapping copy + metadata + menu in `TopNav` for future iteration visual QA.
