---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-2
sequence: 29
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
status: DONE
---

## Summary

Ran pass-2 mobile-UX deep review on order-copy-link-button: expanded scope to TopNav parents, clipboard hook, Title component, and all export call sites; spawned six non-chrome adversarial sub-agents plus one batched chrome sub-agent. Storybook narrow walkthrough at 320–390 px passed tap/copy/layout checks; production app unreachable (localhost:9000 refused). Verdict pass with three WARNING findings (hover stickiness, story fidelity, duplicate SR path). Pass-2 remediation (aria-live, key remount, timer fix) verified in source and unit tests.

## Decisions made independently

- **`new-surface-checks-mobile: pass` despite stale Storybook bundle:** Deployed Storybook at `local-deploy:11000` lacks the aria-live region in runtime DOM, but current source (`OrderCopyLinkButton.tsx:60-64`) and unit test (`OrderCopyLinkButton.test.tsx:70-86`) confirm the pass-2 surface. Classified as environmental Storybook deploy lag, not a code defect — did not file BLOCKER.
- **`mobile-a11y-paths: pass`:** Focus order and label update verified in a11y snapshots; duplicate announce path downgraded to WARNING rather than fail.
- **Clipboard failure silent on mobile:** PRD explicitly out-of-scopes error toast; did not file finding for missing user-visible error (consistent with pass-1 and PRD scope).
- **No SHOULD-FIX tier findings:** Remaining gaps are story fidelity and touch hover polish — WARNING tier per calibration; no source-local correctness gap blocking mobile core flow.

## Files / sections inspected

- `docs/DEV-90/logs/027-step-7-coordinator-pass-2.md` — touchedFiles scope (10 src files).
- `git diff 45b5cef8..HEAD -- src/` — full pass-2 delta including tests, aria-live, key remount.
- `docs/DEV-90/prd.md`, `ui-design.md`, `tech-plan.md` — AC and mobile considerations.
- `src/orders/components/OrderCopyLinkButton/*` — component, CSS, stories, tests, URL builder, messages.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232` — parent wire-up.
- `src/orders/components/OrderDetailsPage/Title.tsx` — production title layout vs story.
- `src/components/AppLayout/TopNav/Root.tsx:57-83` — nowrap action cluster.
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts` — timer fix and rapid-copy test.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — icon swap.
- `src/orders/urls.ts:234-235` — encodeURIComponent sibling pattern.
- `grep OrderCopyLinkButton|getShareableOrderUrl|orderCopyLinkButtonMessages` — call site enumeration.
- `docs/DEV-90/review/a11y-*.txt` — chrome sub-agent a11y snapshots.

## Considered then dropped

- **BLOCKER on missing aria-live in deployed Storybook:** Chrome sub-agent reported `role="status"` null at runtime. Re-read source and unit test; confirmed implementation present. Stale Storybook build from pre-pass-2 deploy — dropped as environmental, not code bug.
- **SHOULD-FIX for ungated `:hover`:** Considered promoting pass-1 hover finding to SHOULD-FIX since `@media (hover: hover)` pattern exists in `OrderValue.module.css`. Kept WARNING — cosmetic touch UX, not broken core flow; localized one-line CSS fix but not merge-blocking.
- **SHOULD-FIX for duplicate SR announcement:** Considered removing one path as task. ui-design.md explicitly documents label-based SR flow AND pass-2 added live region to address pass-1 F-001; redundancy is intentional trade-off — WARNING only.
- **Finding on clipboard permission denial:** Sub-agent flagged silent failure on mobile Safari. PRD out-of-scope for error UI; dropped.
- **Finding on stale Apollo order during fast navigation:** Theoretical race between route param and cached `order.id`; `key={order.id}` mitigates UI carryover; no reproducible mobile trigger without live app — dropped.

## Dead ends and retries

- **Chrome sub-agent claimed PNG screenshots under `docs/DEV-90/review/` but glob found none:** A11y `.txt` snapshots exist and were used as evidence; PNG paths from sub-agent were not persisted.
- **Deployed Storybook missing pass-2 aria-live:** Initially looked like implementation gap; source read confirmed code is present — reinterpreted as stale static deploy.

## Ambiguities encountered

- **ui-design.md says action cluster "wraps on narrow viewports" but TopNav uses `flexWrap="nowrap"`:** Treated ui-design as aspirational; runtime behavior is nowrap with title ellipsis. Storybook walkthrough showed fit at 320 px with short title; filed WARNING for story not using production Title rather than BLOCKER on nowrap itself (pre-existing TopNav behavior).

## Concerns / warnings

- Published Storybook URL in ui-design.md may predate pass-2 remediation — future reviewers should rebuild/redeploy before runtime verification of new surfaces.
- No mobile Playwright coverage for copy-link integration; reliance on Storybook + unit tests for pass-2 verification.

## Did not do (out of scope or deferred)

- Read pass-001 findings files (pure-reviewer independence rule).
- Rebuild/redeploy Storybook to verify aria-live at runtime.
- Production app walkthrough (backend unreachable).
- Re-measure 32×32 touch targets (Step 3 static check; UI unchanged per prompt).
