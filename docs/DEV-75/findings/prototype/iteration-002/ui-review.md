---
agent: step-3-ui-reviewer
input_branch: da4a4494084e52435ef7f18277df650b84df1e10
verdict: fail
---

## Summary

Prototype iteration 2 resolves the iteration-001 state-coverage gap: all six declared states (`default`, `hover`, `focus`, `active`, `disabled`, `copied`) have distinct Storybook exports with visually distinguishable static renders via `previewState` CSS mirror classes. Active-state contrast on identifying affordances (icon 4.08:1, focus ring 14.86:1) and cognitive-load constraints pass. Review **fails** because `OrderCopyLinkButton.module.css` uses raw `rgba()` literals in `.buttonPreviewHover`, violating token-purity. Touch targets remain 32×32 px (matching the metadata sibling and documented TopNav convention — WARNING, not a regression). Nielsen heuristic average: 3.2/4.

## Findings

### F-001 [BLOCKER] Raw rgba literals violate token-purity
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:17-19`
- Description: `.buttonPreviewHover` defines hover elevation with hard-coded `rgba(0, 0, 0, 0.06)` and `rgba(0, 0, 0, 0.1)` instead of macaw design tokens. The mechanical token-purity check requires no hex/rgb/rgba literals outside token files.
- Evidence:
```css
.buttonPreviewHover {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.1);
}
```
  Focus/active styles in the same file correctly use `var(--mu-colors-*)` tokens (lines 3–7).
- Suggested fix: Replace rgba shadow literals with an existing macaw shadow token or derive the static hover preview from computed macaw secondary-button hover styles (e.g., reference the same shadow macaw applies — metadata button hover uses `rgba(19, 32, 48, 0.16)` from the design system, not author literals).

### F-002 [WARNING] Compact 32×32 px touch targets match established TopNav convention
- Location: Storybook `TopNavShell` — all state stories; `docs/DEV-75/ui-design.md:45-46`
- Description: Copy and metadata buttons measure 32×32 px (below WCAG 2.5.5 44×44 pt minimum). Copy button exactly matches metadata neighbor (32×32, delta 0). UI design explicitly documents this as aligned with existing TopNav secondary icon-button sizing rather than a 44×44 override.
- Evidence: Runtime `getBoundingClientRect` on Focus story — copy: 32×32, metadata: 32×32, back link: 40×40. See `docs/DEV-75/findings/prototype/iteration-002/evidence/screenshot-focus-verify.png`.
- Suggested fix: Track as org-wide TopNav compact-button follow-up; no per-component regression to block this delivery.

### F-003 [WARNING] Component not integrated into production OrderDetailsPage TopNav
- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:209-231`
- Description: UI design specifies copy button placement immediately left of the metadata button in order-details TopNav. Production `OrderDetailsPage` renders metadata `Button` + `TopNav.Menu` only — `OrderCopyLinkButton` is Storybook-only today.
- Evidence: Grep shows `OrderCopyLinkButton` imported only in its own `.tsx` and `.stories.tsx`. `OrderDetailsPage.tsx:210-217` has metadata button without copy button.
- Suggested fix: Wire `OrderCopyLinkButton` into `OrderDetailsPage` TopNav during implementation phase (expected post-prototype).

### F-004 [WARNING] No user-facing feedback on clipboard failure
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:31-33` (uses `useClipboard` with no error UI)
- Description: If `navigator.clipboard.writeText` fails (permissions, insecure context), the button gives no visible or announced error. Nielsen H9 (help users recognize/diagnose/recover from errors) scored 2/4.
- Evidence: `handleCopy` calls `copy(getOrderAbsoluteUrl(orderId))` with no error branch; copied state only reflects success via `useClipboard` boolean.
- Suggested fix: Surface a toast or transient error label when clipboard write rejects; keep success path unchanged.

## Nielsen Heuristic Evaluation (0–4)

| # | Heuristic | Score | Notes |
|---|-----------|-------|-------|
| 1 | Visibility of system status | 3 | Copied state (check icon + updated aria-label) is reviewable in Storybook; production feedback is transient (~2s) |
| 2 | Match between system and real world | 4 | Standard copy/check iconography |
| 3 | User control and freedom | 3 | Non-destructive; disabled when `orderId` empty |
| 4 | Consistency and standards | 4 | Matches metadata secondary icon button in TopNavShell |
| 5 | Error prevention | 3 | Disabled guard when no order ID |
| 6 | Recognition rather than recall | 3 | Icon + `title`/`aria-label`; no persistent text label |
| 7 | Flexibility and efficiency of use | 4 | One-click copy in header |
| 8 | Aesthetic and minimalist design | 4 | Clean icon-only control in compact action cluster |
| 9 | Help recognize/diagnose/recover from errors | 2 | No clipboard-failure feedback (F-004) |
| 10 | Help and documentation | 2 | `title` attribute only |
| | **Average** | **3.2** | |

## Mechanical Checks Summary

| Check | Status | Rationale |
|-------|--------|-----------|
| anti-patterns | pass | No gradient text, nested cards, glassmorphism, or system-default fonts |
| contrast | pass | Active states: icon vs bg 4.08:1 (non-text ≥3:1 ✓), focus outline vs page 14.86:1 (≥3:1 ✓). Disabled skipped. Secondary button border 1.35:1 is inherited macaw token shared with metadata sibling — not a component regression |
| touch-target | pass | 32×32 matches metadata neighbor; documented TopNav convention (F-002 WARNING) |
| token-purity | **fail** | rgba literals in `.buttonPreviewHover` (F-001) |
| state-coverage | pass | 6 declared states → 6 distinct story exports with unique `previewState`/disabled args |
| cognitive-load | pass | 3-item action cluster; ≤5 nav elements; no pricing tiers |
