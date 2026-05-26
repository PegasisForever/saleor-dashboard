---
agent: step-1-planning
sequence: 5
input_branch: d45215833ee95c7668a89629242f15bb40c1ac6b
status: DONE
---

## Summary

Addressed iteration-001 loop-back BLOCKER (Focus story visually identical to Default): corrected Macaw CSS token names in story-only CSS and republished Storybook. Also fixed consistency warnings for PRD wording, Empty story mount, and optional `orderId` prop type.

## Decisions made independently

- **Focus fix uses `--mu-colors-border-default1-focused` + `!important`:** Invalid token `--mu-colors-border-focus-1` (hyphenated suffix) was the root cause — outline rule was dropped even after adding `!important`. Macaw tokens omit hyphens before numeric suffixes (`accent1`, not `accent-1`).
- **Empty story mounts component with falsy `orderId`:** Exercises production null-guard instead of placeholder prose; empty canvas is the distinct visual.
- **`orderId?: string` on props:** Matches `OrderDetailsPage` call site (`order?.id`) without widening integration scope.
- **Did not add TopNav composition story or icon-size change:** UI warnings only; out of loop-back scope.

## Files / sections inspected

- `docs/DEV-66/findings/prototype/iteration-001/router.md`: loop-back target Planning; UI F-001 BLOCKER on Focus=Default
- `docs/DEV-66/findings/prototype/iteration-001/ui-review.md`: Macaw Button outline reset + invalid focus token evidence
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css`: story pseudo-state selectors
- `node_modules/@saleor/macaw-ui-next/dist/index.mjs`: verified Macaw token names (`border.default1Focused`, `background.accent1-hovered`)
- Deployed Storybook via chrome-devtools: computed `outlineWidth` Default `0px` vs Focus `2px` after fix

## Considered then dropped

- **`!important` alone on broken token:** First fix attempt added `!important` to `--mu-colors-border-focus-1`; browser still computed `outlineWidth: 0px` because the CSS variable was undefined. Token rename was required.
- **Re-upload to first allocated UUID:** `upload_website` to `64a49de5-…` returned HTTP 409; allocated fresh subpath `a5bd5886-…` instead.

## Dead ends and retries

- **`pnpm install` EACCES on global store:** Fixed with `--store-dir` under workspace (`.pnpm-store`).
- **First Storybook deploy UUID 409 on re-upload:** Used new `allocate_subpath` UUID for iteration-2 bundle.

## Ambiguities encountered

- None requiring human escalation; token naming resolved via Macaw `vars.colors` source in `macaw-ui-next/dist/index.mjs`.

## Concerns / warnings

- Hover/active stories also used invalid hyphenated tokens in iter-1; corrected alongside focus (`accent1-hovered`, `accent1-pressed`, `text-critical1`).
- Deferred consistency items unchanged: unit tests, locale extract, TopNav composition story, icon size alignment.

## Did not do (out of scope or deferred)

- TopNav composition story (UI F-004 warning): deferred — not loop-back blocker
- Unit/integration tests (consistency F-004/F-005): integration phase
- `pnpm run extract-messages` (F-006): pre-merge integration workflow
