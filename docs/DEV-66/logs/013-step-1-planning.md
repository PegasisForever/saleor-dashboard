---
agent: step-1-planning
sequence: 13
input_branch: 2dc65defea02303d9388a189cea9e5e8f5220956
status: DONE
---

## Summary

Addressed iteration-003 loop-back BLOCKER (F-001 focus-indicator contrast 1.76:1): replaced `--mu-colors-border-default1-focused` border-only focus affordance with a story-only `text-accent1` outline ring atop macaw secondary focused fill in `OrderCopyLinkButton.stories.module.css`. Verified outline contrast 6.89:1 vs page / 6.42:1 vs fill on deployed Storybook `http://localhost:11000/3334d95e-a6f1-4139-8bfc-1e8274ced517`. Updated ui-design and tech-plan prose; PRD unchanged.

## Decisions made independently

- **Focus affordance = `text-accent1` outline ring, not `border-default1-focused`:** Iteration-003 measured border-focused at 1.76:1 vs page; macaw theme source confirms `default1Focused` border is hsla(212, 14%, 77%). `text-accent1` outline measures 6.89:1. Alternatives considered: keep mirroring production macaw border change — rejected because it fails WCAG 2.4.11 and ui-design explicitly claimed passing contrast.
- **Keep secondary focused background fill:** Preserves visual parity with macaw `:focus-visible` fill while upgrading only the focus-indicator ring.
- **No PRD changes:** Loop-back scoped to story CSS and artifact claims; acceptance criteria unchanged.

## Files / sections inspected

- `docs/DEV-66/findings/prototype/iteration-003/ui-review.md`: F-001 BLOCKER — focus border 1.76:1 / 1.64:1
- `docs/DEV-66/findings/prototype/iteration-003/router.md`: loop-back target Planning; mechanical aggregation
- `docs/DEV-66/logs/012-step-4-router-mode-a-proto.md`: iteration-003 router loop-back short-circuit
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css`: `.storyFocus` pre-fix tokens
- `node_modules/@saleor/macaw-ui-next/dist/index.mjs:1642-1647`: light-theme border token HSL values
- Deployed Storybook via chrome-devtools: Focus story contrast probe post-fix

## Considered then dropped

- **Re-use iteration-009 border-only approach hoping icon contrast suffices:** Iteration-003 explicitly blocked on border/background as declared focus affordance; icon-only pass is insufficient.
- **NO_OP:** Existing deploy still used sub-threshold `border-default1-focused` treatment.

## Dead ends and retries

- **`pnpm install` EACCES on default store:** Fixed with `--store-dir /tmp/pnpm-store`.

## Ambiguities encountered

- None requiring human escalation; token choice validated via runtime contrast measurement.

## Concerns / warnings

- Production macaw secondary `:focus-visible` still uses sub-threshold `border-default1-focused`; story now documents an enhanced focus ring for prototype WCAG compliance. Fleet-wide macaw token fix is out of scope.

## Did not do (out of scope or deferred)

- TopNav composition story, touch-target enlargement, clipboard error wiring in production (iteration-003 warnings)
- PRD / project-context rewrites (no scope change)
