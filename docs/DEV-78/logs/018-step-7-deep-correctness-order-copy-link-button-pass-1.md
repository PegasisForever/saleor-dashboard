---
agent: step-7-deep-correctness-order-copy-link-button-pass-1
sequence: 18
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
status: DONE
---

## Summary

Deep correctness review of DEV-78 `order-copy-link-button` area: read diff (11 files, ~515 LOC), planning artifacts, integration parents, and sibling URL helpers; ran 4 unit tests (pass); spawned six non-chrome sub-agents for forced prompts. Verdict **fail** (mechanical `test-coverage` / `e2e-tests` fail, no BLOCKERs). Five WARNINGs filed (encoding drift, Jest AC4 gap, mocked URL tests, orderId/copied race, no Playwright).

## Decisions made independently

- **encodeURIComponent drift is WARNING not BLOCKER**: PRD AC#3 explicitly requires raw `orderPath(orderId)`; `decodeURIComponent` at `orders/index.tsx:87` makes typical base64 IDs work, but divergence from `orderUrl` and tech-plan risk §54 is still worth tracking.
- **useClipboard timer race not filed**: Pre-existing hook behavior shared with `TrackingNumberDisplay`; not introduced by this diff.
- **Clipboard-denied UX not filed**: Out of scope per PRD/ui-design; hook-level denial test exists in `useClipboard.test.ts`.
- **api-contract mechanical check `skip`**: Client-only clipboard feature; no contract test harness in repo.
- **Chrome walkthrough not run**: No dev server/backend in sandbox; unit tests + static trace used instead.

## Files / sections inspected

- `docs/DEV-78/prd.md` (AC1–AC8): all criteria traced to code paths
- `docs/DEV-78/tech-plan.md`, `docs/DEV-78/project-context.md`, `docs/DEV-78/ui-design.md`: architecture, risks, conventions
- `docs/DEV-78/logs/013-step-7-coordinator-pass-1.md`: area scope (11 src/locale files)
- `git diff 45b5cef8..HEAD --stat` on `src/**` `locale/**`: confirmed feature-only diff
- `src/orders/utils/getShareableOrderUrl.ts:5-6`: URL builder
- `src/orders/urls.ts:192,234-235`: `orderPath` vs `orderUrl` encoding split
- `src/orders/index.tsx:82-87,161`: route + `decodeURIComponent`
- `src/orders/components/OrderCopyLinkButton/*`: container, view, messages, tests, stories
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-220`: TopNav wiring
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:116-136`: placement test
- `src/hooks/useClipboard.ts`, `src/hooks/useClipboard.test.ts`: clipboard + 2s reset
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx`, `ClipboardCopyIcon.tsx`: sibling patterns
- `playwright/tests/orders.spec.ts` (grep): no copy-link e2e
- `locale/defaultMessages.json` (`BLmn1V`, `ThVxK6`): i18n entries present

## Considered then dropped

- **BLOCKER on missing `encodeURIComponent`**: Prompt’s canonical missed-bug pattern; re-read PRD AC#3 (`orderPath(orderId)` verbatim) and downgraded to WARNING — product spec chose raw path intentionally.
- **BLOCKER on clipboard permission UX**: PRD excludes toasts/error UI; matches existing `useClipboard` contract.
- **BLOCKER on `useClipboard` overlapping timers**: Exists in shared hook; `useClipboard.test.ts` covers multi-click at hook level; not new to this feature.
- **INFO on metadata button hardcoded English title**: Pre-existing `OrderDetailsPage.tsx:217`; out of ticket scope per tech-plan.

## Dead ends and retries

- **`pnpm install` (default store)**: `EACCES` on `~/.pnpm-store/v10`; retried with `--store-dir ./.pnpm-store` — succeeded, tests ran.
- **Coordinator `pass-001/` JSON**: Directory did not exist; used `013-step-7-coordinator-pass-1.md` for touched-files scope instead.

## Ambiguities encountered

- **Whether raw vs encoded copy URL is a defect**: PRD and implementation agree on raw `orderPath`; codebase navigation convention disagrees. Resolved as WARNING with PRD citation rather than BLOCKER.

## Concerns / warnings

- Tech-plan § Affected components omits test/locale files (noted in coordinator log); shallow-review drift only.
- Sub-agents could not run `git diff` in Ask mode; main session verified diff via shell.

## Did not do (out of scope or deferred)

- **Chrome devtools production walkthrough**: No reachable dev server + Saleor backend in sandbox.
- **Full Playwright e2e suite run**: Would require backend auth; grep confirmed no copy-link tests to run.
- **Read sibling reviewer findings / prior pass findings**: Pure-reviewer discipline.
