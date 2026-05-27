---
agent: step-7-deep-correctness-order-copy-link-button-pass-1
sequence: 18
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
status: DONE
---

## Summary

Ran correctness deep review for DEV-85 order-copy-link-button: read full source diff, expanded into parent (`OrderDetailsPage`), hook (`useClipboard`), sibling clipboard patterns, and test overlap. Spawned six parallel sub-agents for forced adversarial prompts; consolidated observations into five findings (3 SHOULD-FIX, 2 WARNING). Unit tests pass after `pnpm install --store-dir /tmp/pnpm-store`. Verdict `fail` driven by `test-coverage` mechanical check and SHOULD-FIX gaps on placement/E2E/timer behavior.

## Decisions made independently

- **No BLOCKER on optional `order` in parent**: Considered SLRD-001 Bug 3 pattern; `OrderCopyLinkButton` does not dereference `order`—only `window.location.href`—so loading-state crash is not applicable.
- **Timer stacking classified SHOULD-FIX not BLOCKER**: Affects PRD 2s feedback under rapid clicks but requires intentional double-click within 2s; fix is localized to `useClipboard.ts`.
- **Draft-order scope**: Verified draft orders use `OrderDraftPage`, not `OrderDetailsPage`; absence of copy button on drafts matches PRD out-of-scope—not filed as finding.
- **Hook-only failure coverage acceptable at architecture boundary**: PRD clipboard-failure AC is implemented and tested in `useClipboard.test.ts`; did not SHOULD-FIX missing container-level duplicate.
- **Verdict fail**: `test-coverage` mechanical check fails due to missing TopNav placement and Playwright tests despite passing unit tests.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/ ...` — full feature delta (~300 LOC).
- `src/orders/components/OrderCopyLinkButton/*` — all 7 component/story/test files.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:205-233` — TopNav integration wire-up.
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201` — parent view passing optional `order`.
- `src/orders/views/OrderDetails/OrderDraftDetails/index.tsx` — confirms draft path skips `OrderDetailsPage`.
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts` — clipboard contract, timer, failure paths.
- `src/components/CopyableText/CopyableText.test.tsx` — sibling test pattern comparison.
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx:56` — existing `ClipboardCopyIcon` consumer unchanged.
- `docs/DEV-85/prd.md`, `tech-plan.md`, `project-context.md`, `ui-design.md`, `tasks.md` — PRD/constitution conformance.
- `playwright/tests/orders.spec.ts` + `rg copy-order-link playwright/` — E2E gap confirmation.
- `locale/defaultMessages.json` — i18n catalog entries for new message IDs.

## Considered then dropped

- **BLOCKER on Form nested buttons without `type="button"`**: Both copy and metadata buttons sit inside `<Form>` without explicit type; pre-existing metadata pattern (`OrderDetailsPage.tsx:212-218`); grep shows zero `type="button"` under `src/orders/**`. Downgraded to not filed—same omission as neighbor, not introduced by this diff.
- **BLOCKER on query-param leakage in copied URL**: PRD and ui-design explicitly accept full `window.location.href` including query/dialog params; intentional product decision.
- **SHOULD-FIX on i18n missing from non-default locale files**: Only `defaultMessages.json` has new IDs; project extract script targets default catalog; runtime falls back to `defaultMessage` in `messages.ts`—consistent with repo convention.
- **SHOULD-FIX on missing `title` attribute unit assertion**: Partial coverage via `getByRole` on aria-label; downgraded to not filed separately (subsumed under test-coverage narrative).

## Dead ends and retries

- **`pnpm install` EACCES on `~/.pnpm-store`**: Retried with `pnpm install --store-dir /tmp/pnpm-store` — succeeded.
- **`pnpm run test:quiet` before install**: `jest: not found`; fixed after install — both test files PASS.
- **Sub-agent forced-prompt 6 (shell)**: Returned BLOCKED in Ask mode without test output; re-ran tests in main session.

## Ambiguities encountered

- **api-contract tests**: No contract-test harness in repo; tech plan states N/A for browser Clipboard API — marked `skip`.
- **E2E execution**: Playwright listing requires authenticated Saleor backend (`BASE_URL` empty); verified absence of feature spec via grep rather than running full suite.

## Concerns / warnings

- Inherited `useClipboard` timer stacking affects all clipboard consumers (`CopyableText`, `TrackingNumberDisplay`, etc.), not only this button—fix would be shared-hook change.
- Story `Error` state is documentation-only; could mislead QA expecting simulated failure in Storybook.

## Did not do (out of scope or deferred)

- Read sibling deep-review findings under `docs/DEV-85/findings/deep-review/` (pure-reviewer discipline).
- Chrome MCP walkthrough of live order details (no dev server + backend running; keyboard/focus AC verified statically via Macaw Button + Storybook CSS).
- Fix implementation issues (review-only pass).
