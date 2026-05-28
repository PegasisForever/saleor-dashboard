---
agent: step-7-deep-correctness-order-copy-link-button-pass-1
sequence: 16
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
status: DONE
---

## Summary

Ran Step 7 correctness deep review for `order-copy-link-button`: expanded scope beyond six touched files to parents (`OrderDetailsPage`, `OrderNormalDetails`, `OrderUnconfirmedDetails`, `OrderDetails` router), integration hooks (`useClipboard`, `orderUrl`, `getAppMountUriForRedirect`), and sibling copy patterns. Spawned six non-chrome sub-agents for forced prompts; consolidated into three SHOULD-FIX and three WARNING findings. Verdict **pass** (no BLOCKER). Committed findings; `pnpm install` required local store dir due to EACCES on default `~/.pnpm-store`.

## Decisions made independently

- **No BLOCKER on `order.id` deref:** Parent uses `order?.id ? … order.id` — safe; retracted draft BLOCKER after reading `OrderDetailsPage.tsx:211` and `OrderDetails.tsx` null handling.
- **encodeURIComponent not filed:** `getShareableOrderUrl` delegates to `orderUrl`, which encodes id — sibling-helper prompt confirmed match with `orderFulfillUrl` pattern.
- **useClipboard timer overlap as SHOULD-FIX:** Affects PRD “~2 seconds” feedback on realistic double-click; fix is localized to `useClipboard.ts` clear-before-setTimeout.
- **api-contract pass via static trace:** Feature is client-only; verified code matches tech-plan URL composition (no HTTP contract test file in repo).
- **e2e-tests skip:** No Playwright spec references `copy-order-link`; full E2E requires Saleor backend not provisioned in sandbox.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/ src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — full product delta (~296 LOC).
- `src/orders/components/OrderCopyLinkButton/*` — all five new files read end-to-end.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:38,145,210-231` — TopNav wire-up and order optional usage.
- `src/orders/views/OrderDetails/OrderDetails.tsx:62-72,180-255` — draft/unconfirmed/normal routing.
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:141,201-222` — `order={data?.order}`.
- `src/orders/views/OrderDetails/OrderUnconfirmedDetails/index.tsx:137,201-222`.
- `src/hooks/useClipboard.ts` + `src/hooks/useClipboard.test.ts` — timer and rejection behavior.
- `src/orders/urls.ts:192,234-235` — `orderPath` / `orderUrl` encoding.
- `src/utils/urls.ts:27-28` — mount URI redirect helper.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`, `TrackingNumberDisplay.tsx` — sibling copy UX.
- `docs/DEV-90/prd.md`, `tech-plan.md`, `ui-design.md`, `project-context.md`.
- Grep call sites: `OrderCopyLinkButton`, `getShareableOrderUrl`, `copy-order-link` across `src/` and `playwright/`.
- Grep `rdiFOg` / `vcCUT0` in `locale/` — not extracted.

## Considered then dropped

- **BLOCKER missing null guard on `order.id`:** Sub-agent parent prompt flagged pattern; `order?.id` ternary prevents render when undefined — dropped.
- **SHOULD-FIX missing `encodeURIComponent`:** Grep of `urls.ts` showed `orderUrl` already wraps `encodeURIComponent(id)` — dropped (prior-run canonical miss).
- **BLOCKER clipboard failure with no UX:** PRD/tech-plan explicitly out-of-scope for v1; matches `TrackingNumberDisplay` and `OrderCustomer` — dropped.
- **SHOULD-FIX `navigator.clipboard` absent throws uncaught:** Theoretical non-HTTPS/legacy browser; no evidence in supported dashboard targets — dropped as WARNING-level only, not filed to limit noise.
- **SHOULD-FIX `orderId` change while `copied` true:** Rare navigation edge; host does not remount button on id change — considered WARNING, omitted to keep finding set focused on high-signal gaps.

## Dead ends and retries

- **`pnpm install` EACCES on `~/.pnpm-store`:** Retried with `--store-dir` under workspace; succeeded in 7.2s.
- **Initial `jest: not found`:** Resolved after install; `useClipboard.test.ts` PASS (6/6).
- **Node one-liner import of `urls.ts`:** Failed on TypeScript enum in strip-only mode — abandoned; used Jest + static read instead.

## Ambiguities encountered

- **No `docs/DEV-90/findings/deep-review/pass-001/` coordinator artifact on disk:** Used `docs/DEV-90/logs/011-step-7-coordinator-pass-1.md` touched-file list instead (six `src/` paths).
- **api-contract mechanical check:** No dedicated contract test harness; interpreted as tech-plan URL-shape verification via code trace.

## Concerns / warnings

- Sub-agents uniformly confirmed PRD AC coverage — suspiciously clean on logic, but test/absence gaps justify SHOULD-FIX tier per calibration guidance.
- Prototype iteration findings under `docs/DEV-90/findings/prototype/` were not read (pure-reviewer rule); overlapping warnings (i18n, `force*`, urls.ts placement) independently re-derived.

## Did not do (out of scope or deferred)

- **Chrome MCP walkthrough:** Batched chrome sub-agent not run; PRD runtime paths verified via code trace + existing prototype Lighthouse artifacts referenced only in planning logs, not read as findings input.
- **Full Playwright E2E suite:** Requires backend + auth; skipped with documented reason.
- **Reading sibling deep-review findings:** Prohibited by pure-reviewer discipline.
