---
agent: step-2-consistency-reviewer
input_branch: 00686866416238ef05ea2effd21b052a518ea24f
verdict: pass
---

## Summary

Prototype iteration 2 artifacts (PRD, UI design, tech plan, project context) and the branch diff describe the same feature: a secondary `OrderCopyLinkButton` in order-details `TopNav`, placed before metadata, copying an absolute shareable URL via `useClipboard` + `getShareableOrderUrl`, with icon/label feedback and six distinct Storybook state stories plus TopNav composition stories. Affected-components list matches the six changed `src/` files exactly; no security, migration, API-breaking, or hot-path defects were confirmed. Storybook verification at `local-deploy:11000` shows distinct Default vs Copied labels and copy-before-metadata TopNav layout. Remaining issues are documentation/convention drift (WARNING tier only).

## Findings

### F-001 [WARNING] i18n message IDs not extracted to locale catalogs
- Location: `src/orders/components/OrderCopyLinkButton/messages.ts` L3–14; `locale/` (no entries)
- Description: `orderCopyLinkButtonMessages` defines react-intl IDs via `defineMessages`, but `pnpm run extract-messages` has not been run — IDs are absent from `locale/*.json`.
- Trigger: Staff user switches dashboard UI language to any non-English locale that relies on catalog strings (not `defaultMessage` fallback). Page loads order details with `OrderCopyLinkButton` visible.
- Impact: Button may show English fallback labels ("Copy order link" / "Order link copied") instead of translated text; copy behavior still works.
- Evidence: Grep of `locale/` returns zero matches for message keys. Storybook Default story a11y snapshot: button `"Copy order link"`; Copied story: `"Order link copied"` (English `defaultMessage` path).
- Suggested fix: Run `pnpm run extract-messages` after implementation freeze and commit updated `locale/*.json` entries keyed by `orderCopyLinkButtonMessages.copyOrderLink` / `orderLinkCopied`.

### F-002 [WARNING] UI design calls control "primary" while PRD specifies secondary variant
- Location: `docs/DEV-90/ui-design.md` L23; `docs/DEV-90/prd.md` L34; `OrderCopyLinkButton.tsx` L44
- Description: UI design labels `OrderCopyLinkButton` the "primary interactive control" while PRD acceptance criteria and implementation use `variant="secondary"` to match the metadata button.
- Trigger: Task author reads ui-design § Components used before PRD § Acceptance criteria.
- Impact: Risk of implementing `variant="primary"` and visual mismatch with adjacent TopNav secondary actions; current code is correct.
- Evidence: `ui-design.md` L23: "primary interactive control"; `prd.md` L34: `variant="secondary"`; `OrderCopyLinkButton.tsx` L44: `variant="secondary"`.
- Suggested fix: In `ui-design.md` L23, replace "primary interactive control" with "main copy-link control (secondary variant)" or similar wording that does not collide with Macaw `primary` variant naming.

### F-003 [WARNING] Storybook-only force* props exposed on production component type
- Location: `OrderCopyLinkButton.tsx` L15–18, L36, L48–50; `docs/DEV-90/tech-plan.md` L35; `OrderDetailsPage.tsx` L211
- Description: `forceCopied`, `forceHovered`, `forceFocused`, and `forceActive` are public optional props that pin visual state without a clipboard write (`isCopied = forceCopied || copied`). Tech plan documents them as Storybook-only; production integration omits them.
- Trigger: Future integrator passes `forceCopied={true}` on `OrderCopyLinkButton` in app code outside Storybook.
- Impact: Button shows permanent "Order link copied" check icon and label while clipboard was never updated; misleading feedback for staff users.
- Evidence: `OrderCopyLinkButton.tsx` L36: `const isCopied = forceCopied || copied`; `OrderDetailsPage.tsx` L211 passes only `orderId`.
- Suggested fix: Either document the misuse hazard in tech-plan § Risks, or narrow props via a Storybook wrapper so production export omits `force*` (optional refactor — not required for prototype pass).

### F-004 [WARNING] Shareable URL helper colocated outside feature urls.ts
- Location: `getShareableOrderUrl.ts` L1–8; `docs/DEV-90/project-context.md` L41; `docs/DEV-90/tech-plan.md` L38
- Description: `getShareableOrderUrl` lives beside the button component rather than in `src/orders/urls.ts` as project-context recommends for URL helpers.
- Trigger: Engineer searches `urls.ts` for shareable-order URL builder when adding copy-link to another surface.
- Impact: Helper may be missed or duplicated; no runtime bug — implementation correctly composes `orderUrl` and `getAppMountUriForRedirect`.
- Evidence: `getShareableOrderUrl.ts` L1–8 imports `orderUrl` from `@dashboard/orders/urls`; tech-plan L38 lists file under component folder.
- Suggested fix: Note in tech-plan that colocation is intentional for v1, or move to `urls.ts` if a second consumer appears.

### F-005 [WARNING] tech-plan Affected components omits disabled prop present in implementation
- Location: `docs/DEV-90/tech-plan.md` L35; `OrderCopyLinkButton.tsx` L14, L23, L45; `OrderCopyLinkButton.stories.tsx` L73–76
- Description: Tech plan lists optional `force*` props only; implementation and `Disabled` story also expose `disabled?: boolean`, which PRD documents as Storybook-only.
- Trigger: Task author reads tech-plan § Affected components without reading PRD L39 or component source.
- Impact: tasks.md may omit disabled-story verification; no wrong production behavior (TopNav never passes `disabled`).
- Evidence: `OrderCopyLinkButton.tsx` L14 `disabled?: boolean`; `Disabled` story args `disabled: true`; tech-plan L35 silent on `disabled`.
- Suggested fix: Add `disabled?` to tech-plan L35 parenthetical alongside `force*` props.

### F-006 [WARNING] PRD URL prose vs tech-plan template notation
- Location: `docs/DEV-90/prd.md` L11/L30; `docs/DEV-90/tech-plan.md` L27–31; `getShareableOrderUrl.ts` L5–8
- Description: PRD describes URL as "origin + mount URI + `orderUrl(orderId)`" while tech plan shows a literal template with trailing `?`. Both match runtime via `orderUrl` + `urlJoin`, but wording differs.
- Trigger: Task author writes an acceptance test comparing against a hand-built string without trailing `?`.
- Impact: False test failure; implementation and `orderUrl` helper are aligned.
- Evidence: `orderUrl` in `src/orders/urls.ts` appends `"?" + stringifyQs(params)`; `getShareableOrderUrl` delegates to `orderUrl(orderId)`.
- Suggested fix: In PRD L11, add "(includes trailing `?` from `orderUrl`)" or cite `getShareableOrderUrl` symbol as single source of truth.
