---
agent: step-2-consistency-reviewer
input_branch: 9a98d2fd75f21b7d9a968ded8b8968085e7ae902
verdict: pass
---

## Summary

PRD, UI Design, Tech Plan, and the prototype diff describe the same feature shape: a client-only `OrderCopyLinkButton` on non-draft `OrderDetailsPage` that copies an absolute order URL via `useClipboard` + `getOrderAbsoluteUrl`, with eight Storybook states under `Orders/OrderCopyLinkButton`. The `src/` diff matches tech-plan § Affected components exactly (6/6 files). No security, migration, API-breaking, or performance blockers were found. Remaining issues are documentation-completeness and pre-merge hygiene gaps that a careful Step 5 reader can resolve in seconds.

## Findings

### F-001 [WARNING] Draft-order exclusion stated only in PRD
- Location: `docs/DEV-66/prd.md:17,29` vs `docs/DEV-66/ui-design.md:9-22`, `docs/DEV-66/tech-plan.md:33`
- Description: PRD explicitly scopes to non-draft `OrderDetailsPage` and lists draft TopNav as out of scope. UI Design and Tech Plan describe `OrderDetailsPage` integration only and never restate the draft exclusion.
- Evidence: PRD out-of-scope bullet at line 17; integration only in `OrderDetailsPage.tsx:211`; no wiring in `OrderDraftPage`.
- Suggested fix: Add a one-line draft exclusion note to UI Design and Tech Plan for parity with PRD.

### F-002 [WARNING] Story state naming convention differs across artifacts
- Location: `docs/DEV-66/prd.md:36` vs `docs/DEV-66/ui-design.md:26-34`
- Description: PRD acceptance criteria list PascalCase story export names (`Default`, `Hover`, …). UI Design maps lowercase slug keys (`default`, `hover`, …) to those exports. Same eight states; labeling convention differs.
- Evidence: PRD AC line 36; UI Design lines 27–34; implementation exports match PRD PascalCase at `OrderCopyLinkButton.stories.tsx:25-108`.
- Suggested fix: Align on one convention in all three artifacts (PascalCase export names are the implementation source of truth).

### F-003 [WARNING] `messages.copyOrderLinkFailed` documented outside PRD Scope bullets
- Location: `docs/DEV-66/prd.md:9-15` vs `docs/DEV-66/ui-design.md:33`, `docs/DEV-66/tech-plan.md:30,42`
- Description: PRD Scope in-scope bullets mention only `messages.copyOrderLink`. UI Design and Tech Plan also define `messages.copyOrderLinkFailed` for the Error story prototype. All three agree production has no in-UI error affordance today.
- Evidence: `messages.ts:9-13`; Error story at `OrderCopyLinkButton.stories.tsx:81-99`; tech-plan risk note at line 42.
- Suggested fix: Add `copyOrderLinkFailed` to PRD Scope as Storybook-only, or note in Tech Plan that PRD Scope is the label catalog for production strings only.

### F-004 [WARNING] Tech Plan omits `disabled` prop on `OrderCopyLinkButton`
- Location: `docs/DEV-66/tech-plan.md:29` vs `docs/DEV-66/ui-design.md:31-32`, `OrderCopyLinkButton.tsx:11-12,35`
- Description: Tech Plan describes the component as having optional `orderId` only. UI Design Disabled/Loading stories and the implementation both rely on a `disabled` prop.
- Evidence: `OrderCopyLinkButton.tsx:11-12,35`; Disabled story `:63-68`; Loading story `:71-78`.
- Suggested fix: Add `disabled?: boolean` to Tech Plan § Affected components description.

### F-005 [WARNING] UI Design mobile note contradicts `flexWrap="nowrap"`
- Location: `docs/DEV-66/ui-design.md:39`, `src/components/AppLayout/TopNav/Root.tsx:68-74`
- Description: UI Design says TopNav children "wrap per `flexWrap=\"nowrap\"`", which is internally contradictory — `nowrap` prevents wrapping. The action cluster (copy, metadata, menu) stays on one row, which matches the code.
- Evidence: `Root.tsx:70` sets `flexWrap="nowrap"` on the children container; Storybook Default story renders a single secondary icon button (`aria-label="Copy order link"`).
- Suggested fix: Reword to "action cluster does not wrap (`flexWrap=\"nowrap\"`)".

### F-006 [WARNING] Storybook `meta.args.orderId` unused; `SAMPLE_ORDER_ID` duplicated in renders
- Location: `OrderCopyLinkButton.stories.tsx:15-17`, `:28`, `:37`, `:47`, `:57`, `:66`, `:75`, `:86`
- Description: `meta.args.orderId` is declared but never consumed because every story uses a custom `render` with hardcoded `SAMPLE_ORDER_ID`. This diverges from the codebase pattern of inheriting args (e.g. `export const Default: Story = {}`). Not a duplicate-state defect — Loading vs Disabled differ via `.storyLoading` wrapper — but it is story hygiene debt.
- Evidence: All eight stories use custom `render`; grep shows seven inline `SAMPLE_ORDER_ID` references despite meta-level args.
- Suggested fix: Refactor to `render: (args) => …` using inherited args, or drop unused `meta.args`.

### F-007 [WARNING] New i18n messages not yet extracted to `locale/` catalogs
- Location: `src/orders/components/OrderCopyLinkButton/messages.ts:4-13`
- Description: `messages.copyOrderLink` and `messages.copyOrderLinkFailed` are defined via `defineMessages` but absent from `locale/` JSON files (grep over `locale/` returns no matches). Pre-merge workflow per `project-context.md:20` expects `pnpm run extract-messages`.
- Evidence: `messages.ts:4-13`; `locale/` grep for symbol text and IDs returns empty.
- Suggested fix: Run `extract-messages` before merge; cite symbols (`messages.copyOrderLink`) in task acceptance, not hash IDs.

### F-008 [WARNING] `getOrderAbsoluteUrl` unit tests missing despite tech-plan mitigation
- Location: `docs/DEV-66/tech-plan.md:41`, `src/orders/utils/getOrderAbsoluteUrl.ts:1-10`
- Description: Tech Plan Risks section calls for unit tests of the URL builder with mocked mount URI. No `getOrderAbsoluteUrl.test.ts` appears in the diff; sibling utils in the same folder have tests (`data.test.ts`, etc.).
- Evidence: Diff contains helper file but no corresponding test file; tech-plan line 41.
- Suggested fix: Add a Step 5 task for mount-URI/subpath URL builder tests.

### F-009 [WARNING] `handleCopy` passes possibly-undefined `orderId` to strict helper
- Location: `OrderCopyLinkButton.tsx:22-28`, `getOrderAbsoluteUrl.ts:5`
- Description: `orderId` is optional on the component, and `handleCopy` is defined before the falsy guard, calling `getOrderAbsoluteUrl(orderId)` where TypeScript sees `string | undefined`. Runtime-safe because the button only renders when `orderId` is truthy, but not fully strict-ready per `project-context.md:33`.
- Evidence: `OrderCopyLinkButton.tsx:22-28`; helper signature requires `string` at `getOrderAbsoluteUrl.ts:5`.
- Suggested fix: Move guard above callback or narrow type inside `handleCopy`.

### F-010 [WARNING] PRD requires `data-test-id` but no tests cover the control yet
- Location: `docs/DEV-66/prd.md:15,34`, `OrderCopyLinkButton.tsx:38`
- Description: PRD acceptance criteria require `data-test-id="copy-order-link"`. The attribute is present in production code, but no RTL or Playwright test in the diff exercises it.
- Evidence: `OrderCopyLinkButton.tsx:38`; diff has no `*.test.ts(x)` for this component.
- Suggested fix: Add component or E2E test task in Step 5.
