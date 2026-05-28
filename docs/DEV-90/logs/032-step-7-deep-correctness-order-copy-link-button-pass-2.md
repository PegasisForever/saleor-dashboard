---
agent: step-7-deep-correctness-order-copy-link-button-pass-2
sequence: 32
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
status: DONE
---

## Summary

Ran pass-2 correctness deep review on the 10-file `order-copy-link-button` diff (~470 LOC including post-pass-1 remediation). Expanded scope to parent `OrderDetailsPage`, route host, sibling URL/clipboard patterns, and all export call sites. Spawned six non-chrome adversarial sub-agents; consolidated observations into one SHOULD-FIX (missing nav-reset test) and four WARNINGs. Unit tests 12/12 pass after local `pnpm install`. Verdict **pass** — no BLOCKERs; pass-1 fixes verified in code.

## Decisions made independently

- **encodeURIComponent not filed:** Grepped `orderUrl` at `urls.ts:235`; `getShareableOrderUrl` delegates correctly — same pattern as all order URL helpers that encode id.
- **Trailing `?` not filed:** Tech-plan and PRD document intentional trailing `?` from `orderUrl`; auth helpers strip it for different URL shapes — not a regression.
- **Form submit via copy button not filed:** Metadata button in same TopNav-in-Form layout predates this feature; no evidence Macaw `Button` triggers unintended submit in existing integration.
- **Out-of-order writeText race → WARNING only:** Requires overlapping async resolution faster than human double-click; timer-overlap case that matters to humans is fixed and tested.
- **test-coverage mechanical pass:** Core load-bearing paths now have tests; remaining gaps are integration/nav-reset → findings, not mechanical fail.
- **e2e skip:** Playwright has zero `copy-order-link` coverage; running unrelated order E2E would not exercise this surface.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/` — full 10-file delta including iter-2/3 remediation.
- `docs/DEV-90/logs/027-step-7-coordinator-pass-2.md` — touchedFiles scope (not prior findings).
- `docs/DEV-90/prd.md`, `tech-plan.md`, `ui-design.md`, `project-context.md` — AC and constitution trace.
- `src/orders/components/OrderCopyLinkButton/*` — component, URL builder, tests, stories, CSS, messages.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-232` — parent wire-up, Form context, TopNav order.
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts` — timer fix + rapid re-click test.
- `src/orders/urls.ts:234-235`, `src/orders/index.tsx:82-87` — encoding + decode symmetry.
- `src/utils/urls.ts:27-28`, `src/auth/utils.ts:108-109` — mount-uri and sibling absolute URL builders.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — icon swap contract.
- Sibling clipboard consumers: `CopyableText.tsx`, `OrderCustomer.tsx`, `TrackingNumberDisplay.tsx`, `PspReference.tsx`.
- Grep: `OrderCopyLinkButton`, `getShareableOrderUrl`, `copy-order-link` across `src/` and `playwright/`.
- `docs/DEV-90/findings/implementation/iteration-003/shallow-review.md` — nav-reset test gap confirmation (not pass-1 deep-review findings).

## Considered then dropped

- **BLOCKER on missing encodeURIComponent:** Sub-agent + direct read of `orderUrl` confirmed encoding — dropped.
- **SHOULD-FIX on clipboard-denied silent failure:** PRD/ui-design explicitly out-of-scope for error UI; hook tests rejection path — dropped for this angle.
- **SHOULD-FIX on out-of-order writeText:** Theoretical async interleaving; human double-click case addressed by `clear()` fix — downgraded to not filed.
- **BLOCKER on optional `order.id` deref:** Parent uses `order?.id` guard consistently — dropped (SLRD-001-class bug not present).
- **FAIL verdict on test-coverage:** Considered failing mechanical check for nav-reset gap; classified gap as SHOULD-FIX finding instead with mechanical pass since URL/click/hook paths are covered.

## Dead ends and retries

- **`pnpm install` EACCES on `~/.pnpm-store`:** Retried with `--store-dir .pnpm-store` in repo root — succeeded.
- **`jest: not found` before install:** Resolved by install step above.
- **Sub-agents in Ask mode could not run `git diff`:** Ran diff locally in main session; sub-agents used HEAD file reads.

## Ambiguities encountered

- **Verdict vs test-coverage fail with only WARNING/SHOULD-FIX gaps:** Interpreted pass-1 remediation as satisfying the mechanical floor; integration test absence is finding-tier, not automatic mechanical fail.
- **Chrome batched walkthrough:** Skipped — correctness angle owns e2e/api/prd/constitution/test-coverage baselines; production app not required for unit-level correctness pass; no feature-specific Playwright spec exists.

## Concerns / warnings

- Nav-reset test gap persists from shallow review iter-3 — filed F-001 SHOULD-FIX so Router can route to task-creation if desired.
- i18n message IDs (`rdiFOg`, `vcCUT0`) not yet in `locale/*.json` — normal pre-`extract-messages` state; not filed.

## Did not do (out of scope or deferred)

- Read pass-001 deep-review findings files — pure-reviewer discipline.
- Chrome DevTools Storybook walkthrough — desktop-ux angle territory; not required for correctness baseline checks this run.
- Run full Playwright E2E suite — requires backend; no copy-link spec to execute.
