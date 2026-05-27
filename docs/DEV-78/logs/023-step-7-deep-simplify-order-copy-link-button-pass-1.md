---
agent: step-7-deep-simplify-order-copy-link-button-pass-1
sequence: 23
input_branch: 04aaf8e902a7277b5e64bee43842a5c4f41bed35
status: DONE
---

## Summary

Reviewed the order-copy-link-button area diff (10 source/locale files) from the simplify angle. Production component and URL helper are minimal and correctly reuse existing abstractions; all simplification debt sits in Storybook files and the production CSS module's story-only selectors. Verdict **fail** with three WARNING findings; mechanical check `abstraction-opportunities` failed.

## Decisions made independently

- **Verdict fail on mechanical check, not BLOCKERs**: No BLOCKER-class simplify issues — production code is ~50 LOC and idiomatic. `abstraction-opportunities: fail` drives overall `verdict: fail` per schema.
- **Did not flag `getOrderShareableUrl` as needing shared `getAbsoluteAppUrl`**: Same inline pattern exists in auth/staff; extracting a cross-cutting helper is out of scope for this feature diff.
- **Did not flag `useCallback` on `handleCopyLink` as unnecessary**: Matches surrounding dashboard button patterns; removing it would be micro-optimization, not simplification.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/* src/orders/urls.ts src/orders/urls.test.ts src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx locale/defaultMessages.json`: full area diff
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: 51-line component — clean production surface
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: CopiedPreview duplication, triplicated data-state wrappers
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`: pseudo-class vs `[data-state]` mirror rules
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`: useClipboard mock pattern usable for Copied story
- `src/hooks/useClipboard.ts`: 2s auto-reset explains CopiedPreview workaround
- `src/orders/urls.ts:194-195`: one-line `getOrderShareableUrl`
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx`: nearest clipboard-button equivalent
- `grep useClipboard`, `grep data-state=`, `grep getAppMountUriForRedirect`: reuse and pattern scans
- `docs/DEV-78/tech-plan.md`: documents intentional Storybook CSS in production module
- `docs/DEV-78/logs/017-step-7-coordinator-pass-1.md`: touchedFiles scope (via grep; did not read sibling findings)

## Considered then dropped

- **BLOCKER on story CSS in production module**: UI review iteration 002 already flagged this (F-004). For simplify angle it stays WARNING — tech plan explicitly lists `[data-state]` previews in production CSS, and logs note ESLint blocked a story-only CSS module.
- **WARNING on `disabled` prop unused in production**: Documented in tech plan as Storybook-only; not a simplification defect.
- **WARNING on `hasBeenClicked` vs `copied` naming mismatch**: Minor readability nit; not worth a finding when both names are established (`ClipboardCopyIcon` predates this feature).
- **Fast-path skip**: Rejected — Storybook duplication is meaningful simplify surface despite lean production code.

## Dead ends and retries

- `docs/DEV-78/findings/deep-review/pass-001/` did not exist yet — created directory before writing findings.

## Ambiguities encountered

- **Copied story without jest.mock in Storybook**: Component test mocks `useClipboard` cleanly; Storybook has no repo-wide hook-mock decorator. CopiedPreview duplication is therefore understandable, but presentational extraction remains the best simplify path.

## Concerns / warnings

- Sub-agents uniformly passed `reuse-scan` and `library-substitution`; simplify work is almost entirely Storybook/CSS hygiene, not production architecture.

## Did not do (out of scope or deferred)

- Chrome/Storybook visual walkthrough: simplify angle is code-structure review; no UI surface simplification beyond CSS/story duplication.
- Read sibling deep-review findings under `pass-001/` (pure-reviewer discipline).
- Propose cross-repo `getAbsoluteAppUrl` refactor (auth/staff/orders) — broader than this feature.
