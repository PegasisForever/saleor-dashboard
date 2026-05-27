---
agent: step-2-consistency-reviewer
input_branch: 486d1e54570aedf381bb3ffb55827343e1d074c6
verdict: pass
---

## Summary

PRD, UI design, tech plan, and the seven-file source diff describe the same feature: a secondary icon-only copy-link button in order details TopNav (before the metadata button), copying a clean absolute order URL with ~2s icon feedback via `useClipboard`. Affected-components list matches the diff exactly; no security, migration, or performance blockers. Residual issues are terminology drift, deferred locale extraction, Storybook/CSS spec gaps, and URL-encoding parity — all WARNING severity.

## Findings

### F-001 [WARNING] Metadata neighbor button label drift across artifacts
- Location: `docs/DEV-78/prd.md` L30; `docs/DEV-78/ui-design.md` L21, L59; `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` L217
- Description: Planning docs call the adjacent control the "metadata (`Code`) button" while production uses `title="Edit order metadata"` and `data-test-id="show-order-metadata"`.
- Evidence: PRD acceptance criterion: "immediately before the metadata (`Code`) button"; `OrderDetailsPage.tsx` L217 `title="Edit order metadata"`.
- Suggested fix: Pick one canonical label in planning docs (e.g. "metadata / Code button") so Step 5 tasks reference the right neighbor without ambiguity.

### F-002 [WARNING] `ClipboardCopyIcon` reuse vs extension mismatch between UI design and tech plan
- Location: `docs/DEV-78/ui-design.md` L28; `docs/DEV-78/tech-plan.md` L44; `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` L4–13
- Description: UI design lists `ClipboardCopyIcon` under "Reused" with no qualification; tech plan and diff add optional `size` / `strokeWidth` props.
- Evidence: `ClipboardCopyIcon.tsx` adds `size?: number` and `strokeWidth?: number` with defaults preserving existing call sites.
- Suggested fix: Update UI design to note "Reused (extended with optional sizing props)" or consolidate the note in tech plan only.

### F-003 [WARNING] i18n messages defined but not extracted to locale catalog
- Location: `src/orders/components/OrderCopyLinkButton/messages.ts` L3–14; `locale/defaultMessages.json`
- Description: Component correctly uses `orderCopyLinkButtonMessages` via `intl.formatMessage`, but strings are absent from the locale catalog.
- Evidence: Grep for `"Copy order link"` and `"Order link copied"` in `locale/` returns no matches; component uses `defineMessages` at `messages.ts` L3–14.
- Suggested fix: Run `pnpm run extract-messages` during implementation and commit updated `locale/defaultMessages.json`.

### F-004 [WARNING] `disabled` prop exists in component but is undocumented in tech plan
- Location: `docs/DEV-78/tech-plan.md` § Affected components; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` L14, L19, L36; `OrderCopyLinkButton.stories.tsx` L70–73
- Description: UI design declares a `disabled` state and PRD requires a `Disabled` story; tech plan does not mention the prop; production wiring never passes `disabled`.
- Evidence: `OrderCopyLinkButtonProps` includes `disabled?: boolean`; `OrderDetailsPage.tsx` passes only `orderId`.
- Suggested fix: Document `disabled?: boolean` in tech plan as Storybook-only / future-proof API, or remove if not intended.

### F-005 [WARNING] Hover settled-state preview omits elevated shadow from UI design
- Location: `docs/DEV-78/ui-design.md` L38; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` L18–20
- Description: UI design hover row specifies "elevated shadow"; Storybook `[data-state="hover"]` rule sets background only.
- Evidence: CSS L18–20 sets `background-color` only; no `box-shadow`. Storybook Default story verified at `local-deploy:11000/.../orders-ordercopylinkbutton--default`.
- Suggested fix: Add shadow token to hover preview CSS or revise UI design if macaw native hover shadow is sufficient at runtime only.

### F-006 [WARNING] Focus settled-state preview adds background not documented in UI design
- Location: `docs/DEV-78/ui-design.md` L39; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` L1–4 vs L22–26
- Description: UI design focus row documents outline only; `[data-state="focus"]` also sets `background-color: var(--mu-colors-background-default1)` while production `:focus-visible` (L1–4) is outline-only.
- Evidence: CSS L22–26 includes background tint; L1–4 does not.
- Suggested fix: Align focus preview CSS with UI design (outline-only) or update UI design table to include background.

### F-007 [WARNING] `getOrderShareableUrl` omits `encodeURIComponent` used by `orderUrl`
- Location: `src/orders/urls.ts` L194–195 vs L237–238
- Description: New helper passes raw `orderId` to `orderPath`; `orderUrl` encodes the ID. Most other path helpers use raw IDs like the new helper.
- Evidence:
  ```typescript
  export const getOrderShareableUrl = (orderId: string): string =>
    urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId));
  export const orderUrl = (id: string, params?: OrderUrlQueryParams) =>
    orderPath(encodeURIComponent(id)) + "?" + stringifyQs(params);
  ```
- Suggested fix: Align encoding with `orderUrl`, or document why raw GraphQL global IDs are URL-safe for share links.

### F-008 [WARNING] Copied story duplicates production markup instead of rendering `OrderCopyLinkButton`
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` L77–98
- Description: `OrderCopyLinkButtonCopiedPreview` reimplements `Button` + `ClipboardCopyIcon` + labels because `useClipboard` resets after ~2s. Drift risk if production component changes.
- Evidence: Copied story `render: () => <OrderCopyLinkButtonCopiedPreview />` at L101–102; preview at L77–98 mirrors production JSX from `OrderCopyLinkButton.tsx` L33–49. Storybook a11y snapshot confirms label "Order link copied" (distinct from Default "Copy order link").
- Suggested fix: Accept static preview trade-off, or add an internal/test-only `copied` prop for Storybook.

### F-009 [WARNING] Storybook `[data-state]` selectors live in production CSS module
- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` L17–32; imported by `OrderCopyLinkButton.tsx` L10
- Description: Settled-state preview rules exist solely for Storybook wrappers; no production element sets `data-state`. Matches tech-plan note but couples story previews to production bundle.
- Evidence: Comment at L17; rules target `[data-state="hover"|"focus"|"active"]`; production component does not set these attributes.
- Suggested fix: Accept as intentional mirror of pseudo-states (precedent: `OrderTransaction.module.css`), or isolate behind a story-only wrapper if bundle purity is a concern.

### F-010 [WARNING] Unit/component tests deferred for new public API
- Location: `docs/DEV-78/tech-plan.md` L59–63; `src/orders/urls.ts` L194–195; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
- Description: Tech plan defers tests; no test files reference `getOrderShareableUrl` or `OrderCopyLinkButton`.
- Evidence: Tech plan "Testing notes (deferred to task agent)" section; grep finds no matching test files.
- Suggested fix: Add tests in Step 5 — prioritize `getOrderShareableUrl` mount-URI/subpath cases and click→clipboard behavior.
