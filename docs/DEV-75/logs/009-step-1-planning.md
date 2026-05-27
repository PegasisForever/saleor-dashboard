---
agent: step-1-planning
sequence: 9
input_branch: cc925ba959aaa9ed7435ef477be9f806ed811e43
status: DONE
---

## Summary

Addressed prototype iteration 2 loop-back (UI F-001 BLOCKER: raw `rgba()` in `.buttonPreviewHover`). Replaced hover mirror shadow with macaw token `var(--mu-box-shadow-default-hovered)`. Updated PRD/tech-plan for consistency warnings; published and verified Storybook iter 3 at new deploy URL.

## Decisions made independently

- **Hover preview token:** Used `--mu-box-shadow-default-hovered` instead of author rgba literals — satisfies token-purity while preserving visually distinct hover story (computed shadow differs from default)
- **No background-color mirror:** Hover distinction comes from elevation token only; macaw secondary button already applies default shadow at rest
- **Consistency doc tweaks only:** Added `disabled` prop to tech plan, clarified PRD scope wording and TopNavShell story structure — no scope change

## Files / sections inspected

- `docs/DEV-75/findings/prototype/iteration-002/router.md`: loop-back reason — UI F-001 rgba token-purity BLOCKER
- `docs/DEV-75/findings/prototype/iteration-002/ui-review.md`: BLOCKER location L17-19, state-coverage now pass
- `docs/DEV-75/findings/prototype/iteration-002/consistency.md`: eight WARNINGs to reconcile in artifacts
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:15-19`: rgba literals (root cause)
- macaw `dist/style.css` + `index.js`: confirmed `--mu-box-shadow-default-hovered` token exists
- Published Storybook (`local-deploy:11000/36769da2-…`): verified all six state stories via chrome-devtools evaluate_script

## Considered then dropped

- **Using `--mu-colors-background-default1-hovered` for hover mirror:** dropped — default secondary button already has white background; shadow token alone produces measurable visual delta vs default
- **Removing `.buttonPreviewHover` entirely:** dropped — would regress iteration-001 state-coverage fix; hover/default box-shadow would match at rest

## Dead ends and retries

- **Batch evaluate_script with in-page navigation:** execution context destroyed on location change; switched to per-story navigate + measure
- **`pnpm run lint` reformatted review finding files:** reverted with `git checkout` on findings/logs from prior iterations

## Ambiguities encountered

- None requiring human escalation — token choice defensible from macaw theme contract and UI reviewer suggested fix direction

## Concerns / warnings

- Computed hover shadow resolves to rgba at runtime (macaw token value) — token-purity check passes because source CSS uses `var(--mu-box-shadow-default-hovered)` not author literals
- OrderDetailsPage wiring still unwired (expected post-prototype per prior iterations)

## Did not do (out of scope or deferred)

- **OrderDetailsPage integration:** remains in tech-plan affected components for Step 5 tasks; not required to fix token-purity BLOCKER
- **Toast on clipboard failure / 44×44 touch targets:** acknowledged warnings from iter 2; unchanged
