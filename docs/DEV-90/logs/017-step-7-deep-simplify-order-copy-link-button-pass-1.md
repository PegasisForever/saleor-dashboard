---
agent: step-7-deep-simplify-order-copy-link-button-pass-1
sequence: 17
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
status: DONE
---

## Summary

Ran simplify-angle deep review on the six-file `order-copy-link-button` area (diff since `45b5cef8`). Expanded scope to parents, integration hooks, sibling clipboard/URL patterns, and tests. Spawned three explore sub-agents (reuse-scan, abstraction-opportunities, sibling URL grep). Verdict **pass** with five WARNING findings; no BLOCKERs.

## Decisions made independently

- **Trailing `?` on shareable URL not filed:** Auth helpers strip bare `?` before `urlJoin`; `getShareableOrderUrl` does not. Tech plan and PRD document trailing `?` from `orderUrl` as intentional; classify as consistency/correctness, not simplify, for this pass.
- **Missing unit tests not filed here:** Real gap but belongs to correctness/coverage angle; noted in inspection list only.
- **All simplify findings are WARNING:** None would embarrass at ship tier; each is optional consolidation the Task loop could take locally.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/ OrderDetailsPage.tsx` — ~296 LOC product delta
- `OrderCopyLinkButton.tsx`, `getShareableOrderUrl.ts`, `messages.ts`, `OrderCopyLinkButton.module.css`, `OrderCopyLinkButton.stories.tsx` — full new module
- `OrderDetailsPage.tsx:210-232` — parent TopNav wire-up with `order?.id` guard
- `useClipboard.ts`, `ClipboardCopyIcon.tsx`, `TrackingNumberDisplay.tsx`, `PspReference.tsx` — reuse comparisons
- `orders/urls.ts:234-235`, `utils/urls.ts:27-28`, `auth/utils.ts:108-109`, `StaffList.tsx:140-144` — absolute URL siblings
- `TopNav.stories.tsx:11-47` — duplicate mock fixtures
- `docs/DEV-90/prd.md`, `tech-plan.md`, `ui-design.md`, `project-context.md`
- `git grep` for `OrderCopyLinkButton`, `getShareableOrderUrl`, `force*`, `copy-order-link` in tests

## Considered then dropped

- **SHOULD-FIX for `getShareableOrderUrl` location:** Prototype consistency already WARNed colocation; simplify angle keeps WARNING — moving to `urls.ts` is convention, not a runtime defect.
- **BLOCKER on `order?.id` guard:** Parent uses safe optional chaining; no unconditional `.id` deref.
- **Library substitution for `urlJoin`:** Project already depends on `url-join`; auth uses same pattern — no hand-rolled URL parser to replace.
- **Filing TopNav story duplication of metadata Button as separate finding:** Folded into F-003/F-001 context; near-duplicate JSX is pre-existing metadata pattern mirrored for composition fidelity, not new abstraction debt beyond mock user copy.

## Dead ends and retries

- `docs/DEV-90/findings/deep-review/pass-001/` coordinator index not on disk yet — used `docs/DEV-90/logs/011-step-7-coordinator-pass-1.md` touched-file list instead (same six `src/` paths).

## Ambiguities encountered

- **Coordinator `pass-001` directory empty:** Proceeded from Step 7 coordinator log `touchedFiles` equivalent (six source paths).

## Concerns / warnings

- Sub-agents confirmed `force*` pattern is repo-unique — highest-signal simplify debt for future Storybook conventions.

## Did not do (out of scope or deferred)

- Chrome / Storybook runtime walkthrough — simplify angle is static; no UI surface change requiring Lighthouse
- Read sibling deep-review findings or `logs/` from other Step 7 reviewers — pure-reviewer rule
- Six separate adversarial-prompt sub-agents — consolidated three explore agents + main-session PRD/trace review; covered sibling-grep, adversarial inputs (empty orderId), and missing-test absence
