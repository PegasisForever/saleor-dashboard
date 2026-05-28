---
agent: step-7-deep-simplify-order-copy-link-button-pass-2
sequence: 33
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
status: DONE
---

## Summary

Ran simplify-angle deep review pass-2 on the order-copy-link-button area (~431 LOC source delta since `45b5cef8`). Expanded scope to parent hosts, export call sites, clipboard/URL integration hooks, and sibling copy patterns. Spawned four explore sub-agents (reuse-scan, abstraction-opportunities, sibling-helper compare, missing-simplifications). Verdict **pass** with six WARNING findings; no BLOCKERs.

## Decisions made independently

- **force* props stay WARNING not BLOCKER:** UI design explicitly chose Storybook pinning props (`ui-design.md:51`); simplify angle flags the production API/CSS cost without blocking merge.
- **aria-live region not flagged as over-engineering:** Pass-2 addition addresses desktop/mobile UX findings; hand-rolled sr-only CSS is justified as first repo usage with no shared primitive — only the duplicate `formatMessage` is flagged.
- **getShareableOrderUrl placement:** Classified as WARNING (convention drift), not SHOULD-FIX — auth domain uses the same colocation pattern (`getNewPasswordResetRedirectUrl` in `utils.ts`).

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/** src/hooks/useClipboard.ts src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — full pass-2 delta.
- `docs/DEV-90/logs/027-step-7-coordinator-pass-2.md` — touchedFiles list (did not read sibling findings).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-65` — force props, useCallback, aria-live.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-51` — pseudo + force mirror CSS, statusRegion.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — single-caller helper.
- `src/orders/components/OrderCopyLinkButton/*.test.tsx`, `getShareableOrderUrl.test.ts` — duplicated mocks.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:14-111` — fixture duplication.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — parent wire-up.
- `src/hooks/useClipboard.ts:12-27` — copy fn not memoized.
- `src/orders/urls.ts:234-235`, `src/auth/utils.ts:108-109` — URL helper siblings.
- `src/components/CopyableText/CopyableText.tsx`, `TrackingNumberDisplay.tsx`, `PspReference.tsx` — copy UI peers.
- `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-47` — fixture comparison.
- `.storybook/main.ts:5` — no pseudo-state addon installed.
- `git grep` for `getShareableOrderUrl`, `OrderCopyLinkButton`, `forceCopied`, `aria-live`, `useClipboard`.

## Considered then dropped

- **BLOCKER on force* production props:** Re-read `ui-design.md:51`; intentional Storybook contract → downgraded to F-001 WARNING.
- **SHOULD-FIX to extract shared LiveRegion component:** Only one sr-only live region in repo; premature abstraction → dropped.
- **WARNING on trailing `?` in shareable URL:** Matches `orderUrl` convention and is tested intentionally in `getShareableOrderUrl.test.ts:65-75`; not a simplify finding.
- **Fast-path skip:** Diff is non-trivial (~431 LOC, new tests, aria-live); angle applies.

## Dead ends and retries

- `docs/DEV-90/findings/deep-review/pass-002/` did not exist — created directory before writing findings.

## Ambiguities encountered

- **Pass-1 vs pass-2 finding overlap:** Did not read pass-001 simplify findings per pure-reviewer rule; independently re-derived similar force*/fixture/URL-placement observations from current source.

## Concerns / warnings

- Sub-agents referenced planning logs (`docs/DEV-90/logs/023-*`) for aria-live context; main session verified only production code and PRD/ui-design/tech-plan.

## Did not do (out of scope or deferred)

- Chrome/Storybook visual walkthrough — simplify angle is file/grep only; no UI surface change requiring runtime verification for these findings.
- Reading pass-001 findings or sibling pass-002 reviewer outputs — pure-reviewer discipline.
