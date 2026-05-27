---
agent: step-3-ui-reviewer
input_branch: 3c042d9152a7eceb9c4e710635e598e88c294019
verdict: fail
---

## Summary

The `OrderCopyLinkButton` prototype is structurally sound — macaw tokens, i18n messages, focus ring, and clipboard behavior all work — but **state-coverage fails mechanically**: five of six declared state stories (`Default`, `Hover`, `Focus`, `Active`, `Copied`) plus `InTopNav` render identical static output and rely on `play` functions for differentiation, which blocks static visual review. Touch targets (32×32 px) and secondary-button border contrast (1.35:1) match the existing TopNav metadata icon-button family and are classified as **WARNING** (design-system convention, not a regression). Icon contrast (4.08:1) and focus ring (14.86:1) pass WCAG non-text thresholds on active states. Lighthouse accessibility scored 100 across all visited stories. Nielsen heuristic average: 3.0/4.

## Findings

### F-001 [BLOCKER] State stories lack visually distinct static renders
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:49–109`
- Description: `ui-design.md` declares six states (`default`, `hover`, `focus`, `active`, `disabled`, `copied`). All six have matching story exports, but `Default`, `Hover`, `Focus`, `Active`, `Copied`, and `InTopNav` share the identical render function `() => <TopNavShell orderId={SAMPLE_ORDER_ID} />` with no distinct args, decorators, or pseudo-state parameters. Only `Disabled` uses different props (`orderId="" disabled`). Hover/focus/active/copied differentiation depends entirely on `play` interactions that do not persist in the static Storybook canvas, making sibling state stories visually indistinguishable at load time.
- Evidence:
  ```tsx
  export const Default: Story = { render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} /> };
  export const Hover: Story = { render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />, play: ... };
  export const Focus: Story = { render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />, play: ... };
  export const Active: Story = { render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />, play: ... };
  export const Copied: Story = { render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />, play: ... };
  export const InTopNav: Story = { render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} /> };
  ```
  Screenshots `default.png` and `focus.png` show identical default-state rendering.
- Suggested fix: Add story-level visual differentiation — e.g., `parameters.pseudo` for hover/focus/active, a `visualState` prop or decorator that forces the copied icon/check state, or separate isolated renders per state. `InTopNav` should differ from `Default` or be removed as redundant.

### F-002 [WARNING] Touch targets 32×32 px — matches TopNav icon-button family
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:33–43` (macaw `Button variant="secondary"`)
- Description: Copy button measures 32×32 px; sibling metadata button in the same TopNav shell also measures 32×32 px; back button measures 40×40 px. All are below the 44×44 pt WCAG minimum, but the new element matches the established compact secondary icon-button pattern used by the existing metadata button in `OrderDetailsPage.tsx:210–217`.
- Evidence: Runtime `getBoundingClientRect` on Default story — `copy-order-link`: 32×32, `show-order-metadata`: 32×32, `app-header-back-button`: 40×40. See `screenshots/default.png`.
- Suggested fix: Track as org-wide TopNav icon-button sizing follow-up. If DEV-75 must meet 44×44 independently, add min-size/padding wrapper without diverging from sibling buttons.

### F-003 [WARNING] Secondary button border contrast 1.35:1 (design-system-wide)
- Location: macaw `Button variant="secondary"` border token `rgb(217, 222, 227)` on `rgb(255, 255, 255)` background
- Description: Button border-to-background contrast is 1.35:1 on active states, below the 3:1 non-text threshold. However, the copy icon at 4.08:1 and the custom focus ring at 14.86:1 both pass, and the metadata sibling button shares the identical 1.35:1 border ratio — this is a macaw secondary-button token issue, not a regression introduced by this component.
- Evidence: Computed-style contrast measurement on Default story; metadata button border ratio identical.
- Suggested fix: Escalate to design-system/macaw token review; not blocking for this prototype iteration.

### F-004 [WARNING] ui-design.md overstates touch-target sizing
- Location: `docs/DEV-75/ui-design.md:43`
- Description: Mobile considerations claim "copy button remains 44×44 pt minimum via macaw secondary button sizing," but runtime measurement shows 32×32 px for macaw secondary icon buttons.
- Evidence: Measured 32×32 px on deployed Storybook Default story; matches production metadata button sizing pattern.
- Suggested fix: Correct ui-design.md to reflect actual macaw secondary icon-button dimensions or document planned sizing override.

### F-005 [WARNING] Copied-state feedback is transient and subtle
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21–30` (`useClipboard` 2s timeout)
- Description: After copy, icon swaps to checkmark and `aria-label`/`title` update to "Order link copied" for ~2s. The visual change is subtle at 16px icon size; users who look away may miss confirmation. Nielsen heuristic #1 (visibility of system status) scored 2/4.
- Evidence: `screenshots/copied.png` — checkmark visible after click; aria-label confirmed `"Order link copied"` via runtime script.
- Suggested fix: Consider toast notification or longer-lived visual confirmation in a future iteration if user testing shows missed feedback.

### F-006 [WARNING] No user-facing error state for clipboard failure
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:24–26` (delegates to `useClipboard`)
- Description: Clipboard write failure only logs `console.warn` per existing `useClipboard` hook behavior. Nielsen heuristic #9 (error recovery) scored 2/4.
- Evidence: `tech-plan.md:43` acknowledges this as accepted risk for prototype.
- Suggested fix: Defer to product decision; out of scope for prototype but note for integration task.

## Mechanical check summary

| Check | Status | Notes |
|-------|--------|-------|
| anti-patterns | pass | No gradient text, glassmorphism, nested cards, or system fonts |
| contrast | pass | Active-state icon 4.08:1 ✓, focus ring 14.86:1 ✓; border 1.35:1 fails but icon suffices for component identification; disabled skipped |
| touch-target | fail | All measured interactive elements sub-44 px (32×32 copy/metadata, 40×40 back) |
| token-purity | pass | CSS uses `var(--mu-colors-*)` only; no hex/rgb literals in component directory |
| state-coverage | fail | Six exports exist but five share identical static render |
| cognitive-load | pass | TopNav action cluster: 3 items (copy, metadata, menu) |

## Nielsen heuristics (0–4)

| Heuristic | Score |
|-----------|-------|
| Visibility of system status | 2 |
| Match between system and real world | 4 |
| User control and freedom | 3 |
| Consistency and standards | 3 |
| Error prevention | 3 |
| Recognition rather than recall | 3 |
| Flexibility and efficiency of use | 4 |
| Aesthetic and minimalist design | 4 |
| Help users recognize/diagnose/recover from errors | 2 |
| Help and documentation | 2 |
| **Average** | **3.0** |
