---
agent: step-7-deep-simplify-order-copy-link-button-pass-1
sequence: 19
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
status: DONE
---

## Summary

Ran simplify-angle deep review on the order-copy-link-button area (~400 LOC across 11 source/locale files since anchor `45b5cef8`). Spawned ten parallel read-only sub-agents for mechanical checks and six adversarial prompts. Found seven WARNING-level simplification opportunities (redundant disabled guard, story duplication, fixture copy-paste, heavy page test, container/view split, isolated URL helper, disabled story wiring drift). No BLOCKERs. Verdict: pass.

## Decisions made independently

- **encodeURIComponent drift (sub-agent prompt 1):** Not filed — sibling `orderUrl` encoding mismatch is a correctness/consistency concern, not unjustified complexity for the simplify angle.
- **Clipboard failure / unmount races in useClipboard:** Not filed — pre-existing hook behavior accepted per tech plan; not introduced complexity in this diff.
- **Container/view split as BLOCKER:** Downgraded to WARNING — tech plan and ui-design explicitly chose View for Storybook states; simplification is optional collapse, not a merge gate.
- **abstraction-opportunities mechanical check:** Marked `fail` because multiple concrete near-duplicates exist; qualitative findings remain WARNING-only per simplify calibration.

## Files / sections inspected

- `git diff 45b5cef8..HEAD` scoped to OrderCopyLinkButton/*, getShareableOrderUrl*, OrderDetailsPage.tsx/test, locale BLmn1V/ThVxK6
- `docs/DEV-78/prd.md`, `tech-plan.md`, `ui-design.md`: scope, architecture, Storybook state requirements
- `docs/DEV-78/logs/013-step-7-coordinator-pass-1.md`: single-area scope, 11-file footprint
- `OrderCopyLinkButton.tsx:11-24`, `OrderCopyLinkButtonView.tsx:13-36`: container/view wiring, disabled guard
- `OrderCopyLinkButton.stories.tsx:18-146`: TopNavDecorator, Hover/Focus/Active triplet, Disabled story
- `OrderCopyLinkButton.stories.module.css`: story-only pseudo-state CSS
- `OrderCopyLinkButton.test.tsx`, `getShareableOrderUrl.test.ts`: mock boundaries
- `OrderDetailsPage.test.tsx:18-136`: full-page mock burden, compareDocumentPosition
- `getShareableOrderUrl.ts:5-6`, `src/orders/urls.ts:192-235`: URL helper placement vs orderPath/orderUrl
- `src/hooks/useClipboard.ts`: shared hook, no new logic in diff
- `TrackingNumberDisplay.tsx`, `CopyableText.tsx`, `PspReference.tsx`: single-file clipboard peer patterns
- `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-37`: duplicate mockUser fixture
- Grep: `compareDocumentPosition`, `*View.tsx` under orders, `urlJoin(window.location.origin`, `useClipboard` call sites

## Considered then dropped

- **Filing BLOCKER on container/view split:** Re-read tech-plan architecture diagram — split is deliberate for Storybook; kept as WARNING suggesting optional collapse.
- **Filing finding on story CSS module with !important:** Noted as story-only preview necessity per ui-design L50; not production complexity — omitted as standalone finding, referenced under F-002.
- **Generic getAbsoluteDashboardUrl helper:** Considered under F-006 but scoped to colocating order-specific helper in urls.ts rather than proposing cross-domain auth refactor in this ticket.
- **useCallback deps include both disabled and orderId:** Folded into F-001 (removing disabled guard also cleans deps); not a separate finding.

## Dead ends and retries

- Coordinator JSON with explicit `touchedFiles` array not found on disk — used coordinator log prose plus `git diff --stat` to derive scope; sufficient for review entry point.

## Ambiguities encountered

- **Whether Storybook View split is "justified complexity":** Resolved by weighing tech-plan explicit choice vs peer single-file patterns; filed as WARNING with optional collapse path rather than pass-with-no-note.

## Concerns / warnings

- Sub-agent on sibling helpers surfaced encodeURIComponent drift — routed to correctness reviewers, not duplicated here.
- Seven WARNINGs is at the high end for simplify; all are structural/maintainability, not behavioral defects.

## Did not do (out of scope or deferred)

- Chrome/UX walkthrough — simplify angle has no chrome-using checks; UI states reviewed via story source only.
- Reading sibling deep-review findings under `pass-001/` — pure-reviewer discipline.
- Proposing new npm dependencies — library-substitution check passed; existing deps used correctly.
