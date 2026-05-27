---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-1
sequence: 14
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
status: DONE
---

## Summary

Ran desktop-ux deep review for DEV-85 order-copy-link-button: expanded scope beyond touched files into TopNav parents, `useClipboard`, sibling clipboard patterns, and tests; spawned six non-chrome qualitative sub-agents plus one batched chrome sub-agent; verified Storybook interactions directly when production dev server was unreachable. Verdict `pass` with two SHOULD-FIX findings (SR announcement gap, rapid re-click timer race) and one WARNING (story integration parity).

## Decisions made independently

- **production-walkthrough: skip**: `curl localhost:9000` returned `000`; chrome navigation confirmed `net::ERR_CONNECTION_REFUSED`. Used Storybook at `local-deploy:11000/348e26e0-…` per skip protocol.
- **F-001 classified SHOULD-FIX not BLOCKER**: DOM aria-label updates work (verified in a11y snapshot after click); gap is unreliable live announcement vs ui-design SR flow claim — localized fix, primary mouse/keyboard path intact.
- **F-002 classified SHOULD-FIX**: Pre-existing `useClipboard` timer bug, but it directly violates PRD 2s copied window on rapid re-click — feature’s core interaction contract.
- **Did not re-flag Step 3 static checks**: 32×32 touch targets, contrast, token purity unchanged from prototype review; no new production surfaces beyond what Step 3 saw.
- **Verdict pass despite SHOULD-FIX**: Router rule — no BLOCKERs and no mechanical `fail`.

## Files / sections inspected

- `git diff 45b5cef8..HEAD` — full source delta for OrderCopyLinkButton area (~300 LOC)
- `docs/DEV-85/logs/013-step-7-coordinator-pass-1.md` — touchedFiles scope
- `docs/DEV-85/prd.md`, `ui-design.md`, `tech-plan.md` — AC and keyboard/SR expectations
- `OrderCopyLinkButton/*.tsx`, `messages.ts`, `*.test.tsx`, `*.stories.tsx`
- `OrderDetailsPage.tsx:206–232`, `Title.tsx:31–37`, `OrderDetails.tsx` routing
- `TopNav/Root.tsx`, `TopNavLink.tsx`, `Menu.tsx`
- `useClipboard.ts`, `useClipboard.test.ts`
- `ClipboardCopyIcon.tsx`, `TrackingNumberDisplay.tsx`, `CopyableText.tsx` — sibling patterns
- `docs/DEV-85/findings/prototype/iteration-002/evidence/inOrderDetailsTopNav-a11y.txt` — tab order evidence
- Storybook chrome session: `InOrderDetailsTopNav` click + clipboard mock reload

## Considered then dropped

- **BLOCKER on copy button during order loading**: Title shows skeleton while copy button is interactive — re-read PRD (copies current URL by design) and confirmed `window.location.href` is valid during fetch; dropped.
- **BLOCKER on missing `type="button"` inside Form**: Metadata neighbor has same pattern; Macaw Button behavior pre-existing; dropped as out-of-diff regression.
- **SHOULD-FIX on metadata button missing aria-label**: Pre-existing TopNav asymmetry; noted in sub-agent output but outside this feature’s diff scope; dropped from findings (would belong to separate i18n/a11y pass).
- **FAIL on prd-conformance mechanical check**: Primary click path satisfies all observable ACs in Storybook; rapid-click edge case captured as F-002 instead of failing whole check.

## Dead ends and retries

- **Production app**: Single attempt at `localhost:9000` — connection refused; proceeded to Storybook fallback without retrying dev server start (not in reviewer scope).
- **Chrome clipboard without mock**: First click left button in default state; reloaded with `initScript` clipboard mock — success path then verified (`14_172` → `"Order link copied"`).

## Ambiguities encountered

- **Whether ui-design SR flow is binding AC**: PRD AC4 covers aria-label text update (met); ui-design line 59 adds announcement expectation — treated as SHOULD-FIX gap for AT users rather than BLOCKER spec violation.

## Concerns / warnings

- Automated Storybook walkthrough required clipboard API mock; real browsers with permission should match observed label/icon transitions.
- `InOrderDetailsTopNav` story is insufficient for full production tab-order validation (filed F-003).

## Did not do (out of scope or deferred)

- Re-run Step 3 Lighthouse/contrast/touch-target measurements on unchanged component surfaces
- Start `pnpm run dev` to unblock production walkthrough (environment limitation accepted)
- Read sibling deep-review findings or prior pass artifacts (pure-reviewer rule)
