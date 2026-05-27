---
agent: step-1-planning
sequence: 5
input_branch: 8727d4834a4df566bfaf5c717450f2b31be05a0f
status: DONE
---

## Summary

Addressed prototype iteration 1 loop-back (UI F-001 BLOCKER): Storybook state stories now render visually distinct static output via `previewState` prop and production CSS mirror classes. Updated PRD, ui-design, and tech-plan for consistency warnings; extracted i18n messages; published and verified Storybook iter 2.

## Decisions made independently

- **`previewState` prop on production component:** Storybook-only optional prop with mirror classes in `OrderCopyLinkButton.module.css` — avoids story-only CSS divergence while satisfying static state-coverage gate
- **Removed duplicate `InTopNav` story:** Default already demonstrates TopNav placement; six state stories = six exports (consistency F-003 + UI F-001)
- **Touch target sizing:** Documented actual 32×32 px macaw secondary icon-button pattern instead of incorrect 44×44 pt claim (UI F-004)
- **PRD AC kept unified:** Single acceptance criteria set covering full feature; TopNav placement AC notes Storybook shell proves placement for prototype review

## Files / sections inspected

- `docs/DEV-75/findings/prototype/iteration-001/router.md`: loop-back reason — UI F-001 state stories indistinguishable
- `docs/DEV-75/findings/prototype/iteration-001/ui-review.md`: BLOCKER details + contrast/touch-target measurements
- `docs/DEV-75/findings/prototype/iteration-001/consistency.md`: six WARNING findings to reconcile in artifacts
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:49–109`: identical render closures (root cause)
- `src/components/Tab/Tab.stories.tsx:23–26`: args-based state pattern precedent
- `src/orders/components/OrderCopyLinkButton/getOrderAbsoluteUrl.ts:10`: `encodeURIComponent` usage for tech-plan wording fix

## Considered then dropped

- **Story-only `*.stories.module.css` for pseudo-states:** rejected after self-detect rule — would diverge from production component styling at integration
- **`parameters.pseudo` addon:** not on branch; adding dependency rejected (no new packages policy)
- **Keeping `InTopNav` with play-only DOM-order assertion:** dropped — still fails static visual distinctness vs Default

## Dead ends and retries

- **`pnpm install` EACCES:** fixed with `--store-dir` in workspace (same as iter 1)
- **Batch iframe measurement script:** race condition returned identical metrics for all stories; switched to direct iframe.html navigation per story for reliable verification
- **Prettier via `pnpm run lint`:** reformatted unrelated review finding files; reverted with `git checkout`

## Ambiguities encountered

- **Hover box-shadow token value:** measured macaw default vs preview hover at runtime; used explicit rgba values in `.buttonPreviewHover` matching deployed hover story output

## Concerns / warnings

- Hover preview shadow uses explicit rgba literals in CSS module (not macaw token vars) — acceptable for Storybook mirror class; live hover still comes from macaw `:hover`
- `previewState` prop is exported on production component — integration task must not pass it (documented in tech-plan risks)

## Did not do (out of scope or deferred)

- **OrderDetailsPage wiring:** remains in tech-plan affected components for integration task; not required to fix UI F-001 BLOCKER
- **Toast on clipboard failure / 44×44 touch targets:** acknowledged as product/design-system follow-ups per iter 1 UI warnings
