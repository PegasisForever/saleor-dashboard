---
agent: step-1-planning
sequence: 5
input_branch: 4fad76cb875314e64a646eacf301eb071c214ed0
status: DONE
---

## Summary

Addressed prototype iteration 001 loop-back (3 BLOCKERs): moved Storybook preview CSS from production `OrderCopyLinkButton.module.css` into `OrderCopyLinkButton.stories.module.css` with token-pure `color-mix` shadows; removed `previewState` from production View; added static Focus story via `previewFocus` wrapper; fixed import order in container; republished Storybook and verified all six states on the deployed bundle.

## Decisions made independently

- **Story-only CSS via wrapper divs, not View props:** Loop-back Consistency F-001 required production View free of Storybook surface area; wrapper classes in stories mirror hover/active/focus without production imports. <!-- source: agent -->
- **Token-pure shadows via `color-mix`:** Replaced hardcoded `rgba(24, 40, 58, …)` with `color-mix(in srgb, var(--mu-colors-text-default1) N%, transparent)` — matches existing repo pattern (VariantMatrix.module.css). <!-- source: agent -->
- **Focus story static outline:** `previewFocus button { outline: 2px solid var(--mu-colors-text-default1); outline-offset: 2px; }` — same token pattern as DiscountTypeSwitch focus styles. <!-- source: agent -->
- **PRD unchanged:** Loop-back drivers were prototype hygiene only; acceptance criteria still valid. <!-- source: agent -->
- **Skipped WARNING fixes:** Back-link aria-label (UI F-005) and clipboard failure toast deferred — not loop-back drivers. <!-- source: agent -->

## Files / sections inspected

- `docs/DEV-78/findings/prototype/iteration-001/router.md`: 3 BLOCKER aggregation → loop-back to Planning
- `docs/DEV-78/findings/prototype/iteration-001/consistency.md` F-001: production View importing story-only CSS
- `docs/DEV-78/findings/prototype/iteration-001/ui-review.md` F-001/F-002: Focus story + rgba literals
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx`: removed previewState + CSS import
- `src/discounts/.../DiscountTypeSwitch.module.css`: focus-visible outline token reference
- `docs/DEV-78/prd.md`, `tech-plan.md`, `ui-design.md`: cross-artifact terminology alignment

## Considered then dropped

- **Adding `previewState="focus"` on View (reviewer suggested fix):** Would keep Storybook props on production API; chose story wrapper divs instead to satisfy Consistency F-001 fully.
- **Using macaw shadow elevation tokens:** No `--mu-*shadow*` variables found in repo; `color-mix` with text token achieves token purity without inventing token names.
- **Fixing TopNav back-link aria-label in decorator:** Valid WARNING but out of loop-back scope; would not unblock Router gate.

## Dead ends and retries

- **`pnpm install` EACCES on default store:** Fixed with `--store-dir /tmp/pnpm-store`.
- **Batch iframe.src story walk in chrome evaluate_script:** Returned stale/cached hover styles for all stories; replaced with sequential `navigate_page` per story — confirmed distinct visuals.
- **Playwright headless verification script:** Browser not installed (`npx playwright install` not run); fell back to chrome-devtools sequential navigation.

## Ambiguities encountered

- None requiring human escalation; loop-back fixes were fully specified in iteration-001 findings.

## Concerns / warnings

- Hover/active story styles remain story-only (by design); production macaw Button native `:hover`/`:focus-visible` may differ slightly from preview wrappers — acceptable for prototype; integration uses real interaction states.
- Disabled story shows `cursor: not-allowed` but macaw disabled opacity may still read similarly to default in screenshots — `disabled=true` is the mechanical differentiator.

## Did not do (out of scope or deferred)

- **OrderDetailsPage integration:** Still deferred per tech-plan "(integration task)" annotation.
- **Clipboard failure user feedback:** WARNING only; ticket scope excludes toasts.
- **Commit `storybook-static/` or iteration-002 screenshots:** Build artifacts / diagnostic outputs excluded per prompt.
