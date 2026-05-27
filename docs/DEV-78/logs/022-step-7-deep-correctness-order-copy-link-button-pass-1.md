---
agent: step-7-deep-correctness-order-copy-link-button-pass-1
sequence: 22
input_branch: 04aaf8e902a7277b5e64bee43842a5c4f41bed35
status: DONE
---

## Summary

Ran independent correctness deep review for DEV-78 order-copy-link-button: read PRD/tech-plan/project-context, traced integration from `OrderDetailsPage` through `OrderCopyLinkButton`/`getOrderShareableUrl`, ran scoped unit tests and type-check, attempted Playwright E2E (blocked by missing API_URL), and verified Storybook stories via sub-agent chrome walkthrough. Implementation matches PRD; verdict **fail** on test-coverage mechanical check due to missing TopNav integration tests.

## Decisions made independently

- **URL encoding omission is not a BLOCKER**: `getOrderShareableUrl` uses raw `orderPath(orderId)` per PRD; route handler decodes via `decodeURIComponent` at `src/orders/index.tsx`. Differs from `orderUrl` encoding by design, not a paste-resolution bug for typical GraphQL IDs.
- **test-coverage mechanical fail despite passing unit tests**: Acceptance criteria 1 and 5 (TopNav placement + conditional render) are load-bearing and have zero automated coverage; partial label/icon coverage for criteria 3–4 is WARNING-level only.
- **e2e-tests marked skip not fail**: Playwright auth setup failed (`API_URL` unset); no `copy-order-link` spec exists. Skipped due to environment, not green pass.
- **No BLOCKER findings**: Source wiring, URL builder, i18n, and clipboard reuse are correct; gaps are test coverage only.

## Files / sections inspected

- `docs/DEV-78/prd.md`: eight acceptance criteria mapped to code paths
- `docs/DEV-78/tech-plan.md`, `docs/DEV-78/project-context.md`: architecture and constitution rules
- `docs/DEV-78/ui-design.md`: Storybook URL and six required states
- `docs/DEV-78/logs/017-step-7-coordinator-pass-1.md`: touchedFiles scope (src/ + locale/)
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: click handler, labels, icon wiring
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`: 3 unit tests (click, aria-label states)
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: six story exports
- `src/orders/components/OrderCopyLinkButton/messages.ts`: i18n message IDs
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211-219`: TopNav integration
- `src/orders/urls.ts:192-195,237-238`: `getOrderShareableUrl` vs `orderUrl` encoding
- `src/orders/urls.test.ts:82-124`: mount prefix and root deploy cases
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts`: 2s reset and rejection handling
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: optional size/strokeWidth backward compat
- `src/orders/index.tsx` (via sub-agent): route `:id` + `decodeURIComponent`
- `locale/defaultMessages.json` diff: extracted message entries
- `playwright/tests/orders.spec.ts`, `playwright/pages/ordersPage.ts`: no copy-link coverage

## Considered then dropped

- **BLOCKER on missing `encodeURIComponent` in shareable URL**: Re-read route parsing and PRD spec (`orderPath(orderId)` without encoding). GraphQL global IDs in fixtures resolve; same raw-ID pattern as `orderFulfillPath`. Downgraded to non-finding.
- **BLOCKER on missing Playwright E2E**: Tech plan lists manual verification; PRD does not mandate E2E. Filed as mechanical skip + WARNING integration gap, not production defect.
- **BLOCKER on Copied Storybook static preview**: Production uses live `useClipboard`; preview is documentation-only. Not a runtime correctness issue.
- **FAIL verdict solely on WARNING findings**: Applied verdict rule — `test-coverage` mechanical check is `fail`, which forces overall `fail` even without BLOCKER findings.

## Dead ends and retries

- **Playwright E2E**: `pnpm exec playwright test playwright/tests/orders.spec.ts --grep "SALEOR_28"` failed at auth setup — `TypeError: apiRequestContext.post: Invalid URL` because `API_URL` env var unset. Could not exercise order-details flow in browser.
- **Coordinator findings path**: `docs/DEV-78/findings/deep-review/pass-001/` did not exist pre-review; created directory when writing output.

## Ambiguities encountered

- **Whether test-coverage fail should force verdict fail when implementation is correct**: Applied literal verdict rule (any mechanical fail → fail). Router decides routing.
- **E2e-tests skip vs fail when env blocked**: Chose skip with documented env blocker; existence of no copy-link spec noted in findings.

## Concerns / warnings

- Storybook `[data-state]` CSS rules live in production `OrderCopyLinkButton.module.css` — no runtime impact but adds bundle noise (out of correctness scope).
- `OrderDetailsPage.tsx` remains `@ts-strict-ignore`; new wiring is minimal and type-safe at call site.

## Did not do (out of scope or deferred)

- Read sibling deep-review findings or shallow-review findings (pure-reviewer rule)
- Run full Playwright suite (requires Saleor backend + credentials)
- Manual live dashboard walkthrough on running dev server (Storybook chrome walkthrough covered visual PRD criterion)
