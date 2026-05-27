---
agent: step-5-task-creation
sequence: 21
input_branch: a0a724ab4979b3190b10c04df013a5c2bcc76acb
status: DONE
---

## Summary

Re-entry after deep-review pass-001 loop-back. Preserved completed task T-04b2dd15; added four high-priority SHOULD-FIX fix-tasks addressing deduplicated themes A–D from the router report (useClipboard timer reset, aria-live SR feedback, TopNav placement integration test, Playwright E2E). No merge-conflict or PR loop-back findings present.

## Decisions made independently

- **Four fix-tasks, not one mega-task:** Themes touch distinct domains (`useClipboard` hook, presentational a11y, Jest integration test, Playwright E2E) — split enables parallel batch dispatch without file conflicts.
- **Combined three timer findings into one task:** desktop-ux F-002, mobile-ux F-001, and correctness F-003 share the same root cause and file (`useClipboard.ts`); one read-edit-test cycle per sizing rule.
- **Did not re-emit verify-only tasks for fully-shipped PRD criteria:** TopNav JSX wiring, Macaw styling, clipboard container logic, Storybook, and unit tests are present in cumulative diff; only deep-review-identified gaps become tasks.
- **Marked T-04b2dd15 acceptance checkboxes [x]:** Implementation iteration 1 completed this task; preserved as `done` with updated acceptance state.

## Files / sections inspected

- `docs/DEV-85/findings/deep-review/pass-001/router.md`: deduplicated themes A–D, mechanical 6 SHOULD-FIX count
- `docs/DEV-85/findings/deep-review/pass-001/correctness-order-copy-link-button.md`: F-001/F-002/F-003 SHOULD-FIX verbatim
- `docs/DEV-85/findings/deep-review/pass-001/desktop-ux-order-copy-link-button.md`: F-001/F-002 SHOULD-FIX verbatim
- `docs/DEV-85/findings/deep-review/pass-001/mobile-ux-order-copy-link-button.md`: F-001 SHOULD-FIX verbatim
- `docs/DEV-85/tasks.md`: prior single done task T-04b2dd15
- `docs/DEV-85/prd.md#acceptance-criteria`: cross-referenced against diff for skip-or-pre-complete rule
- `git diff 45b5cef8..HEAD -- . ':!docs/'`: confirmed feature code shipped; gaps are timer bug, a11y, integration/E2E tests
- `src/hooks/useClipboard.ts:12-21`: orphan timer bug confirmed in source
- `src/hooks/useClipboard.test.ts:105-130`: multi-copy test lacks timer advance
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx`: no aria-live
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`: JSX order correct, no test file
- `playwright/tests/orders.spec.ts`, `playwright/pages/ordersPage.ts:118-124`: E2E navigation patterns; zero `copy-order-link` matches
- `docs/DEV-85/ui-design.md:59`: SR flow promise driving aria-live task
- `src/extensions/.../ManifestErrorMessage.tsx:83`: aria-live precedent
- `docs/DEV-85/findings/implementation/iteration-001/shallow-review.md`: no merge-conflict.md
- `docs/DEV-85/findings/pr/`: absent (no PR loop-back)

## Considered then dropped

- **Single combined "deep-review fixes" task:** Rejected — hook fix + component a11y + two test layers exceed ~4h cap and block parallel dispatch across jest/playwright boundaries.
- **Task for mobile-ux F-003 (aria-live WARNING):** Desktop-ux already classified same gap as SHOULD-FIX F-001; covered by T-f8cfd2f7, not duplicated.
- **Task for WARNING items (empty url prop, Error story mock, Storybook menu parity):** Router explicitly deferred WARNINGs to PR summary; not scheduled.
- **NO_OP:** Rejected — four concrete SHOULD-FIX themes require implementation work.

## Ambiguities encountered

- **OrderDetailsPage test heaviness:** Page has many required props; task context notes minimal-fixture approach per correctness finding suggestion but leaves mock strategy to Task agent (no existing `OrderDetailsPage*.test.*` precedent in repo).

## Concerns / warnings

- Playwright E2E task depends on configured backend — acceptance follows repo's existing E2E pattern rather than mandating clipboard API assertion if environment lacks permissions.
- T-f8cfd2f7 may need a visually-hidden CSS pattern; no dedicated `VisuallyHidden` utility found in `src/` grep — Task agent may need inline styles or macaw pattern.

## Did not do (out of scope or deferred)

- Linear read/write, browser verification: prompt restricts this agent to artifact reads + tasks.md write.
- Modifying source code: task-creation only schedules fix-tasks for implementation loop.
