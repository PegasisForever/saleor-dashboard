---
agent: step-2-consistency-reviewer
input_branch: af00bf8edbef825943d3ec391e5eab04b79b8c49
verdict: pass
---

## Summary

DEV-66 prototype artifacts are internally coherent: PRD, UI design, tech plan, and implementation all describe the same client-only TopNav copy-link feature wired through `OrderDetailsPage` → `OrderCopyLinkButton` with eight distinct Storybook states and a published Storybook URL verified in-browser. The commit diff matches the tech-plan affected-components list exactly; no security, migration, API-breaking, or performance blockers were found. Remaining issues are terminology precision and deferred integration work (tests, locale extract, story-only i18n).

## Findings

### F-001 [WARNING] PRD "confirmed order details" wording is ambiguous vs shared `OrderDetailsPage`
- Location: `docs/DEV-66/prd.md:29`, `docs/DEV-66/project-context.md:42`
- Description: PRD acceptance criterion says "On the **confirmed** order details page…" while tech plan, UI design, and implementation target the shared `OrderDetailsPage` component used by both `OrderNormalDetails` and `OrderUnconfirmedDetails` (draft excluded via separate `OrderDraftPage`). A reader could misread "confirmed" as status-specific rather than "non-draft."
- Evidence: PRD AC line 29 uses "confirmed order details page." Integration is in `OrderDetailsPage.tsx:211`. Both `OrderNormalDetails/index.tsx:201` and `OrderUnconfirmedDetails/index.tsx:201` render `OrderDetailsPage`.
- Suggested fix: Replace "confirmed order details page" with "non-draft order details page (`OrderDetailsPage`)" in PRD AC and align `project-context.md` out-of-scope note.

### F-002 [WARNING] Empty story documents null-render via placeholder text, not component mount
- Location: `docs/DEV-66/ui-design.md:34`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:102-107`
- Description: UI design states the Empty story covers "explanatory text when no `orderId` (component returns `null`)" but the story renders a static `<p>` and never mounts `<OrderCopyLinkButton orderId="" />`. Production null-guard exists (`OrderCopyLinkButton.tsx:26-28`) but is not exercised in Storybook.
- Evidence: Empty story JSX at `stories.tsx:105`; Storybook snapshot shows text "No order selected — copy button is not rendered." with `hasButton: false` and no component mount.
- Suggested fix: Clarify in ui-design that Empty is a documentation placeholder, or add a story variant that mounts the component with falsy `orderId` to demonstrate `return null`.

### F-003 [WARNING] Empty story uses inline English outside i18n catalog
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:105`
- Description: Error story correctly uses `intl.formatMessage(messages.copyOrderLinkFailed)`; Empty story uses bare JSX text. Story-only, but inconsistent with project i18n convention.
- Evidence: `"No order selected — copy button is not rendered."` inline at line 105; no corresponding entry in `messages.ts`.
- Suggested fix: Add a story-only message key to `messages.ts` or document Empty caption as intentionally non-localized prototype text.

### F-004 [WARNING] No unit tests for `getOrderAbsoluteUrl` despite tech-plan risk mitigation
- Location: `docs/DEV-66/tech-plan.md:41`, `src/orders/utils/getOrderAbsoluteUrl.ts`
- Description: Tech plan identifies subpath deployments as primary risk and calls for unit tests with mocked mount URI. No test file exists in the diff.
- Evidence: `grep` for `getOrderAbsoluteUrl` across `**/*.{test,spec}.*` returns no matches. Helper is 10 lines, window-coupled.
- Suggested fix: Add `getOrderAbsoluteUrl.test.ts` with mocked `window.location.origin` and `getAppMountUriForRedirect` before merge.

### F-005 [WARNING] No component or integration tests for copy button despite PRD test hook
- Location: `docs/DEV-66/prd.md:15,34`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38`
- Description: PRD requires `data-test-id="copy-order-link"` explicitly "for tests," but no RTL or Playwright coverage exists yet for click behavior, icon swap, or TopNav wiring.
- Evidence: `grep` for `OrderCopyLinkButton`, `getOrderAbsoluteUrl`, and `copy-order-link` in test files returns no matches.
- Suggested fix: Add RTL test for `OrderCopyLinkButton` and/or Playwright coverage for TopNav copy action in integration tasks.

### F-006 [WARNING] Message IDs not yet extracted to `locale/`
- Location: `src/orders/components/OrderCopyLinkButton/messages.ts:4-13`
- Description: New `messages.copyOrderLink` and `messages.copyOrderLinkFailed` use hand-set IDs (`BLmn1V`, `Hztpse`) not present in locale catalogs. Expected prototype deferral but not merge-ready per project pre-merge workflow.
- Evidence: IDs absent from `locale/` grep; messages defined only in component `messages.ts`.
- Suggested fix: Run `pnpm run extract-messages` during integration and reconcile IDs.

### F-007 [WARNING] `orderId` prop type does not reflect optional call-site usage
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:10-12`, `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`
- Description: Component declares `orderId: string` but integration passes `order?.id` (`string | undefined`). Runtime guard handles falsy values; type contract is loose at the boundary (masked by `@ts-strict-ignore` on `OrderDetailsPage`).
- Evidence: Props interface requires `string`; call site `orderId={order?.id}`; null guard at `OrderCopyLinkButton.tsx:26-28`.
- Suggested fix: Widen prop to `orderId?: string` if absent IDs are an expected integration pattern.
