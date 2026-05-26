---
agent: step-2-consistency-reviewer
input_branch: 9eee24eef25fa1c7e0c5c4987c8a8aab47c7bb34
verdict: pass
---

## Summary

Iteration-003 prototype artifacts are internally coherent: PRD, UI Design, and Tech Plan describe the same feature (TopNav copy-link button with eight Storybook states), the tech-plan affected-components list matches the six-file source diff exactly, Storybook at the recorded URL renders all declared states, and no security, API-breaking, migration, or hot-path performance blockers were found. Residual items are documentation drift and pre-merge hygiene gaps (locale extraction, unit tests, strict typing) that a careful Task Creation reader can resolve without shipping wrong code.

## Findings

### F-001 [WARNING] PRD describes URL inline; UI/Tech Plan name `getOrderAbsoluteUrl`
- Location: `docs/DEV-66/prd.md:30` vs `docs/DEV-66/tech-plan.md:23-29`, `docs/DEV-66/ui-design.md:53-54`
- Description: Acceptance criteria spell out the full `urlJoin(...)` expression while UI Design and Tech Plan centralize on the `getOrderAbsoluteUrl` helper. Same URL shape, different prose abstraction.
- Evidence: PRD AC line 30; implementation in `src/orders/utils/getOrderAbsoluteUrl.ts:5-10` matches both descriptions.
- Suggested fix: Add one PRD bullet noting the helper wraps the inline formula, or cross-link Tech Plan § API conventions.

### F-002 [WARNING] Failure message in Tech/UI but omitted from PRD scope bullets
- Location: `docs/DEV-66/prd.md:14` vs `docs/DEV-66/tech-plan.md:30`, `docs/DEV-66/ui-design.md:33`
- Description: PRD in-scope messages list only `messages.copyOrderLink`, while Tech Plan and UI Design also document `messages.copyOrderLinkFailed` for the Error story. PRD AC does require an Error story.
- Evidence: `src/orders/components/OrderCopyLinkButton/messages.ts:9-13`; Error story uses failed message at `OrderCopyLinkButton.stories.tsx:88`.
- Suggested fix: Add `messages.copyOrderLinkFailed` to PRD § Scope (story-only / future production affordance).

### F-003 [WARNING] Draft-order exclusion not stated in UI Design entry points
- Location: `docs/DEV-66/ui-design.md:12` vs `docs/DEV-66/prd.md:17,29`
- Description: PRD explicitly excludes draft order TopNav; UI Design entry point reads generically as order details without noting draft pages are out of scope.
- Evidence: Button wired only in `OrderDetailsPage.tsx:211`; absent from `OrderDraftPage` TopNav.
- Suggested fix: Add “non-draft `OrderDetailsPage` only” to UI Design § Screens entry points.

### F-004 [WARNING] Tech Plan story-CSS description omits Loading/Error selectors
- Location: `docs/DEV-66/tech-plan.md:32` vs `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css:16-31`
- Description: Tech Plan lists `.storyHover`, `.storyFocus`, `.storyActive` pseudo-state classes but the story module also defines `.storyLoading` and `.storyError` used by Loading and Error stories.
- Evidence: `OrderCopyLinkButton.stories.tsx:74,85` import those classes; CSS lines 16-31.
- Suggested fix: Extend Tech Plan affected-components bullet to mention all five story-only class prefixes.

### F-005 [WARNING] i18n messages not extracted to locale catalogs
- Location: `src/orders/components/OrderCopyLinkButton/messages.ts:4-13`, `locale/defaultMessages.json`
- Description: New `messages.copyOrderLink` and `messages.copyOrderLinkFailed` are defined via `defineMessages` but absent from locale catalogs; non-English locales will fall back to English until `pnpm run extract-messages` runs.
- Evidence: Grep of `locale/` for `"Copy order link"`, `BLmn1V`, `Hztpse` returns no matches.
- Suggested fix: Run `pnpm run extract-messages` before merge; note in tasks.md.

### F-006 [WARNING] Tech Plan unit-test mitigation not yet implemented
- Location: `docs/DEV-66/tech-plan.md:41`, `src/orders/utils/getOrderAbsoluteUrl.ts`
- Description: Tech Plan risk mitigation calls for unit-testing URL builder with mocked mount config; no test file exists for `getOrderAbsoluteUrl` or `OrderCopyLinkButton`.
- Evidence: Grep for `getOrderAbsoluteUrl|OrderCopyLinkButton|copy-order-link` in `**/*.{test,spec}.{ts,tsx}` returns zero matches.
- Suggested fix: Add `getOrderAbsoluteUrl.test.ts` covering subpath mount cases; optional component test for `data-test-id`.

### F-007 [WARNING] `handleCopy` defined before `orderId` guard breaks strict-ready intent
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:22-28`
- Description: Tech Plan and project-context expect the new module to be strict-ready, but `handleCopy` passes optional `orderId` to `getOrderAbsoluteUrl(orderId: string)` before the falsy guard. Runtime-safe (button not rendered when empty), but fails strict typing.
- Evidence: Props `orderId?: string` at line 11; callback at lines 22-24 precedes guard at lines 26-28.
- Suggested fix: Move guard above callback, narrow type with early return, or use non-null assertion only after guard.

### F-008 [WARNING] Subpath URL correctness relies on established pattern without automated proof
- Location: `docs/DEV-66/tech-plan.md:41`, `src/orders/utils/getOrderAbsoluteUrl.ts:5-10`
- Description: Subpath deployments depend on `getAppMountUriForRedirect()` matching serve config. Pattern matches `StaffList` redirects, but no unit test yet validates edge cases.
- Evidence: Same as F-006; sibling tests exist at `src/orders/utils/data.test.ts`.
- Suggested fix: Cover in F-006 test task; QA subpath install before release.
