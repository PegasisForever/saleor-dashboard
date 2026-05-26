---
agent: step-1-planning
sequence: 9
input_branch: 4b2484377730ee0b9cd5cf449e5e88818e326a31
status: DONE
---

## Summary

Addressed prototype iteration 2 loop-back (UI F-001 Focus + F-002 Copied stories settling identically to Default). Added `createStateDecorator("focus")` with macaw `buttonDefaultSecondaryFocused` + 2px outline; replaced Copied `play` click with `showCopiedState` arg; re-published Storybook at `http://localhost:11000/46f89b12-5406-409a-82aa-e290df36a193` and verified Focus/Copied/Default/Hover via chrome-devtools.

## Decisions made independently

- **Focus decorator uses outline + focused background token:** Router suggested parallel to Hover/Active; applied `vars.colors.background.buttonDefaultSecondaryFocused` plus 2px `vars.colors.text.default1` outline (dashboard `focus-visible` pattern from `RuleActions.module.css`) so settled Focus is distinct and outline contrast exceeds 3:1 (measured 13.87:1).
- **`showCopiedState` on component (not story-only wrapper):** Minimal prop keeps `ClipboardCopyIcon` + i18n path identical to production; avoids duplicating button markup in stories.
- **Skipped Consistency WARNING cleanups:** Wireframe icon, PRD placement wording, locale extraction deferred — not loop-back blockers; iteration 3 scope is state-coverage only.

## Files / sections inspected

- `docs/DEV-68/findings/prototype/iteration-002/router.md`: loop-back blockers F-001/F-002 and guidance
- `docs/DEV-68/findings/prototype/iteration-002/ui-review.md`: evidence and suggested fixes for Focus/Copied
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: prior Hover/Active decorator pattern; Focus play + Copied play root cause
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: `useClipboard` 2s reset behavior
- `src/hooks/useClipboard.ts`: timeout mechanics confirming Copied story regression
- `node_modules/@saleor/macaw-ui-next/dist/theme/contract.css.d.ts`: `buttonDefaultSecondaryFocused` token for Focus decorator
- `src/discounts/.../RuleActions.module.css:17-21`: `focus-visible` outline pattern reference

## Considered then dropped

- **Story-only Copied wrapper component:** Considered duplicating Button + ClipboardCopyIcon in stories file; rejected — `showCopiedState` prop is smaller and keeps single component source.
- **NO_OP:** Rejected — iteration-002 router filed two UI BLOCKERs requiring story fixes.
- **Fix macaw production focus contrast (F-004):** UI review WARNING only; inherited macaw secondary border 1.35:1 — documented in ui-design; not changed in prototype pass.

## Dead ends and retries

- **`pnpm install` default store:** Failed `EACCES` on `/home/kasm-user/.pnpm-store/v10`; fixed with `pnpm install --store-dir <workspace>/.pnpm-store`.

## Ambiguities encountered

- None requiring human escalation; loop-back guidance was explicit.

## Concerns / warnings

- Production keyboard focus on macaw `Button variant="secondary"` may still show low-contrast border (iter-2 UI F-004 WARNING); Focus story decorator demonstrates intended high-contrast ring, not guaranteed production `:focus-visible` without macaw change.

## Did not do (out of scope or deferred)

- Consistency WARNING alignments (wireframe metadata icon, PRD "adjacent" wording, `extract-messages`, `getAbsoluteOrderUrl` unit test): deferred per non-blocker classification.
- `OrderDetailsPage` integration: remains tech-plan integration task.
