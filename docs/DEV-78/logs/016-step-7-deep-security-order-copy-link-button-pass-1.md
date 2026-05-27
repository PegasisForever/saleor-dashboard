---
agent: step-7-deep-security-order-copy-link-button-pass-1
sequence: 16
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
status: DONE
---

## Summary

Ran security deep review on DEV-78 order-copy-link-button: mechanical checks (dep-audit, secrets-scan, dangerous-patterns, auth-boundary) plus six parallel qualitative sub-agents. Verdict **pass** with two WARNINGs (URL encoding parity, silent clipboard failure). No BLOCKERs — no auth bypass, no credential leak, no new deps, no XSS/eval surfaces.

## Decisions made independently

- **encodeURIComponent drift classified WARNING not BLOCKER:** Real security impact is link integrity/canonicalization for staff sharing, not guest access or credential exposure. GraphQL IDs are server-controlled; `/` in base64 is in-band for legitimate IDs. PRD AC #3 explicitly codifies raw `orderPath(orderId)`, so this is a spec-aligned but security-adjacent gap.
- **IDOR via global ID in URL not filed:** Copied links expose the same opaque ID already visible in the address bar and routable via existing navigation. Backend `order(id)` + `MANAGE_ORDERS` gate pre-exist; feature does not widen authorization.
- **Stale orderId race not filed:** Real cache-and-network race exists but impact is copying a link to an order the user already had access to — operational/correctness, not a new confidentiality boundary.
- **dep-audit pass despite repo-wide vulns:** `pnpm audit` reports 32 pre-existing moderate/high issues; diff touches zero dependency manifest files.

## Files / sections inspected

- `git diff 45b5cef8..HEAD -- 'src/**' 'locale/**'`: 11 files, ~515 LOC — full diff read
- `src/orders/utils/getShareableOrderUrl.ts:5-6`: URL construction, no encoding
- `src/orders/urls.ts:192,234-273`: sibling `orderPath` vs `*Url` encodeURIComponent pattern
- `src/orders/index.tsx:82-87,161`: route decodeURIComponent, `:id` single segment
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:11-23`: clipboard wiring, empty-id guard
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:20-33`: i18n labels, no URL in DOM
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`: integration `orderId={order.id}`
- `src/hooks/useClipboard.ts:12-25`: writeText, silent catch
- `src/index.tsx:248-251`: SectionRoute MANAGE_ORDERS gate
- `src/auth/components/SectionRoute.tsx:18-38`: permission check → NotFound
- `src/orders/views/OrderDetails/OrderDetails.tsx:62-68`: order null → NotFoundPage
- `src/utils/urls.ts:27-28`: getAppMountUriForRedirect
- `src/graphql/client.ts` + `legacy-sdk/apollo/client.ts`: JWT via headers, not URL
- `docs/DEV-78/prd.md`, `docs/DEV-78/tech-plan.md`: scope, AC, risks
- `docs/DEV-78/logs/013-step-7-coordinator-pass-1.md`: area scoping (single cohesive feature)

## Considered then dropped

- **BLOCKER on missing encodeURIComponent:** Re-read `urls.ts` — all `*Url` helpers encode but PRD AC #3 mandates raw `orderPath`. Downgraded to WARNING; encoding bug affects link correctness for `/`-containing base64 IDs, not auth bypass.
- **BLOCKER on IDOR / predictable global IDs:** Traced auth chain; recipient needs own session + MANAGE_ORDERS + backend authorization. Sharing makes enumeration easier operationally but is not a new vulnerability surface introduced by this diff.
- **BLOCKER on clipboard poisoning / XSS via orderId:** `writeText` only (no HTML clipboard); orderId from GraphQL not user input; no dangerouslySetInnerHTML in feature path.
- **WARNING on stale orderId during navigation:** Sub-agent flagged cache-and-network race; dropped because both orders require same staff permissions and wrong-link risk is pre-existing navigation concern.
- **WARNING on window.location.origin binding:** Same pattern as auth redirects (`useAuthRedirection.ts`); not introduced by this feature.
- **mechanical check url-encoding-parity: fail:** Considered custom check but would force verdict fail without a BLOCKER finding; encoded as F-001 WARNING instead.

## Dead ends and retries

- **gitleaks unavailable:** `gitleaks` not on PATH; fell back to diff pattern grep for secrets — no matches in source diff.
- **Coordinator touchedFiles JSON missing:** `docs/DEV-78/findings/deep-review/pass-001/` empty; used coordinator log + `git diff --stat` for file list.

## Ambiguities encountered

- **Raw vs encoded orderPath intentional?** PRD AC #3 and tech-plan Risks § both acknowledge raw `orderPath`; PRD is authoritative for conformance but tech-plan data model says `{encodedId}` — treated as known spec/implementation tension, filed as WARNING for security-adjacent link integrity.

## Concerns / warnings

- Sub-agents uniformly passed auth-boundary; thin evidence on "predictable global IDs" is pre-existing dashboard behavior, not regression.
- Clipboard silent failure already flagged by UI reviewer in prototype iteration; filed here from operational-integrity angle only.

## Did not do (out of scope or deferred)

- Chrome walkthrough: security angle has no UI auth surface change requiring browser verification; auth traced statically.
- Reading sibling deep-review findings or prior pass artifacts: pure-reviewer constraint.
- Reading files under `logs/` except own execution log: pipeline rule (read coordinator log for scope only).
