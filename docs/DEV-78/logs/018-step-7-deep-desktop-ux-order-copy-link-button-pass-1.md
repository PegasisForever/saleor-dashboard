---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-1
sequence: 18
input_branch: 04aaf8e902a7277b5e64bee43842a5c4f41bed35
status: DONE
---

## Summary

Reviewed DEV-78 order-copy-link-button from desktop-ux angle: read diff and integration sites, spawned chrome sub-agent for Storybook walkthrough (production unreachable), verified state transitions and keyboard flow independently in Chrome, and wrote pass verdict with one WARNING on screen-reader copy feedback.

## Decisions made independently

- **production-walkthrough: skip**: `curl localhost:9000` returned 000 / connection refused; Storybook at `local-deploy:11000` used per skip protocol.
- **integration-context: pass via source**: Storybook stories are isolated (no TopNav/metadata neighbor); confirmed DOM order and guards in `OrderDetailsPage.tsx` L211–218 and `TopNav/Root.tsx` L68–82.
- **F-001 WARNING not BLOCKER**: PRD AC only requires dynamic `aria-label`/`title` (met); missing `aria-live` is a gap vs ui-design SR claim but matches other order clipboard controls (`TrackingNumberDisplay`).
- **Did not flag useClipboard double-click race**: Pre-existing hook behavior shared across codebase; not introduced by this diff.
- **Did not flag getOrderShareableUrl encoding**: Correctness/URL parity concern; outside desktop interaction scope for this pass.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/ src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx src/orders/urls.ts`: full feature implementation diff
- `docs/DEV-78/prd.md`: acceptance criteria for placement, clipboard URL, icon swap, labels
- `docs/DEV-78/ui-design.md`: Storybook URL, state matrix, SR announcement claim
- `docs/DEV-78/logs/017-step-7-coordinator-pass-1.md`: touchedFiles scope (10 src/locale files)
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: component contract, labels, icon swap
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` L205–233: TopNav integration and conditional render
- `src/hooks/useClipboard.ts`: 2s reset, silent error handling
- `src/components/AppLayout/TopNav/Root.tsx` L57–83: action cluster flex layout, channel picker before children
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx`: comparison clipboard UX pattern
- `src/orders/urls.ts` L192–195, L237–238: shareable URL vs orderUrl encoding
- Storybook Default/Focus stories via chrome-devtools MCP: click transition, keyboard focus

## Considered then dropped

- **BLOCKER on missing aria-live**: Reclassified to WARNING — PRD AC satisfied; visual feedback and icon swap work; pattern consistent with existing order clipboard controls.
- **WARNING on clipboard failure UX**: Dropped — PRD explicitly excludes toast; `useClipboard` silent warn is established pattern.
- **WARNING on getOrderShareableUrl encoding vs orderUrl**: Dropped — affects link correctness not in-app interaction; fixtures use padded base64 IDs but path-segment `=` is generally valid.
- **FAIL on integration-context**: Dropped — source wiring is correct; Storybook isolation is environmental, not a code defect.
- **WARNING on rapid double-click truncating copied state**: Considered from `useClipboard.ts` L18–21 timer overwrite; dropped as pre-existing hook issue not specific to this diff.

## Dead ends and retries

- `evaluate_script` querying `[data-test-id="copy-order-link"]` returned "no button" — Storybook renders story inside iframe; `wait_for` + a11y snapshot with iframe uid succeeded.
- Sub-agent reported screenshots saved but only `01-storybook-default-snapshot.txt` present in evidence dir; re-verified interactively in main session.

## Ambiguities encountered

- **Tab order before metadata in production**: Not interactively verifiable without full TopNav story; relied on DOM order in `OrderDetailsPage.tsx` (copy before metadata before menu).
- **Screen reader re-announcement on aria-label change**: Standard AT behavior is not to re-read focused control name; treated ui-design SR claim as overstated rather than fully testable without AT tooling.

## Concerns / warnings

- No Storybook story places `OrderCopyLinkButton` inside TopNav with metadata neighbor — future `InTopNavContext` story would help Step 7 production-context checks.
- `useClipboard` assigns new timeout without clearing prior on rapid re-copy — low risk for icon button but more exposed than hover-reveal copy controls.

## Did not do (out of scope or deferred)

- Re-run Step 3 static checks (contrast, touch-target sizing, token purity) — explicitly out of scope per prompt.
- Start dev server + backend for live order details walkthrough — blocked by environment.
- Read sibling deep-review findings or prior pass artifacts — pure-reviewer discipline.
