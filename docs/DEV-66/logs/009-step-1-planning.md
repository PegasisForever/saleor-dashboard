---
agent: step-1-planning
sequence: 9
input_branch: 870dcec058c57ce66e74196c57e3ccacaa8075a4
status: DONE
---

## Summary

Addressed iteration-002 loop-back BLOCKERs (F-001 hover/active and F-002 focus non-text contrast failures): replaced accent1 story-only backgrounds and outline focus ring with macaw secondary Button production tokens in `OrderCopyLinkButton.stories.module.css`, updated ui-design and tech-plan prose, republished Storybook to `http://localhost:11000/c4afff6b-ce38-4250-86c6-57fc0458832b`.

## Decisions made independently

- **Use `--mu-colors-background-button-default-secondary-*` for Hover/Active/Focus stories:** Iteration-002 measured 1.11:1 icon contrast on accent1 hover/press backgrounds; production macaw secondary `:hover` yields 3.81:1 on the same icon token. Alternatives considered: keep accent1 and darken icon — rejected because it misdocuments production interaction colors (F-003).
- **Focus story mirrors macaw `:focus-visible` border treatment, not outline:** Outline against button surface measured 1.76:1 (F-002); production secondary Button changes background + border-color. Story now forces focused background + `--mu-colors-border-default1-focused` with `outline: none`.
- **No PRD scope changes:** Loop-back was implementation/story CSS only; acceptance criteria unchanged.
- **Did not add Empty placeholder or wire loading/error in production:** UI warnings only; out of loop-back scope.

## Files / sections inspected

- `docs/DEV-66/findings/prototype/iteration-002/ui-review.md`: F-001/F-002 BLOCKER evidence and suggested fixes
- `docs/DEV-66/findings/prototype/iteration-002/router.md`: loop-back target Planning; contrast blockers on hover/focus/active
- `docs/DEV-66/logs/008-step-4-router-mode-a-proto.md`: mechanical aggregation summary
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css`: story pseudo-state selectors (pre-fix accent1 tokens)
- `node_modules/@saleor/macaw-ui-next/dist/index.mjs` (theme colors ~1587–1653): secondary button hovered/pressed/focused HSL values
- `node_modules/@saleor/macaw-ui-next/dist/index.mjs` (`vars.colors.background.buttonDefaultSecondary*`): CSS variable name ground truth
- Deployed Storybook via chrome-devtools: measured iconContrast Hover 3.81, Active 3.02, Focus 3.81 (all ≥ 3:1); Focus outlineWidth 0px

## Considered then dropped

- **Keep outline with a darker focus token:** Computed border/default1Focused vs focus bg still ~1.64:1; UI review explicitly pointed to production border treatment. Dropped outline path entirely.
- **NO_OP on branch:** Iteration-002 router loop-back reason (contrast BLOCKERs) not satisfied by existing `a5bd5886-…` deploy — CSS still used accent1 tokens at input SHA.

## Dead ends and retries

- **`pnpm install` EACCES on default store:** Fixed with `--store-dir /tmp/pnpm-store`.
- **First contrast probe returned `rgba(0,0,0,0.1)` bg:** Used wrong iframe query (`button` without aria-label / before story loaded). Re-ran with `button[aria-label="Copy order link"]` after `wait_for` — correct rgb(246,247,249) hover bg.

## Ambiguities encountered

- None requiring human escalation; token selection resolved via macaw theme source and runtime contrast measurement on local Storybook.

## Concerns / warnings

- Focus story border-vs-background contrast remains ~1.64:1 (same as production macaw secondary `:focus-visible`); reviewer measured outline specifically. Icon contrast on Focus story is 3.81:1.
- Deferred iteration-002 warnings (Empty placeholder, touch target, story-only loading/error) unchanged.

## Did not do (out of scope or deferred)

- Empty story placeholder caption (F-004 warning)
- TopNav composition story / icon-size enlargement (F-005/F-006 warnings)
- Unit tests, locale extract (consistency warnings from prior iterations)
