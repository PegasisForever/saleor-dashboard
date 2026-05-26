---
agent: step-1-planning
sequence: 17
input_branch: 1e9345e816a06f8318987733f80ca7c797810377
status: DONE
---

## Summary

Addressed iteration-004 loop-back BLOCKER (F-001 production keyboard focus lacks documented ≥3:1 affordance): added `OrderCopyLinkButton.module.css` with production `:focus-visible` ring matching the validated Focus story tokens, wired `className` on the macaw `Button`, added a PRD acceptance criterion for keyboard focus, updated ui-design/tech-plan prose, and republished Storybook to `http://localhost:11000/86247876-5fcc-4230-a846-2d2e987e5cbd`. Verified Default story keyboard focus shows 2px accent1 outline at 6.89:1 vs page.

## Decisions made independently

- **Port story focus ring to production CSS module:** Iteration-004 UI review measured story Focus at 6.89:1 but Default keyboard focus at outlineWidth 0px / border 1.35:1; same token pairing in production is the minimal fix the router requested.
- **Keep `.storyFocus` wrapper:** Focus story still forces static preview without keyboard; production `:focus-visible` now matches its tokens per ui-design.
- **Add PRD acceptance criterion for focus:** Makes the loop-back fix mechanically checkable downstream without splitting prototype vs integration phases.
- **Did not add TopNav composition story or error production path:** UI warnings only (F-004, F-005); out of loop-back scope.

## Files / sections inspected

- `docs/DEV-66/findings/prototype/iteration-004/ui-review.md`: F-001 BLOCKER — focus ring story-only
- `docs/DEV-66/findings/prototype/iteration-004/router.md`: loop-back target Planning; port ring to production
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: no production focus styles at input
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css:5-10`: validated focus token pairing to mirror
- `src/discounts/.../RuleActions.module.css:17-21`: codebase precedent for `:focus-visible` outline in CSS modules
- Deployed Default story iframe on `local-deploy:11000/86247876…`: post-fix outline 2px, contrast 6.89:1

## Considered then dropped

- **Rely on macaw secondary default border as focus indicator:** Iteration-004 measured resting/keyboard border at 1.35:1 on Default; dropped after confirming production gap was the explicit BLOCKER.
- **Remove `.storyFocus` and use autoFocus only:** Static Storybook preview less reliable; kept wrapper mirroring production tokens.

## Dead ends and retries

- **`pnpm install` EACCES on global store:** Fixed with `pnpm install --store-dir ./.pnpm-store`.
- **`pnpm run lint` reformatted unrelated findings/logs:** Restored via `git checkout -- docs/DEV-66/findings docs/DEV-66/logs/{002,003,004,006,007,008,010,014,015,016}-*.md` before commit.

## Ambiguities encountered

- None requiring human escalation; loop-back fix was fully specified in iteration-004 router/ui-review findings.

## Concerns / warnings

- Hover/Active remain story-only pseudo-states (macaw handles production `:hover`/`:active`); not part of this loop-back.
- Error and TopNav composition stories still warnings-only for downstream integration.

## Did not do (out of scope or deferred)

- TopNav composition story (UI F-005): deferred — warning only
- Production clipboard error UI (UI F-004): deferred — warning only
- Touch-target 32×32 fleet audit (UI F-003): deferred — matches metadata neighbor
