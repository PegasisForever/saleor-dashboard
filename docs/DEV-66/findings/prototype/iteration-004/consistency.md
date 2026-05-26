---
agent: step-2-consistency-reviewer
input_branch: 3b7f75ab9ea285ec7b621260829aff022f08b6a6
verdict: pass
---

## Summary

DEV-66 prototype iteration 4 is internally coherent: PRD, UI design, and tech plan describe the same client-only `OrderCopyLinkButton` on non-draft `OrderDetailsPage` TopNav, the branch `src/` diff matches tech-plan § Affected components exactly (6/6 files), Storybook exposes eight distinct states verified at the published URL, and no security, migration, performance, or API-breaking issues were found. Seven WARNING-level documentation and pre-merge hygiene gaps remain (PRD message-catalog completeness, draft-surface wording, locale extraction, tests, strict typing); none would cause Step 5 task creation to ship the wrong feature if read carefully.

## Findings

### F-001 [WARNING] PRD scope omits `copyOrderLinkFailed` message
- Location: `docs/DEV-66/prd.md` § Scope (lines 9–15) vs `docs/DEV-66/tech-plan.md` § Affected components (line 30)
- Description: PRD in-scope bullets list only `messages.copyOrderLink`. Tech plan and UI design also document `messages.copyOrderLinkFailed` for the Error story. Production intentionally omits error UI; the message exists for Storybook only.
- Evidence: PRD line 14 cites `messages.copyOrderLink` only; `messages.ts` exports both keys; Error story uses `messages.copyOrderLinkFailed` at `OrderCopyLinkButton.stories.tsx:88`.
- Suggested fix: Add a PRD scope bullet noting `copyOrderLinkFailed` is Storybook-only (future production affordance), or cross-reference tech-plan § Risks.

### F-002 [WARNING] UI design entry points omit explicit draft-surface exclusion
- Location: `docs/DEV-66/ui-design.md` § Order details TopNav → Entry points (line 12) vs `docs/DEV-66/prd.md` § Scope out-of-scope (lines 16–17)
- Description: PRD explicitly excludes draft order TopNav (`OrderDraftPage`). UI design says "Orders list → open order → order details view" without naming the draft exclusion.
- Evidence: `OrderDraftPage.tsx` TopNav has no `OrderCopyLinkButton`; integration is only in `OrderDetailsPage.tsx:211`.
- Suggested fix: Add "non-draft `OrderDetailsPage` only; not `OrderDraftPage`" to UI design entry points.

### F-003 [WARNING] PRD "non-draft" phrasing is ambiguous
- Location: `docs/DEV-66/prd.md` acceptance criteria (line 29)
- Description: AC says "non-draft order details page (`OrderDetailsPage`)" which can be read as an order-status filter. `OrderDetailsPage` also serves unconfirmed orders; the button renders for any truthy `orderId` with no status guard.
- Evidence: All artifacts agree on surface-based scope (`OrderDetailsPage`, not `OrderDraftPage`); `OrderCopyLinkButton` has no status check (`OrderCopyLinkButton.tsx:26–28`).
- Suggested fix: Rephrase AC to "on `OrderDetailsPage` (not `OrderDraftPage`)" instead of "non-draft".

### F-004 [WARNING] i18n messages not extracted to locale catalogs
- Location: `src/orders/components/OrderCopyLinkButton/messages.ts`; `locale/` tree
- Description: New `messages.copyOrderLink` and `messages.copyOrderLinkFailed` are defined via `defineMessages` but absent from locale JSON catalogs. Non-English locales fall back to English until `pnpm run extract-messages`.
- Evidence: Grep of `locale/` for `copyOrderLink` returns no matches; messages file defines both keys at lines 4–13.
- Suggested fix: Run `pnpm run extract-messages` during implementation; add to task acceptance criteria.

### F-005 [WARNING] No unit tests for `getOrderAbsoluteUrl`
- Location: `src/orders/utils/getOrderAbsoluteUrl.ts`; tech-plan § Risks (line 41)
- Description: Tech plan calls for unit-testing the URL builder with mocked `window.__SALEOR_CONFIG__` / mount-uri. No test file references `getOrderAbsoluteUrl` or `OrderCopyLinkButton`.
- Evidence: Grep of `**/*.{test,spec}.{ts,tsx}` for those symbols returns zero matches.
- Suggested fix: Add unit tests covering subpath mount-uri, origin join, and encoded order ID in task acceptance.

### F-006 [WARNING] Strict-ready typing gap in copy handler
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:22–24`
- Description: `orderId` is optional on props but passed to `getOrderAbsoluteUrl(orderId: string)` inside `handleCopy` before the falsy guard. Runtime-safe (button not rendered when empty), but not strict-ready per project-context convention for new code.
- Evidence: `handleCopy` calls `getOrderAbsoluteUrl(orderId)` at line 23; guard at lines 26–28 runs after callback definition.
- Suggested fix: Narrow inside callback (`if (!orderId) return; copy(getOrderAbsoluteUrl(orderId))`) or make `orderId` required when button renders.

### F-007 [WARNING] UI design mobile section contradicts itself on wrapping
- Location: `docs/DEV-66/ui-design.md` § Mobile considerations (line 39)
- Description: Text says "TopNav children wrap per `TopNav` `flexWrap="nowrap"`" — "wrap" and `nowrap` contradict. Actual TopNav action cluster uses `flexWrap="nowrap"` (`Root.tsx:70`), keeping actions on one line.
- Evidence: `src/components/AppLayout/TopNav/Root.tsx:68–74` sets `flexWrap="nowrap"` on the children container.
- Suggested fix: Reword to "TopNav action cluster does not wrap (`flexWrap=\"nowrap\"`)".
