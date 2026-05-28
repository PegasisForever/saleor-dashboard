---
agent: step-1-planning
sequence: 5
input_branch: c4ce04b57afd728d39b05d3ac3d58a50c48ae25a
status: DONE
---

## Summary

Re-entered Planning after prototype iter-001 loop-back (UI F-001 active-state icon contrast 2.89:1). Fixed production CSS (`:active svg` / `.buttonForceActive svg` → `--mu-colors-text-default1`), added TopNav composition stories, corrected touch-target and contrast docs, published Storybook iter-2 at `http://localhost:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d`, and verified active contrast 10.51:1 on deployed bundle.

## Decisions made independently

- **Active icon darken in production module, not ClipboardCopyIcon:** Keeps `ClipboardCopyIcon` shared; state-specific pairing lives with button background in `OrderCopyLinkButton.module.css` (per ui-review suggested fix).
- **32×32 touch target documented, not enlarged:** Matches same-family TopNav secondary controls; aligns with UI F-002 WARNING resolution without scope creep.
- **Composition stories in same stories file:** Reuses `TopNav.stories.tsx` mock user pattern; desktop + narrow viewport variants for layout check (UI F-003).

## Files / sections inspected

- `docs/DEV-90/findings/prototype/iteration-001/ui-review.md` F-001/F-002/F-003: loop-back drivers
- `docs/DEV-90/findings/prototype/iteration-001/router.md`: mechanical loop-back rule
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`: active/hover/focus rules before fix
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: icon uses `default2` sprinkles globally
- `src/components/AppLayout/TopNav/TopNav.stories.tsx`: composition story pattern with `UserContext`
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-233`: production TopNav sibling order

## Considered then dropped

- **Move `getShareableOrderUrl` to `urls.ts`:** Consistency F-003 WARNING only; colocated helper already composes `orderUrl` + `getAppMountUriForRedirect` correctly — deferred to integration tasks.
- **Extract `force*` props to story-only wrapper:** Would shrink public API but adds refactor beyond loop-back scope; documented as Storybook-only in existing artifacts.

## Dead ends and retries

- **`pnpm install` default store:** EACCES on `/home/kasm-user/.pnpm-store/v10` — fixed with `--store-dir ./.pnpm-store`.
- **Prettier via `pnpm run lint`:** Reformatted iteration-001 findings files unintentionally — `git restore` on those paths before commit.

## Ambiguities encountered

- None above decision threshold; loop-back reason was explicit in iteration-001 UI review.

## Concerns / warnings

- `InOrderDetailsTopNav` story: `dataTestId="menu"` on `TopNav.Menu` may not surface on outer button in a11y snapshot (menu control still renders as expandable button).
- i18n IDs still not in `locale/*.json` (iter-001 Consistency F-004) — unchanged; task agent should run `extract-messages`.

## Did not do (out of scope or deferred)

- **Run `pnpm run extract-messages`:** Not required for prototype loop-back fix; noted in concerns.
- **Enlarge button to 44×44:** Explicitly out of scope per touch-target decision.
