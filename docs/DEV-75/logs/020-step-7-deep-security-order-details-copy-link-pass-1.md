---
agent: step-7-deep-security-order-details-copy-link-pass-1
sequence: 20
input_branch: e4ebc9531190c0993a632681a64d25ca24dc19db
status: DONE
---

## Summary

Ran security deep review for DEV-75 order-details-copy-link: read cumulative diff from `45b5cef8..HEAD`, planning artifacts, and traced integration through `OrderDetailsPage`, `useClipboard`, `orderPath`, and `SectionRoute`. Spawned four parallel sub-agents for dep-audit, secrets-scan, dangerous-patterns, and auth-boundary checks. All mechanical checks pass or skip; zero qualitative findings. Verdict: pass.

## Decisions made independently

- **dep-audit → skip**: `package.json` and `pnpm-lock.yaml` have zero-byte diff vs pipeline base; feature reuses existing deps (`url-join`, macaw-ui, react-intl, etc.).
- **IDOR via shared links → not a finding**: Copied URL is the same dashboard deep link already in the address bar; backend GraphQL auth + `MANAGE_ORDERS` gate unchanged. Operational sharing risk is PRD-intended, not an auth bypass.
- **Double `encodeURIComponent` → not security**: Matches existing `orderUrl()` pattern; encoding prevents path injection, does not weaken auth.
- **gitleaks unavailable → pass via grep fallback**: Verified diff and component files with pattern grep; no secret-like strings in feature hunks.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- src/orders/components/OrderCopyLinkButton/ src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx locale/defaultMessages.json`: full feature diff (~200 LOC)
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: clipboard handler, disabled guard, i18n labels, previewState Storybook-only
- `src/orders/components/OrderCopyLinkButton/getOrderAbsoluteUrl.ts`: origin + mount + encoded orderPath
- `src/hooks/useClipboard.ts`: `writeText` only, 2s reset, no HTML clipboard
- `src/orders/urls.ts:192-235`: `orderPath` / `orderUrl` encoding convention
- `src/utils/urls.ts:27-28`: `getAppMountUriForRedirect` from deploy config, not user input
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-211`: production wiring `orderId={order.id}`
- `src/auth/components/SectionRoute.tsx`: permission gate → NotFound when missing
- `src/index.tsx` (grep): `/orders` requires `MANAGE_ORDERS`
- `src/orders/views/OrderDetails/OrderDetails.tsx:62-68`: null order → NotFoundPage
- `docs/DEV-75/prd.md`, `docs/DEV-75/tech-plan.md`: scope confirms same-origin staff URL, no tokens
- `docs/DEV-75/logs/017-step-7-coordinator-pass-1.md`: touchedFiles starting scope

## Considered then dropped

- **WARNING on GraphQL global ID exposure in shared links**: Re-read PRD—feature goal is staff sharing order links; ID already visible in browser URL. Recipients still need dashboard auth; not a new leakage surface.
- **WARNING on clipboard permission denial silent failure**: `useClipboard` only `console.warn`s on failure—matches existing hook behavior across orders module; UX/correctness concern, not a security defect for this angle.
- **BLOCKER on `order.id` without optional chaining at L211**: Parent renders only after order loads; `isDisabled = !orderId` guards empty ID; runtime bug at worst, not injection or auth bypass.
- **WARNING on channel-scoped order access**: Saleor may restrict orders by channel at API level, but that boundary predates copy-link (address bar sharing identical); did not elevate to finding.

## Dead ends and retries

- **rg pipe secrets grep failed**: `git diff | rg -niE '...'` errored on empty pattern interpretation in shell; re-ran dangerous-pattern grep on diff directly with success.

## Ambiguities encountered

- **gitleaks not installed**: Sub-agent and local `command -v gitleaks` both negative; relied on diff + file pattern grep for secrets-scan evidence.

## Concerns / warnings

- None filed. Residual operational note: staff can paste admin URLs into external channels—inherent to any shareable admin deep link, mitigated by session auth.

## Did not do (out of scope or deferred)

- Chrome walkthrough: security angle has no UI auth surface change requiring browser verification; clipboard/auth analysis is code-based.
- `pnpm audit --prod` full-project scan: no new deps in feature diff; dep-audit correctly skipped.
