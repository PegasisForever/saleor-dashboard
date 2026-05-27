---
agent: step-7-deep-correctness-order-copy-link-button-pass-3
sequence: 47
input_branch: 7a4e0a69c93b1092d88419dfd90b9dd892bbc0d8
status: DONE
---

## Summary

Pass-3 correctness deep review for DEV-85 `order-copy-link-button`: read cumulative diff since `45b5cef8`, expanded to all call sites/parents/hook consumers/tests, spawned six parallel sub-agents for adversarial prompts, ran 14/14 scoped unit tests (after `pnpm install --store-dir` workaround), statically verified iter-6 E2E additions. Verdict `pass` with two WARNINGs on pre-existing shared-hook async edges; no BLOCKER/SHOULD-FIX.

## Decisions made independently

- **Verdict pass despite WARNINGs**: Both findings are shared-hook edge cases predating this feature; production always copies identical `window.location.href`; iter-6 fixes address the load-bearing pass-2 SHOULD-FIX items (timer orphan, E2E clipboard/revert, SR remount).
- **No SHOULD-FIX for `url=""`**: `??` empty-string footgun only affects explicit `url=""` callers; production TopNav never passes `url`.
- **No BLOCKER on `orderUrl` vs `href`**: PRD and ui-design explicitly require `window.location.href`, not canonical `orderUrl(id)`.
- **E2E mechanical check `skip`**: Sandbox lacks `API_URL`; static review of `TC: SALEOR_218` instead of claiming execution pass.

## Files / sections inspected

- `git diff 45b5cef8..HEAD` — 18 source/locale/playwright files per coordinator.
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts` — iter-6 timer/generation fix.
- `src/orders/components/OrderCopyLinkButton/*` — full feature module.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` + `.test.tsx:91-108`.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` + `TrackingNumberDisplay.tsx:56`.
- `src/orders/views/OrderDetails/OrderDetails.tsx:62-67` — loading/null order behavior.
- `src/components/CopyableText/CopyableText.tsx` — sibling clipboard pattern.
- `src/orders/urls.ts:192,234-235` — encodeURIComponent convention (intentionally not used).
- `playwright/tests/orders.spec.ts:155-190`, `playwright/pages/ordersPage.ts:62`.
- `locale/defaultMessages.json` — `bqtu1/`, `FzcMi0`.
- `docs/DEV-85/prd.md`, `tech-plan.md`, `ui-design.md`, `project-context.md`.
- `docs/DEV-85/logs/042-step-7-coordinator-pass-3.md` — touchedFiles scope only (not prior angle findings).

## Considered then dropped

- **SHOULD-FIX re-file for missing E2E clipboard/revert**: Re-read `orders.spec.ts:183-189`; iter-6 added `grantPermissions`, `readText()` vs `page.url()`, and 2100ms revert wait — dropped as stale.
- **SHOULD-FIX for timer orphan / premature revert**: `useClipboard.ts:17` `clear()` before reschedule + `useClipboard.test.ts:160-200` — dropped as fixed.
- **SHOULD-FIX for SR re-announce on rapid re-copy**: `copyGeneration` key on live region + `OrderCopyLinkButton.test.tsx:101-126` — dropped as fixed.
- **SHOULD-FIX for TopNav placement test gap**: `OrderDetailsPage.test.tsx` exists — dropped.
- **BLOCKER on optional `order?.id` in parent**: `OrderCopyLinkButton` does not read `order`; no deref — dropped (SLRD-001 pattern does not apply).
- **SHOULD-FIX for missing `encodeURIComponent`**: PRD mandates full browser URL — dropped after grep of `urls.ts` siblings and ui-design decision.
- **SHOULD-FIX for `type="button"` inside Form**: Adjacent metadata button shares pattern; not introduced by this diff — dropped.

## Dead ends and retries

- **`pnpm install` EACCES on default store**: Fixed with `pnpm install --store-dir /home/kasm-user/2f63325a-b872-59fc-a46c-f597a84f0311/.pnpm-store`.
- **Playwright E2E**: Failed at auth setup (`Invalid URL` — `API_URL` unset); reported as `e2e-tests: skip` with static spec review.

## Ambiguities encountered

- **Sub-agents cited pass-001/002 findings**: Ignored those references per pure-reviewer rule; re-derived observations from source only.
- **Whether out-of-order `writeText` warrants SHOULD-FIX**: Classified WARNING — production copies same string; hook tests cover ordered resolution only.

## Concerns / warnings

- Duplicate Playwright ticket label `TC: SALEOR_218` in `permissionGroup.spec.ts:119` (unrelated feature) may confuse grep-based test selection.
- Sub-agent spawn returned rich payloads; consolidated into F-001/F-002 after independent verification of cited lines.

## Did not do (out of scope or deferred)

- Read `docs/DEV-85/findings/deep-review/pass-001|pass-002/*` (pure-reviewer constraint).
- Chrome MCP walkthrough (no running dashboard + E2E backend).
- Full `pnpm run e2e` suite (environment blocked).
- api-contract HTTP tests (tech plan N/A for browser Clipboard API).
