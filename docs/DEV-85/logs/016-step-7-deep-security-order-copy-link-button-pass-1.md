---
agent: step-7-deep-security-order-copy-link-button-pass-1
sequence: 16
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
status: DONE
---

## Summary

Ran security deep review for the order-copy-link-button area: mechanical checks (dep-audit skip, secrets/dangerous-patterns/auth-boundary pass), expanded scope tracing of exports/call sites/parents/integration hooks, and consolidation of ten parallel sub-agent investigations. Verdict pass with zero findings — clipboard URL exposure and query-param sharing are explicit PRD scope behind existing auth gates.

## Decisions made independently

- **Zero findings vs WARNING on query-param clipboard content**: Considered filing WARNING for dialog deep-link params in copied `window.location.href`. Rejected because PRD (`prd.md:17-18`) and tech-plan risk table (`tech-plan.md:49`) explicitly accept full-href copy; identical to manual address-bar copy; recipients still require `MANAGE_ORDERS` session.
- **url prop footgun**: Considered WARNING for unvalidated optional `url` string copied to clipboard. Rejected as production has zero callers passing `url` (`OrderDetailsPage.tsx:211`); prop documented as Storybook/test override in tech plan; same unvalidated passthrough exists in all `useClipboard` consumers.
- **useClipboard race/unmount issues**: Sub-agents flagged pre-existing hook limitations. Classified out of scope for this area diff — hook unchanged; not introduced by OrderCopyLinkButton.
- **dep-audit skip**: Empty diff on `package.json`/`pnpm-lock.yaml` since pipeline-start; no new packages to audit.

## Files / sections inspected

- `git diff 45b5cef8..HEAD` scoped to OrderCopyLinkButton/*, OrderDetailsPage.tsx, ClipboardCopyIcon.tsx, locale/defaultMessages.json
- `docs/DEV-85/prd.md`, `docs/DEV-85/tech-plan.md`, coordinator log `docs/DEV-85/logs/013-step-7-coordinator-pass-1.md`
- All production/story/test files under `src/orders/components/OrderCopyLinkButton/`
- `src/hooks/useClipboard.ts`, `src/hooks/useClipboard.test.ts`
- Auth/routing: `src/index.tsx`, `src/auth/components/SectionRoute.tsx`, `src/auth/hooks/useAuthProvider.ts`
- Order routing: `src/orders/index.tsx`, `src/orders/urls.ts`, `src/orders/views/OrderDetails/OrderDetails.tsx`
- Sibling patterns: `CopyableText.tsx`, `TrackingNumberDisplay.tsx`, `OrderCustomer.tsx`, `PspReference.tsx`
- Token storage: `src/legacy-sdk/core/storage.ts`
- `git grep OrderCopyLinkButton`, `git grep ClipboardCopyIcon`, `git grep useClipboard`

## Considered then dropped

- **SHOULD-FIX missing encodeURIComponent**: Almost flagged based on prior-run benchmark (SLRD-001 Bug re: URL helpers). Re-read diff — feature copies `window.location.href`, does not call `orderPath`/`orderUrl`; encoding drift N/A.
- **BLOCKER missing auth on component**: Almost flagged missing `RequirePermissions` on button. Re-traced route stack — `SectionRoute` + staff session already gates `/orders`; button cannot be reached without `MANAGE_ORDERS`; copying link does not grant new access.
- **WARNING query-string entity IDs in shared links**: Dropped per explicit PRD/tech-plan acceptance (see Decisions).
- **BLOCKER url prop phishing vector**: Dropped — no production wire-up; would require code change by future developer, not end-user input path today.

## Dead ends and retries

- Shell sub-agents for dep-audit/secrets/dangerous-patterns returned BLOCKED in readonly Ask mode; re-ran equivalent checks in main session (`git diff` empty for deps, rg on diff for secrets/patterns).
- Coordinator `pass-001/` findings directory did not exist yet; created during this run.

## Ambiguities encountered

- **Coordinator touchedFiles list**: Not in a separate JSON artifact; inferred from coordinator log body and `git diff` stat (10 source files). Scope matched coordinator description.

## Concerns / warnings

- Clipboard copies full browser URL including dialog query state when modals open — intentional product behavior, not a security bypass, but operators should know pasted links carry current view state.
- `useClipboard` shared hook has known async/unmount edge cases documented in sub-agent report; unchanged by this feature.

## Did not do (out of scope or deferred)

- Did not read sibling deep-review findings or prior pass artifacts (pure-reviewer rule).
- Did not run full `pnpm audit` on entire monorepo (no new deps in diff; dep-audit skipped).
- Did not spawn Chrome sub-agent (no chrome-using checks in security baseline for this UI-only clipboard feature).
