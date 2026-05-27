---
agent: step-7-deep-security-order-copy-link-button-pass-2
sequence: 32
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
status: DONE
---

## Summary

Ran pass-2 security deep review for DEV-85 order-copy-link-button: read cumulative diff since `45b5cef8`, expanded scope to call sites/parents/integration/tests, spawned ten parallel sub-agents (four mechanical + six adversarial prompts), and consolidated observations. Verdict `pass` with zero findings — pass-2 delta (useClipboard timer fix, aria-live, placement/E2E tests) does not introduce new security surface beyond pass-1's already-reviewed clipboard-behind-auth pattern.

## Decisions made independently

- **Zero findings despite non-trivial diff:** Correctness/UX pass-2 work is substantial, but security-relevant delta is narrow (timer fix + static SR text + tests). Clipboard URL exposure and query-param sharing remain explicit PRD scope behind existing auth gates — not regressions.
- **Did not file WARNING on optional `url` prop:** Latent API could copy arbitrary strings if miswired, but production never passes it and pattern matches `CopyableText`. Filing would be speculative manufacture, not an active vulnerability.
- **Excluded `useClipboardCopy` token-flow issues from findings:** Sub-agent surfaced orphan-timer bug in extension token dialog — different hook, not in order-copy-link diff or production integration path for this feature.
- **dep-audit skip:** Confirmed zero lines in `package.json`/`pnpm-lock.yaml` diff; no audit run needed.

## Files / sections inspected

- `docs/DEV-85/logs/029-step-7-coordinator-pass-2.md` — touchedFiles list and area boundaries.
- `git diff 45b5cef8..HEAD -- src/ locale/ playwright/` — full implementation delta.
- `src/orders/components/OrderCopyLinkButton/*` — all 8 component/story/test files.
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts` — pass-2 timer fix and tests.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-211` — production host wiring.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — placement test.
- `playwright/tests/orders.spec.ts:155-178` — E2E coverage.
- `src/auth/components/SectionRoute.tsx`, `src/index.tsx:248-251` — auth boundary.
- `src/legacy-sdk/core/storage.ts:19-47` — token storage (not URL-embedded).
- `src/orders/urls.ts:192,234-235` — sibling URL encoding comparison.
- `src/components/CopyableText/CopyableText.tsx`, `src/orders/components/OrderCustomer/OrderCustomer.tsx` — sibling clipboard patterns.
- `grep OrderCopyLinkButton|useClipboard|ClipboardCopyIcon` — call site enumeration.

## Considered then dropped

- **WARNING on unvalidated `url` prop:** Sub-agent prompt 3 flagged missing scheme allowlist. Re-read production call site (`OrderDetailsPage.tsx:211` — no props) and decided latent API surface without active exploit path doesn't meet security finding bar for this area.
- **WARNING on query-param leakage in shared links:** Tech plan explicitly accepts (`tech-plan.md:49`); PRD out-of-scope for canonical URL. Same as manual address-bar copy — informational only, not a defect.
- **SHOULD-FIX on missing component-level `RequirePermissions`:** TopNav metadata button and other actions also rely on route-level `MANAGE_ORDERS` only; adding per-button gate would be defense-in-depth preference, not security regression from this diff.
- **Finding on useClipboardCopy token timer race:** Interesting cross-hook observation from prompt 6 sub-agent, but out of order-copy-link-button area scope — dropped.

## Dead ends and retries

- `docs/DEV-85/findings/deep-review/pass-002/` did not exist yet — created directory before writing findings file.

## Ambiguities encountered

- **Pass-2 vs pass-1 security delta:** Coordinator log confirms same single area with expanded touchedFiles (hook fix, aria-live, tests). Resolved: security review focuses on delta + re-validation of unchanged production path, not re-filing pass-1 observations.

## Concerns / warnings

- Sub-agent noted `useClipboardCopy` (extensions) lacks the same timer `clear()` fix applied to shared `useClipboard` — pre-existing, out of area, but worth separate review if extension token copy UX is ever hardened.

## Did not do (out of scope or deferred)

- Did not read pass-001 security findings or sibling pass-002 reviewer outputs (pure-reviewer discipline).
- Did not run chrome walkthrough — security angle has no chrome-using checks; production app walkthrough not required for clipboard-behind-auth static analysis.
- Did not file findings on backend `order(id:)` authorization — no backend changes in scope; IDOR boundary is pre-existing platform concern.
