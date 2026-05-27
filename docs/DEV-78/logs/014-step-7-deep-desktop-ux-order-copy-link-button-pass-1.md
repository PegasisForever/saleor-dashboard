---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-1
sequence: 14
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
status: DONE
---

## Summary

Ran desktop-ux deep review for DEV-78 order-copy-link-button: read diff and planning artifacts, spawned six non-chrome adversarial sub-agents plus one chrome batch (partially blocked in sub-agent Ask mode), completed live Storybook walkthrough via chrome-devtools, and filed two WARNING findings with pass verdict.

## Decisions made independently

- **production-walkthrough: skip**: `localhost:9000` returned `net::ERR_CONNECTION_REFUSED`; fell back to Storybook at `local-deploy:11000` per skip protocol.
- **Verdict pass despite WARNINGs**: No BLOCKER findings; mechanical checks pass or skip.
- **Did not file clipboard-denied or missing aria-live**: PRD and ui-design explicitly scope these (console.warn only; aria-label swap is the announced mechanism).
- **Did not file icon size 16 vs 20 mismatch**: Static visual parity with metadata button is Step 3 territory; unchanged in implementation loop.
- **Did not file order.id loading crash**: `OrderDetailsPage` already dereferences `order` in `createOrderMetadataIdSchema(order)` with similar undefined-order risk; not introduced solely by copy button wiring.

## Files / sections inspected

- `docs/DEV-78/prd.md`: AC1–AC8 for walkthrough script
- `docs/DEV-78/ui-design.md`: Storybook URL, tab order, error/loading omissions
- `docs/DEV-78/tech-plan.md`: architecture, risks
- `docs/DEV-78/logs/013-step-7-coordinator-pass-1.md`: touchedFiles scope
- `git diff 45b5cef..HEAD` for OrderCopyLinkButton folder, OrderDetailsPage.tsx, getShareableOrderUrl.ts, locale
- `src/orders/components/OrderCopyLinkButton/*.tsx`, `messages.ts`, tests, stories
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts`
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232`, test placement assertion
- `src/components/AppLayout/TopNav/Root.tsx`, `Menu.tsx`
- `docs/DEV-78/findings/prototype/iteration-002/evidence/copied-snapshot.txt`: prior DOM order evidence
- Live Storybook: Default, Disabled stories; screenshot `docs/DEV-78/findings/deep-review/pass-001/evidence/desktop-ux-copy-clicked.png`

## Considered then dropped

- **BLOCKER on unguarded `order.id` during Apollo loading**: Re-read `createOrderMetadataIdSchema` — page already assumes loaded order; loading overlay does not unmount TopNav but undefined-order crash predates this line.
- **BLOCKER on missing toast for clipboard denial**: PRD out-of-scope; ui-design documents intentional omission.
- **WARNING on form submit via Enter**: Metadata button shares same `Button` without `type="button"` inside `<Form>`; Enter on copy in Storybook activated copy only; macaw default type not verified (node_modules absent) — treated as established neighbor pattern.
- **WARNING on encodeURIComponent in getShareableOrderUrl**: Correctness/integration concern; Saleor IDs are base64-safe in practice and router uses raw segment — not filed under desktop-ux.
- **INFO on draft orders lacking copy button**: PRD explicitly limits to order details TopNav for non-draft paths.

## Dead ends and retries

- Chrome sub-agent returned Ask-mode block; re-ran full Storybook walkthrough in main session successfully.
- `localhost:9000` production probe failed immediately with connection refused.

## Ambiguities encountered

- Whether macaw `Button` defaults to `type="button"` inside forms: unresolved without node_modules; deferred after neighbor-pattern check.

## Concerns / warnings

- Inherited `useClipboard` timer race is real under double-click but lives in shared hook used by TrackingNumberDisplay, OrderCustomer, etc.
- Storybook copied URL uses iframe origin (`local-deploy:11000`) — expected; production URL shape verified via unit test.

## Did not do (out of scope or deferred)

- Re-run Step 3 static mechanical checks (contrast, touch targets) on unchanged component surfaces
- Mobile viewport walkthrough (assigned angle: desktop-ux)
- Read sibling reviewer findings or prior deep-review passes (pure-reviewer rule)
