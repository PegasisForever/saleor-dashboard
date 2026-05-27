---
agent: step-7-deep-simplify-order-copy-link-button-pass-1
sequence: 19
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
status: DONE
---

## Summary

Ran simplify-angle deep review on the order-copy-link-button area: read the cumulative diff since `45b5cef8`, expanded scope to call sites/parent/integration/tests, spawned parallel sub-agents for abstraction/reuse/readability/library-substitution and qualitative pattern comparison. Filed five WARNING findings (unnecessary `useCallback`, dead `disabled` container prop, unused StoryPreview props, misleading `Error` story, hard-coded TopNav margin). Verdict `pass` — no BLOCKERs; production path is lean and correctly reuses shared clipboard primitives.

## Decisions made independently

- **Container/content split not flagged as over-engineering**: PRD and tech plan explicitly require the split for Storybook state stories without clipboard side effects; simplify findings target dead ceremony within that shape, not the split itself.
- **`messages.ts` not flagged**: Despite `TrackingNumberDisplay` using inline `formatMessage`, PRD AC and project-context mandate co-located `messages.ts` — contradicting that would be a planning-layer change, not a simplify nit.
- **StoryPreview + CSS module filed lightly, not as BLOCKER**: Codebase-unique story infrastructure is heavy, but it implements a documented ui-design/state-matrix requirement; only unused props and redundant `Error` story were flagged.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/ … OrderDetailsPage … ClipboardCopyIcon … locale/defaultMessages.json`
- `docs/DEV-85/logs/013-step-7-coordinator-pass-1.md` — touched-files starting scope
- `docs/DEV-85/prd.md`, `docs/DEV-85/tech-plan.md`
- All seven `OrderCopyLinkButton/*` source files
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:195-233`
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`, `TrackingNumberDisplay.tsx`
- `src/hooks/useClipboard.ts`, `useClipboard.test.ts`
- `src/components/CopyableText/CopyableText.tsx`, `CopyableText.test.tsx`
- `src/orders/components/OrderTransaction/.../PspReference.tsx`
- `src/warehouses/components/WarehouseDetailsPage/WarehouseDetailsPage.tsx:99-106`
- `rg OrderCopyLinkButton|OrderCopyLinkButtonContent|ClipboardCopyIcon|useClipboard|StoryPreview|stories.module.css` across repo

## Considered then dropped

- **Collapse container/content into one file**: Re-read PRD line 16 and tech-plan architecture diagram — split is an explicit acceptance requirement, not optional simplification.
- **Replace feature with `CopyableText`**: Reuse scan confirmed different UX contract (hover-reveal tertiary + visible text vs always-visible secondary TopNav icon-only button).
- **Flag missing `encodeURIComponent` on URL**: This feature copies `window.location.href`, not a constructed order path segment — sibling URL-helper drift pattern from prior runs does not apply.
- **SHOULD-FIX for `useCallback`**: Could be fixed locally, but it is stylistic inconsistency without runtime impact — kept as WARNING per simplify-angle calibration ("almost always WARNINGs").

## Dead ends and retries

- Coordinator `pass-001/` findings directory did not exist yet — created with `mkdir -p` before writing output files.
- Sub-agent abstraction scan could not run `git diff` in Ask mode — verified diff locally via shell instead.

## Ambiguities encountered

- **Whether story-only infrastructure counts as "unjustified complexity"**: Resolved by treating PRD/ui-design mandated Storybook state matrix as justified; findings limited to dead props and misleading `Error` story naming within that layer.

## Concerns / warnings

- Feature folder is 7 files (~300 LOC) vs 2 for `CopyableText`; most bulk is story-only artifacts mandated by planning, not production logic.
- `Hover` and `Focus` story CSS classes target different Macaw tokens but may render identically in Light theme — did not file separately without visual verification in this pass.

## Did not do (out of scope or deferred)

- Chrome/Storybook walkthrough — simplify angle is file/grep based; no UI surface change observable beyond static code structure.
- Read sibling deep-review findings from pass-001 (pure-reviewer discipline).
- Read `docs/DEV-85/findings/prototype/**` consistency/ui-review files (would violate independence rule; sub-agents referenced them but main session did not open them).
