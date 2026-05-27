---
agent: step-1-planning
sequence: 5
input_branch: 11a08a16ad711c798b52c85bb96e629f962b248f
status: DONE
---

## Summary

Addressed prototype iteration-001 loop-back (UI review BLOCKER F-001): removed story-only `interactionPreview` prop and hardcoded rgb literals from production `OrderCopyLinkButtonContent.tsx`, added story-only `OrderCopyLinkButtonStoryPreview` + `OrderCopyLinkButton.stories.module.css` using Macaw CSS variables for hover/focus/active static Storybook coverage. Updated PRD, UI design, and tech plan for cross-artifact coherence; published Storybook to a new long-living deploy URL.

## Decisions made independently

- **Story-only preview wrapper vs play functions:** Play functions (`userEvent.hover`, `.focus()`) do not persist pseudo-states in static Storybook iframe loads; switched to story-only preview + Macaw token CSS variables (`--mu-colors-background-button-default-secondary-*`) mirroring production Button runtime styling.
- **Focus contrast claim:** Macaw secondary `:focus-visible` uses background/shadow change, not an outline ring; updated PRD/UI design to cite icon/text contrast ≥4.5:1 (measured 13.87:1) instead of background-delta ≥3:1 (measured 1.07:1).
- **Touch target documentation:** Kept 32×32 px honest sizing (matches metadata sibling) per iteration-001 UI review F-002.
- **Disabled in PRD:** Documented as Storybook-only / Macaw standard; not used in production TopNav.

## Files / sections inspected

- `docs/DEV-85/findings/prototype/iteration-001/ui-review.md`: BLOCKER on `interactionPreview` in production file.
- `docs/DEV-85/findings/prototype/iteration-001/consistency.md`: seven WARNINGs for doc drift, disabled state, optional `url` prop.
- `docs/DEV-85/findings/prototype/iteration-001/router.md`: loop-back verdict to Planning.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx`: removed preview prop/styles.
- `node_modules/@saleor/macaw-ui-next/dist/style.css` + runtime CSS vars on `:root`: resolved Macaw button secondary token names.
- Published Storybook at `local-deploy:11000/348e26e0-…`: verified all seven state stories render distinctly from Default where applicable.

## Considered then dropped

- **Keep play functions only:** Initially rewrote Hover/Focus/Active stories with Storybook `play` handlers; published Storybook verification showed `:hover` false and pixel-identical backgrounds — reverted to story-only preview wrapper.
- **Re-upload to first UUID (`3af7297c…`):** local-deploy returned HTTP 409; allocated fresh UUID `348e26e0-…` instead.
- **Add outline ring to story Focus CSS:** Would diverge from Macaw production `:focus-visible`; dropped in favor of accurate Macaw focused background token.

## Dead ends and retries

- `pnpm install` EACCES on default store → succeeded with `--store-dir /tmp/pnpm-store`.
- First Storybook publish upload to `3af7297c-…` → HTTP 409; re-allocated and uploaded to `348e26e0-…`.
- `pnpm run lint:eslint -- src/orders/components/OrderCopyLinkButton/` flags `.stories.module.css` parser error (project eslint config lacks CSS extension); Storybook build still succeeds; no eslint config change made (out of ticket scope).

## Ambiguities encountered

- None requiring human escalation; loop-back root cause was explicit in iteration-001 UI review.

## Concerns / warnings

- Hover and Focus story previews render identical Macaw token styling (by design — Macaw secondary hover/focus tokens match); both remain visually distinct from Default.
- Error story remains visually identical to Default (spec-intentional).

## Did not do (out of scope or deferred)

- Unit tests / `extract-messages`: still deferred to integration pass per tech-plan risk table.
- ESLint config change for `.stories.module.css`: would be repo-wide tooling change, not ticket scope.
