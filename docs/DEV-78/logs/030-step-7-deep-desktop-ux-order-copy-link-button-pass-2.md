---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-2
sequence: 30
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
status: DONE
---

## Summary

Ran pass-2 desktop-UX deep review on the order-copy-link-button area: read cumulative diff since `45b5cef8`, PRD, coordinator scope, implementation + integration + tests, and spawned six parallel adversarial sub-agents. Chrome production walkthrough blocked (dev server `:9000` refused, `node_modules` missing, Storybook CLI unavailable, no local-deploy Storybook UUID). Fell back to source/integration analysis and unit-test trace. Verdict **pass** with three WARNINGs (icon parity, clipboard timer race, silent failure).

## Decisions made independently

- **production-walkthrough: skip** — Attempted `navigate_page` to `http://localhost:9000/` → `net::ERR_CONNECTION_REFUSED`; `pnpm install` failed (EACCES on pnpm store); Storybook start failed (`storybook: not found`, no node_modules). local-deploy nginx root has no Storybook UUID. Environmental block per skip protocol, not a code defect finding.
- **order.id during loading not filed** — Sub-agent flagged `order.id` without optional chaining at `OrderDetailsPage.tsx:211`, but `createOrderMetadataIdSchema(order)` at `:157` and other bare `order` uses predate this diff; page already assumes defined order at runtime. Not introduced by copy-link integration.
- **Silent clipboard failure = WARNING not BLOCKER** — PRD explicitly scopes inline icon/label only and excludes toast; failure mode inherited from shared `useClipboard` with DEV-83 follow-up. Still worth WARNING for desktop interaction gap.
- **Icon size mismatch = WARNING** — Diff added `size`/`strokeWidth` props to `ClipboardCopyIcon` but production view omits them while neighbor metadata uses `iconSize.medium`; integration oversight, not Step-3 static token issue.
- **Verdict pass** — No BLOCKER findings; mechanical checks pass or skip.

## Files / sections inspected

- `docs/DEV-78/prd.md`: AC list for placement, copy URL, feedback timing, disabled state, secondary variant
- `docs/DEV-78/logs/029-step-7-coordinator-pass-2.md`: touched-files scope (OrderCopyLinkButton, getShareableOrderUrl, OrderDetailsPage, ClipboardCopyIcon, locale, tests)
- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/* src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx src/hooks/useClipboard.ts`: pass-2 loop-back fixes (encoding, key prop, timer test)
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:11-23`: container wiring
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:20-34`: label swap, button props
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:94-134`: copied aria-label/title + 2000ms revert
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:46-146`: TopNav decorator, static state stories
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-232`: TopNav integration + sibling order
- `src/orders/views/OrderDetails/OrderDetails.tsx:62-205`: order loading branch, OrderNormalDetails mount
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201-222`: order prop pass-through
- `src/hooks/useClipboard.ts:12-29`: async copy, timer, silent catch
- `src/hooks/useClipboard.test.ts:105-156`: multi-copy and rejection tests
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: size props added in diff
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx`, `src/components/CopyableText/CopyableText.tsx`: sibling copy UX patterns
- `src/components/AppLayout/TopNav/Root.tsx:57-83`: flex tab-order context
- `src/components/icons/index.ts:12-15`: iconSize.medium = 20

## Considered then dropped

- **BLOCKER on `order.id` crash during loading**: Re-read `OrderDetailsPage.tsx:157` (`createOrderMetadataIdSchema(order)`) — page already requires defined order; Title skeleton handles undefined display but page contract is pre-existing. Downgraded to not-a-finding for this diff.
- **BLOCKER on missing `type="button"` in form**: Copy and metadata buttons share pattern inside `Form` → `<form>`; metadata button predates feature without incident; macaw Button convention assumed. Not new regression.
- **BLOCKER on missing aria-live**: PRD specifies inline `aria-label`/`title` swap only; dynamic label on focused button matches AC4. No live region in any clipboard sibling. WARNING-level a11y gap only if filing at all — folded into silent-failure / SR announcement consideration, not separate BLOCKER.
- **WARNING on stale cache order URL during navigation**: Valid integration concern (`cache-and-network` + `order.id` from cached data) but affects all order-scoped actions equally; dropped to avoid duplicating data-layer issue not specific to copy-link UX contract.
- **WARNING on Focus story CSS-only focus ring**: Storybook-only artifact; Step 3 owns static story surfaces; production macaw Button focus not re-measured per prompt.

## Dead ends and retries

- `pnpm run storybook`: failed — `storybook: not found`, no node_modules
- `pnpm install`: failed — EACCES on `/home/kasm-user/.pnpm-store/v10` even with `PNPM_STORE_DIR=/tmp/pnpm-store`
- `curl http://local-deploy:11000/`: nginx welcome page only; no Storybook UUID in repo artifacts (`ui-design.md` missing from workspace)

## Ambiguities encountered

- **No `ui-design.md` / Storybook deploy URL in workspace**: Could not load published Storybook per fallback protocol step 4; relied on component stories source + Jest instead.
- **Cannot run Jest without node_modules**: Relied on reading test source and pass-1 pipeline green signal from shallow-review logs (did not read pass-1 deep-review findings per independence rule).

## Concerns / warnings

- Mock `useClipboard` in component tests sets `copied` synchronously, diverging from production async `.then()` path — timer/label tests validate view wiring but not post-async timing fidelity.
- `OrderDetailsPage.test.tsx` asserts DOM order vs metadata only, not vs `TopNav.Menu` (AC1 second clause).

## Did not do (out of scope or deferred)

- Step-3 static mechanical checks (contrast, touch targets, token purity) — explicitly out of scope for pass-2 desktop-ux
- Lighthouse / contrast measurement on unchanged Storybook surfaces
- Playwright e2e (no env to run)
- Read sibling reviewer findings under `pass-002/` or prior pass-1 deep-review files
