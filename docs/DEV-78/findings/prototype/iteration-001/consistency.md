---
agent: step-2-consistency-reviewer
input_branch: 39bcb876e2596c04f815d420781de977f9e5b243
verdict: pass
---

## Summary

PRD, UI design, and tech plan describe the same feature shape — a secondary icon-only copy-link button in order details TopNav, placed before the metadata button, copying a clean absolute order URL with ~2s icon feedback via existing clipboard primitives. The commit diff matches tech-plan § Affected components exactly (seven source files, no scope creep, no new dependencies). Security, API surface, migration, and performance checks found no blockers. Residual warnings cover terminology drift, Storybook interaction-driven state coverage, deferred i18n extraction, and pre-existing URL-encoding consistency debt.

## Findings

### F-001 [WARNING] Metadata button naming drift across artifacts
- Location: `docs/DEV-78/prd.md` L30; `docs/DEV-78/ui-design.md` L21, L59; `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` L217
- Description: The adjacent control is labeled inconsistently as "metadata (`Code`) button", "metadata (existing)", and inline `title="Edit order metadata"` in production code.
- Evidence: PRD AC references `Code`; UI design ASCII uses `[</>]`; live button uses `data-test-id="show-order-metadata"` with title "Edit order metadata".
- Suggested fix: Pick one canonical label in planning docs (e.g., "metadata / Code button") for downstream task clarity.

### F-002 [WARNING] ClipboardCopyIcon listed as pure reuse in UI design but extended in tech plan
- Location: `docs/DEV-78/ui-design.md` L28; `docs/DEV-78/tech-plan.md` L44; `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` L4–13
- Description: UI design lists `ClipboardCopyIcon` under "Reused" without noting optional `size` / `strokeWidth` props added for TopNav icon sizing.
- Evidence: Tech plan documents optional props; implementation adds `size?: number; strokeWidth?: number` with defaults preserving backward compatibility.
- Suggested fix: Update UI design "Components used" to "Reused (extended with optional sizing props)" or mark props optional in tech plan if not required.

### F-003 [WARNING] Five Storybook stories share identical initial rendering args
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` L19–21, L37–76
- Description: `Default`, `Hover`, `Focus`, `Active`, and `Copied` all inherit meta args `{ orderId: ORDER_ID }` with no story-level overrides; only `Disabled` adds `disabled: true`. State differences rely entirely on `play` interactions.
- Evidence: Meta args at L19–21; `Default: Story = {}` at L37; `Copied` uses click play at L69–75 but same initial args. Storybook snapshot confirms `Copied` renders "Order link copied" only after play executes (evaluate_script returned `ariaLabel: "Order link copied"` post-play).
- Suggested fix: Accept as interaction-driven pattern or add state-specific decorators/args (e.g., wrapper that pre-sets copied state for `Copied`) so initial mount differs from `Default`.

### F-004 [WARNING] i18n messages defined but not extracted to locale catalog
- Location: `src/orders/components/OrderCopyLinkButton/messages.ts` L3–14; `locale/defaultMessages.json`
- Description: Messages use `defineMessages` with symbol keys (correct pattern), but `pnpm run extract-messages` has not been run — strings absent from `locale/defaultMessages.json`.
- Evidence: Grep for "Copy order link", "Order link copied", `l+hZ1x`, `GyfpSu` in `locale/` returns no matches. Component correctly uses `intl.formatMessage(orderCopyLinkButtonMessages.*)` at `OrderCopyLinkButton.tsx` L28–30.
- Suggested fix: Run `pnpm run extract-messages` during implementation phase and commit updated `locale/defaultMessages.json`.

### F-005 [WARNING] getOrderShareableUrl omits encodeURIComponent used by orderUrl
- Location: `src/orders/urls.ts` L194–195 vs L237–238
- Description: Shareable URL builder passes raw `orderId` to `orderPath`, while `orderUrl` wraps `encodeURIComponent(id)`. For order IDs containing URL-significant characters, copied links may not match navigation URLs.
- Evidence:
  ```typescript
  export const getOrderShareableUrl = (orderId: string): string =>
    urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId));
  export const orderUrl = (id: string, params?: OrderUrlQueryParams) =>
    orderPath(encodeURIComponent(id)) + "?" + stringifyQs(params);
  ```
- Suggested fix: Align `getOrderShareableUrl` with `orderUrl` encoding or document why raw IDs are safe for GraphQL global IDs.

### F-006 [WARNING] Storybook meta default export vs named-export convention
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` L34; `docs/DEV-78/project-context.md` L17
- Description: New stories file uses `export default meta` (CSF requirement), which conflicts with project-context "named exports only" rule.
- Evidence: `export default meta;` at L34; convention documented at project-context L17.
- Suggested fix: Document Storybook CSF exception in project-context or accept as established repo pattern (other stories use same shape).

### F-007 [WARNING] CSS !important overrides on macaw Button focus/active
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` L1–8
- Description: Focus-visible and active states use `!important` to override macaw `Button` specificity rather than design-system props alone.
- Evidence: `.button:focus-visible { outline: ... !important; }` and `.button:active:not(:disabled) { background-color: ... !important; }`.
- Suggested fix: Try macaw `Button` variants/props first; retain overrides only if macaw styling cannot achieve documented focus/active tokens.

### F-008 [WARNING] Public API tests deferred per tech plan
- Location: `docs/DEV-78/tech-plan.md` L59–63; `src/orders/urls.ts` L194–195
- Description: `getOrderShareableUrl` and `OrderCopyLinkButton` have no unit/component tests yet; tech plan explicitly defers testing to task agent.
- Evidence: Tech plan Testing notes list unit test for URL builder and component test for click→clipboard; grep shows no test files referencing either symbol.
- Suggested fix: Include test tasks in Step 5 decomposition; prioritize `getOrderShareableUrl` mount-URI/subpath cases.
