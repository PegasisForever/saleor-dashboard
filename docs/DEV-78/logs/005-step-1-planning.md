---
agent: step-1-planning
sequence: 5
input_branch: a0b96266cff4edd7d7856e8c60a6237730cbbd61
status: DONE
---

## Summary

Addressed prototype iteration 1 loop-back (3 UI BLOCKERs on Storybook state coverage): replaced ephemeral `play`-function state stories with settled `[data-state]` wrappers and a static copied preview, fixed clipboard mock, distinguished active from focus/hover in production CSS, republished Storybook, and verified all six states on the new deploy.

## Decisions made independently

- **Settled states via `[data-state]` in production CSS module:** Mirrors `:focus-visible` / `:active` tokens in one file so Storybook previews cannot diverge from integration styles (per loop-back F-001–F-003 and story/production divergence guard).
- **Copied story as static preview component:** `useClipboard` resets after 2s; a render-only preview with `hasBeenClicked` matches post-copy production markup on load.
- **Active vs hover:** Cleared `box-shadow` on `:active` and `[data-state="active"]` so pressed state differs from hover’s macaw elevation shadow.
- **Touch target documentation:** Updated ui-design to 32×32 px macaw secondary sizing (per F-006) rather than claiming 44×44 pt.
- **New deploy UUID:** Re-upload to `529cf26a-0456-4a1b-a2ec-85509a5d52cc` after 409 on prior path.

## Files / sections inspected

- `docs/DEV-78/findings/prototype/iteration-001/ui-review.md` F-001–F-006: loop-back blockers and fixes required
- `docs/DEV-78/findings/prototype/iteration-001/router.md`: mechanical loop-back to Planning
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: prior play-based stories
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`: focus/active rules
- `.storybook/preview.tsx`: global `IntlProvider` for copied preview story
- `src/hooks/useClipboard.ts`: 2s reset behavior driving copied-story approach

## Considered then dropped

- **`OrderCopyLinkButton.stories.module.css`:** Added then removed — ESLint `extraFileExtensions` error on colocated story CSS; moved selectors into production module with `[data-state]` instead.
- **Re-upload to original UUID `c936c5aa-…`:** HTTP 409 from local-deploy; allocated fresh subpath instead of blocking.
- **`play` + `waitFor` for Copied story:** Rejected — copied state expires after 2s; static preview is the only reliable settled frame.

## Dead ends and retries

- **`pnpm install` default store:** EACCES on `~/.pnpm-store`; fixed via `pnpm config set store-dir` to project-local `.pnpm-store`.
- **local-deploy re-upload 409:** Twice on `c936c5aa-…`; succeeded on new UUID `529cf26a-…`.

## Ambiguities encountered

- None escalated to human — loop-back findings were explicit; fixes followed reviewer suggested patterns.

## Concerns / warnings

- **Hover vs active bg token:** Both use `--mu-colors-background-default2`; distinction relies on hover retaining macaw `box-shadow` vs active `box-shadow: none`.
- **Consistency WARNINGs from iter 1** (i18n extraction, URL encoding tests) unchanged — out of scope for this loop-back.

## Did not do (out of scope or deferred)

- **PRD / project-context rewrite:** Scope unchanged; only ui-design + tech-plan + component/story fixes.
- **`pnpm run extract-messages`:** i18n extraction deferred to task agent per iter-1 consistency WARNING.
- **Unit/component tests:** Still deferred per tech-plan.
