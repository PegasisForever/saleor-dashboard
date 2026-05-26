---
agent: step-3-ui-reviewer
input_branch: af00bf8edbef825943d3ec391e5eab04b79b8c49
verdict: fail
---

## Summary

The `OrderCopyLinkButton` prototype is structurally sound — Macaw tokens, i18n messages, and eight declared Storybook exports are present, and runtime contrast/Lighthouse accessibility pass on active states. Review **fails** because the **Focus story renders identically to Default** (story CSS outline is overridden by Macaw `Button`), violating state-coverage requirements. Secondary warnings cover org-wide 32×32 TopNav touch targets and missing TopNav composition context.

## Findings

### F-001 [BLOCKER] Focus story is visually identical to Default
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (`Focus` export), `OrderCopyLinkButton.stories.module.css` (`.storyFocus`)
- Description: The declared `focus` state story applies `.storyFocus button { outline: 2px solid var(--mu-colors-border-focus-1) }`, but Macaw `Button` resets `outline: none`. Computed styles for Focus and Default are identical (`backgroundColor: rgb(255,255,255)`, `outlineWidth: 0px`, `svgColor: rgb(124,126,126)`), and screenshots are indistinguishable. State-coverage requires each declared state to render a visually distinct story.
- Evidence:
  - Screenshots: `docs/DEV-66/evidence/ordercopylinkbutton-default.png` vs `ordercopylinkbutton-focus.png`
  - Runtime computed styles captured via chrome-devtools on deployed Storybook (`local-deploy:11000/6e802f28-…`)
  - CSS: `.storyFocus button { outline: 2px solid var(--mu-colors-border-focus-1); outline-offset: 2px; }` at `OrderCopyLinkButton.stories.module.css:5-8`
- Suggested fix: Force focus ring with higher-specificity story selector (e.g. `.storyFocus button:focus-visible { outline: 2px solid var(--mu-colors-border-focus-1) !important; outline-offset: 2px; }`) or use Macaw focus-ring token/box-shadow pattern that survives Button resets; verify Focus screenshot differs from Default before republishing Storybook.

### F-002 [WARNING] Secondary TopNav icon buttons measure 32×32 (below 44×44 WCAG touch target)
- Location: `OrderCopyLinkButton.tsx` (production), all active-state Storybook stories
- Description: Copy-link button bounding box is 32×32 px in every story where it renders. This is below the 44×44 pt guideline, but matches the established same-family neighbor `TopNav.Menu` trigger (`show-more-button` also 32×32 in `components-applayout-topnav--with-menu` story). Classify as org-wide design-system convention, not a regression introduced by this component.
- Evidence:
  - Copy button: 32×32 (`data-test-id="copy-order-link"`) on Default story
  - Neighbor: `show-more-button` 32×32 on TopNav WithMenu story
  - Integration context: `OrderDetailsPage.tsx:211-219` places copy button beside metadata secondary icon button using same Macaw `Button variant="secondary"` pattern
- Suggested fix: Track as design-system follow-up (Macaw compact secondary icon button sizing). No per-PR blocker required unless product mandates 44×44 for all TopNav actions.

### F-003 [WARNING] Copy icon size (16px) smaller than adjacent metadata icon (20px)
- Location: `OrderCopyLinkButton.tsx:36`, `ClipboardCopyIcon.tsx:12-14`, `OrderDetailsPage.tsx:214`
- Description: Copy button reuses `ClipboardCopyIcon` at 16px (Lucide `size={16}`), while the metadata button beside it uses `Code size={iconSize.medium}` (20px). In TopNav the copy action will appear visually smaller than its sibling action despite sharing the same button shell size.
- Evidence: Icon size constants in `src/components/icons/index.ts` (`medium: 20`); `ClipboardCopyIcon` hardcodes 16.
- Suggested fix: Align with metadata by passing `iconSize.medium` into `ClipboardCopyIcon` (or add a size prop) while keeping copy/check toggle behavior; validate in a TopNav composition story.

### F-004 [WARNING] No TopNav composition story for in-context review
- Location: Storybook catalog (missing `OrderDetailsPage` / `InOrderDetailsTopNav` story)
- Description: Isolated component stories pass, but there is no composition story showing copy-link beside metadata and menu in `TopNav`. Layout spacing, icon-size imbalance, and action-cluster cognitive load cannot be reviewed in situ.
- Evidence: Only `Orders/OrderCopyLinkButton` stories exist; grep finds no `OrderDetailsPage.stories.tsx`.
- Suggested fix: Add a lightweight composition story rendering `TopNav` with `OrderCopyLinkButton`, metadata button, and `TopNav.Menu` mirroring `OrderDetailsPage.tsx:210-232`.

### F-005 [WARNING] Error and loading states are story-only prototypes
- Location: `OrderCopyLinkButton.stories.tsx` (`Error`, `Loading` exports), `OrderCopyLinkButton.tsx`
- Description: `ui-design.md` documents error and loading affordances, but production `OrderCopyLinkButton` has no error surfacing or loading guard — only the stories demonstrate these states. Acceptable for iteration 1 if intentional, but Nielsen error-recovery heuristic scores low until wired.
- Evidence: Error story adds `role="alert"` span in `ErrorStoryContent`; component only calls `useClipboard` with icon swap feedback.
- Suggested fix: Defer to implementation phase or add explicit “future state” callout in ui-design; wire clipboard failure handling before claiming production parity.

## Mechanical checks

| Check | Status | Notes |
|---|---|---|
| anti-patterns | pass | No gradient text, glassmorphism, nested cards, or system fonts in component/story sources |
| contrast | pass | Active states: icon non-text 4.08:1 (≥3:1); error alert text 14.86:1 (≥4.5:1). Inactive states skipped per rules |
| touch-target | pass | 32×32 matches same-family TopNav secondary icon buttons (not a regression); see F-002 WARNING |
| token-purity | pass | Story CSS uses `var(--mu-colors-*)` tokens only; no hex/rgb literals in component tree |
| state-coverage | **fail** | Focus story visually identical to Default (F-001) |
| cognitive-load | pass | Single action button; TopNav cluster ≤4 items (copy, metadata, menu) |

## Nielsen heuristic walkthrough (0–4)

Scores from deployed Storybook screenshots (isolated + error/empty states):

| Heuristic | Score | Rationale |
|---|---|---|
| Visibility of system status | 3 | Icon swap to check communicates copy success; no production error feedback yet |
| Match between system and real world | 4 | “Copy order link” label is clear admin vocabulary |
| User control and freedom | 4 | Single reversible copy action, no traps |
| Consistency and standards | 3 | Matches orders-domain copy pattern; icon size inconsistent with metadata neighbor |
| Error prevention | 3 | Disabled/empty handled; clipboard failure not surfaced in production |
| Recognition rather than recall | 4 | Standard copy icon + `aria-label` / `title` |
| Flexibility and efficiency of use | 4 | One-click copy from TopNav without navigation |
| Aesthetic and minimalist design | 4 | Icon-only secondary button fits TopNav density |
| Help users recognize, diagnose, recover from errors | 2 | Error story prototype only; no live recovery path |
| Help and documentation | 3 | Accessible name present; no contextual help for failure |

**Average: 3.4 / 4**

## Lighthouse accessibility

- Default story snapshot: **100** (accessibility category)
- No contrast audit failures reported by Lighthouse on Default story
