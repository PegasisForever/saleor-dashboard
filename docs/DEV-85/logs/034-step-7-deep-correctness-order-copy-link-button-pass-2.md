---
agent: step-7-deep-correctness-order-copy-link-button-pass-2
sequence: 34
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
status: DONE
---

## Summary

Ran pass-2 correctness deep review for DEV-85 order-copy-link-button: read cumulative diff since `45b5cef8`, expanded scope to parents/call sites/siblings/hook consumers/tests, spawned six parallel sub-agents for adversarial prompts, ran 12/12 unit tests after `pnpm install`, and statically verified Playwright `TC: SALEOR_218` (execution blocked — no Saleor `API_URL`). Verdict `pass` with two SHOULD-FIX E2E coverage gaps and two WARNINGs.

## Decisions made independently

- **Verdict pass despite E2E execution failure**: Auth setup requires `API_URL`; statically verified test structure and assertions instead of marking whole review blocked.
- **Loop-back fixes accepted**: Timer orphan fix, aria-live, placement test, and Playwright spec address pass-1 SHOULD-FIX themes; no BLOCKER regressions.
- **F-001/F-002 classified SHOULD-FIX not WARNING**: PRD AC2/AC3 are load-bearing acceptance criteria with partial E2E coverage — matches calibration for missing AC tests.
- **F-003 kept WARNING**: Rapid re-copy SR re-announce was explicitly deferred in shallow review iter-4; timer fix intentionally trades remount for correctness.
- **No BLOCKER on encodeURIComponent**: Feature copies `window.location.href`, not constructed order paths — sibling URL helper drift does not apply.

## Files / sections inspected

- `docs/DEV-85/logs/029-step-7-coordinator-pass-2.md` — touchedFiles scope and loop-back context.
- `docs/DEV-85/prd.md`, `docs/DEV-85/tech-plan.md`, `docs/DEV-85/project-context.md`, `docs/DEV-85/ui-design.md` — AC trace and constitution.
- `git diff 45b5cef8..HEAD -- src/ locale/ playwright/` — 16 source files.
- `src/orders/components/OrderCopyLinkButton/*` — full feature implementation.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — parent wire-up.
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts` — timer fix + regression tests.
- `src/components/CopyableText/CopyableText.tsx`, `TrackingNumberDisplay.tsx` — sibling clipboard patterns.
- `playwright/tests/orders.spec.ts:155-178`, `playwright/pages/ordersPage.ts:62-63` — E2E.
- `pnpm run test:quiet` on 3 test files — 12/12 pass.
- Six sub-agent reports (sibling patterns, PRD trace, missing behaviors, adversarial inputs, async races, attacker/constitution).

## Considered then dropped

- **BLOCKER on missing `encodeURIComponent`**: Grep of `urls.ts` helpers showed encoding on constructed paths, but this feature uses `window.location.href` verbatim per PRD — not a bug.
- **BLOCKER on optional `order` during loading**: Traced `OrderDetailsPage` — copy button never dereferences `order`; only reads `window.location.href`.
- **SHOULD-FIX on out-of-order `writeText` promises**: Real edge case in shared hook predating this feature; hook tests cover ordered resolution; downgraded — not introduced by this diff's contract.
- **SHOULD-FIX on synchronous `navigator.clipboard` absence**: Pre-existing hook limitation shared by CopyableText/TrackingNumberDisplay; not new surface.
- **BLOCKER on E2E execution failure**: Environment lacks Saleor backend; test code exists and is structurally valid — did not fail entire review.

## Dead ends and retries

- **`pnpm run test:quiet` initially failed**: `jest: not found` — fixed with `pnpm install --store-dir /tmp/pnpm-store`.
- **Playwright E2E**: Failed at auth setup (`API_URL` empty / no backend); switched to static test-code review.

## Ambiguities encountered

- **Whether E2E clipboard read is feasible in CI**: Playwright config has no explicit clipboard permissions; suggested fix in F-001 notes grant-if-needed pattern — did not attempt live browser without backend.

## Concerns / warnings

- Coordinator pass-2 note on deferred aria-live re-announce aligns with F-003.
- Duplicate Playwright test ID `SALEOR_218` in `permissionGroup.spec.ts` is pre-existing, unrelated to this feature.

## Did not do (out of scope or deferred)

- Read pass-001 findings files or sibling pass-002 reviewers (pure-reviewer discipline).
- Chrome walkthrough of production order details (no running dev server + backend).
- api-contract HTTP tests (tech plan N/A — browser Clipboard API only).
