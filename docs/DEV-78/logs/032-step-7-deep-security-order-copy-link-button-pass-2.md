---
agent: step-7-deep-security-order-copy-link-button-pass-2
sequence: 32
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
status: DONE
---

## Summary

Ran security deep review (pass 2) on the order-copy-link-button area: four mechanical checks (dep-audit, secrets-scan, dangerous-patterns, auth-boundary) via parallel sub-agents, plus six qualitative forced prompts. Consolidated evidence and wrote pass verdict with zero findings—the feature adds no new security surface beyond copying a reconstructed staff dashboard URL.

## Decisions made independently

- **Zero findings vs WARNING on silent clipboard failure:** Considered filing a WARNING that clipboard rejection could push users to copy the address bar (with query params). Dropped because `useClipboard` is a pre-existing shared hook used by seven components; the failure mode is not introduced or uniquely amplified by this diff, and `copied` correctly stays false (no false success).
- **Zero findings vs WARNING on order ID disclosure:** Order global IDs in shared URLs are intentional per PRD and identical to normal `/orders/:id` navigation; not classified as a defect.
- **Fast-path skip rejected:** Despite narrow surface, ran full mechanical and qualitative review because the diff adds new URL construction logic and clipboard integration worth verifying—not a docs-only or typo change.

## Files / sections inspected

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:11-24`: copy handler, empty-id guard
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:20-34`: i18n labels only, no URL rendered in DOM
- `src/orders/utils/getShareableOrderUrl.ts:5-10`: origin + mount + encoded orderPath
- `src/orders/utils/getShareableOrderUrl.test.ts:42-80`: no query string, special char encoding
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`: integration wiring `order.id`
- `src/hooks/useClipboard.ts:12-29`: clipboard writeText, timeout, failure path
- `src/orders/urls.ts:192,234-235`: orderPath and orderUrl encoding parity
- `src/orders/index.tsx:82-87,161`: route decodeURIComponent on :id
- `docs/DEV-78/prd.md`: acceptance criteria for URL shape and auth scope
- `git diff 45b5cef8..HEAD --stat`: scoped feature files (+399/-3 in feature area)

## Considered then dropped

- **WARNING on whitespace-only orderId:** `!orderId` is falsy-only; `"   "` would copy. Dropped because production always passes GraphQL `order.id`; not an injectable user input surface.
- **WARNING on `..` path segments:** `encodeURIComponent` does not encode `.`; theoretical url-join normalization edge case. Dropped because GraphQL order IDs are base64 tokens, never `".."`.
- **BLOCKER on auth bypass via shared link:** Traced full recipient path; URL has no bearer token. Rejected—access requires existing dashboard auth chain.
- **WARNING on staging origin in copied URL:** `window.location.origin` reflects current tab. Dropped—same trust model as address bar and auth redirect helpers.

## Dead ends and retries

- **Coordinator pass-002 report missing:** `docs/DEV-78/findings/deep-review/pass-002/` did not exist; inferred touched files from grep and `git diff --stat` instead of reading `logs/029-step-7-coordinator-pass-2.md` (forbidden by pure-reviewer rule).

## Ambiguities encountered

- **Coordinator touchedFiles list unavailable:** Used diff-scoped file list from grep matches and git stat; aligned with coordinator log description (single area, production source only) without reading the log file itself.

## Concerns / warnings

- Sub-agent reported pre-existing `pnpm audit` advisories (32 vulns) unrelated to this feature diff—recorded as dep-audit pass with evidence note, not a feature finding.

## Did not do (out of scope or deferred)

- **Chrome walkthrough:** No new auth entry points or runtime security behavior requiring browser verification; security surface is static URL construction + clipboard API.
- **Backend Saleor permission enforcement:** Assumed per GraphQL schema; frontend maps `order === null` to NotFoundPage only.
