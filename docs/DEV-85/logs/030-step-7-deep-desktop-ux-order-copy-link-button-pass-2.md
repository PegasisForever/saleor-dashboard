---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-2
sequence: 30
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
status: DONE
---

## Summary

Ran pass-2 desktop-ux deep review on order-copy-link-button: expanded scope to parents/call sites/hook/tests, spawned six non-chrome adversarial sub-agents plus one batched chrome sub-agent, verified Storybook interactions directly when production dev server was unreachable. Loop-back fixes (timer, aria-live, placement test, E2E) verified in source; filed one SHOULD-FIX (SR re-announce on rapid re-copy) and two WARNINGs. Verdict `pass`.

## Decisions made independently

- **Stale Storybook ≠ code defect**: Published bundle at ui-design URL lacks aria-live DOM nodes, but HEAD source + unit tests include them; classified deploy staleness as WARNING (F-002), not BLOCKER on component code.
- **new-surface-checks pass**: Verified aria-live in source (`OrderCopyLinkButtonContent.tsx:45-49`) and passing unit test; did not fail mechanical check solely because Storybook deploy predates impl-loop addition.
- **Timer race fixed → not re-filed**: Pass-1 timer orphan bug confirmed fixed by `clear()` at `useClipboard.ts:16` and regression test at lines 133-173; rapid re-copy visual state now stable.
- **SHOULD-FIX for SR re-announce**: Cross-task WARNING from shallow iter-3 persists in code; localized `copyGeneration` key fix qualifies as SHOULD-FIX under desktop-ux SR contract from ui-design.md.

## Files / sections inspected

- `docs/DEV-85/logs/029-step-7-coordinator-pass-2.md` — pass-2 area scope
- `docs/DEV-85/prd.md`, `ui-design.md`, `tech-plan.md` — AC and interaction specs
- `git diff 45b5cef8..HEAD -- src/hooks/useClipboard.ts src/orders/components/OrderCopyLinkButton/ src/orders/components/OrderDetailsPage/ playwright/`
- `src/orders/components/OrderCopyLinkButton/*` — full component module
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts` — timer fix
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — TopNav integration
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — placement test
- `playwright/tests/orders.spec.ts:155-179` — E2E spec
- `src/components/CopyableText/CopyableText.tsx`, `TrackingNumberDisplay.tsx` — sibling patterns
- `src/components/AppLayout/TopNav/Root.tsx`, `Menu.tsx` — focus order context
- Storybook iframe stories Default/Copied/InOrderDetailsTopNav at `local-deploy:11000/348e26e0-...`
- `pnpm run test:quiet` on OrderCopyLinkButton + useClipboard tests (11/11 pass)

## Considered then dropped

- **BLOCKER on missing aria-live in Storybook DOM**: Retracted after reading current source and passing unit test asserting `[aria-live='polite']`; deployed Storybook is pre-impl-loop artifact.
- **BLOCKER on timer race**: Pass-1 issue; `useClipboard.test.ts` rapid re-copy test passes; Storybook double-click keeps "Order link copied" label stable.
- **SHOULD-FIX on E2E missing clipboard URL assertion**: Downgraded to WARNING — task acceptance allowed aria-label/check icon as sufficient E2E gate; PRD AC2 still untested in automation but not a desktop interaction regression in code.
- **WARNING on concurrent writeText race**: Considered from sub-agent prompt 6; dropped as pre-existing hook pattern shared by CopyableText/TrackingNumberDisplay and low likelihood on identical `window.location.href` payload.

## Dead ends and retries

- `pnpm run test:quiet` failed initially (`jest: not found`, missing node_modules); fixed with `pnpm install --store-dir /tmp/pnpm-store`.
- Production app `localhost:9000` unreachable; used Storybook fallback per skip protocol.
- Chrome sub-agent reported `new-surface-checks: fail` on stale Storybook; main session re-verified against source/tests and overrode to pass.

## Ambiguities encountered

- **Whether SR re-announce gap is pass-2 regress or carried WARNING**: Shallow review iter-3/4 explicitly deferred; pass-2 added aria-live for first copy only — filed as SHOULD-FIX F-001 because ui-design SR flow implies per-click feedback.

## Concerns / warnings

- Humans reviewing via ui-design Storybook URL will not see aria-live until redeploy.
- Full keyboard Tab chain through production TopNav (back → channel picker → copy → metadata → menu) not fully exercised without live app.

## Did not do (out of scope or deferred)

- Re-run Step 3 static mechanical checks (contrast, touch-target) on unchanged Storybook surfaces.
- Read pass-001 deep-review findings (pure-reviewer discipline).
- Execute Playwright E2E against live Saleor backend (unavailable in sandbox).
- Lighthouse audit on unchanged component visuals.
