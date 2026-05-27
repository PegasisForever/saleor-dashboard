---
agent: step-7-deep-correctness-order-details-copy-link-pass-1
sequence: 22
input_branch: e4ebc9531190c0993a632681a64d25ca24dc19db
status: DONE
---

## Summary

Reviewed cumulative diff `45b5cef8..e4ebc953` for DEV-75 order-details-copy-link: read all 7 implementation files, parent `OrderDetailsPage` integration, `useClipboard`, `orderPath`/`orderUrl`, and planning artifacts. Spawned four sub-agents (PRD, constitution, test-coverage, e2e/api-contract). PRD and constitution pass; no production correctness BLOCKERs. Verdict **fail** on mechanical `e2e-tests` and `test-coverage` gaps. Four WARNING findings on missing automated coverage.

## Decisions made independently

- **No BLOCKER on missing tests**: Implementation matches PRD at code-path level; test gaps are WARNING per shallow-review precedent, but mechanical checks still fail.
- **Double encodeURIComponent not a bug**: Verified `getOrderAbsoluteUrl` mirrors `orderUrl` (`orderPath(encodeURIComponent(id))`); `orderPath` does not re-encode. Coordinator flag dismissed after reading `urls.ts:234-235`.
- **api-contract skip**: Tech-plan explicitly N/A; no contract harness in repo.
- **Loading-state `order.id` not flagged**: `OrderCopyLinkButton` uses `order.id` same as pre-existing L375 `AppWidgets`; pre-existing page contract, not introduced defect.

## Files / sections inspected

- `docs/DEV-75/prd.md`: 9 acceptance criteria mapped to code
- `docs/DEV-75/tech-plan.md`, `docs/DEV-75/project-context.md`, `docs/DEV-75/ui-design.md`: architecture and conventions
- `docs/DEV-75/logs/017-step-7-coordinator-pass-1.md`: touchedFiles scope (7 src/locale files)
- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/ OrderDetailsPage.tsx locale/`: full feature diff
- `src/orders/components/OrderCopyLinkButton/*`: component, util, CSS, stories, messages
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`: TopNav wiring
- `src/hooks/useClipboard.ts`: 2s reset, failure handling
- `src/orders/urls.ts:192,234-235`: orderPath vs orderUrl encoding
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: copy/check icon toggle
- `src/utils/urls.ts:27-28`: getAppMountUriForRedirect
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201-222`: parent passes order to OrderDetailsPage
- `locale/defaultMessages.json`: KQKqAj, a54LHM entries
- `playwright/tests/orders.spec.ts`, grep `playwright/` for copy-order-link: 0 matches
- `grep **/*.{test,spec}.{ts,tsx}` for OrderCopyLinkButton/getOrderAbsoluteUrl: 0 matches

## Considered then dropped

- **BLOCKER on double-encoding**: Initially flagged per coordinator note; re-read `orderPath` (no encode) and `orderUrl` (same pattern) — encoding is intentional and consistent with navigation URLs.
- **BLOCKER on loading crash (`order.id`)**: Considered `order.id` without optional chaining during Apollo loading; dropped because same pattern pre-exists at L375 and `createOrderMetadataIdSchema(order)` already assumes order presence — not introduced by this diff.
- **BLOCKER on whitespace orderId**: `!orderId` is false for whitespace-only strings; dropped as unrealistic for GraphQL global IDs.
- **FAIL on storybook-interaction-tests**: Storybook vitest passed after playwright install; added as pass mechanical check despite not covering interactive copy (covered under F-003).

## Dead ends and retries

- `pnpm install` failed with EACCES on `~/.pnpm-store` → retried with `--store-dir /tmp/pnpm-store` → success.
- `pnpm run test-storybook` failed (no chromium) → `pnpm exec playwright install chromium` → 398 tests passed.
- e2e/api-contract sub-agent returned "not verified" (readonly mode) → re-ran grep and playwright search in main session.

## Ambiguities encountered

- **PRD AC8 contrast**: Implementation uses macaw tokens; no runtime contrast measurement in this pass — treated as pass at code-path level (same as sub-agent PRD review).
- **Storybook test scope**: Vitest runs all 88 story files even when path filter passed; all passed — cannot isolate only OrderCopyLinkButton count but plays in that file are included.

## Concerns / warnings

- Shallow review already flagged test/doc gaps (F-001/F-002 overlap); deep review confirms with expanded AC/edge-case matrix.
- `Disabled` story uses both `orderId=""` and `disabled` prop — does not isolate empty-orderId-only disable path (`isDisabled = disabled || !orderId`), though code logic is correct.

## Did not do (out of scope or deferred)

- Chrome MCP production walkthrough: Storybook vitest + static code review covered AC paths; no running dev server + Saleor backend for live order details click test.
- Read sibling deep-review findings or prior pass artifacts (pure-reviewer discipline).
- Update PRD checkboxes (pipeline doc-sync step).
