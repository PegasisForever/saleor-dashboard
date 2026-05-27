---
agent: step-7-deep-security-order-copy-link-button-pass-2
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
verdict: pass
---

## Summary

Security review of the order-copy-link-button feature finds no exploitable auth bypass, injection surface, or sensitive-data leakage beyond the existing order-details URL model. The diff adds no npm dependencies, no secrets, and no dangerous DOM/script patterns. URL construction correctly applies `encodeURIComponent` before path join and deliberately omits query parameters, reducing accidental sharing of dialog state compared to copying the address bar.

## Findings

## Justification

This area adds a clipboard copy control that reconstructs the same authenticated staff dashboard deep link already represented in the browser location bar (origin + mount URI + encoded order path), without query strings. From a security angle the surface is narrow: no new HTTP handlers, no auth logic changes, no new third-party packages, and no user-controlled free-text input—the `orderId` prop is wired from GraphQL `order.id` on an already-authorized order details page.

**Mechanical checks (all pass):**
- **dep-audit:** `git diff 45b5cef8..HEAD -- package.json pnpm-lock.yaml` is empty; feature imports only existing in-repo modules (`useClipboard`, `url-join`, macaw-ui, react-intl).
- **secrets-scan:** gitleaks over repo and commit range reported no leaks; grep of added lines found no credential patterns.
- **dangerous-patterns:** No `eval`, `dangerouslySetInnerHTML`, `innerHTML`, shell exec, or SQL concat in scoped files; clipboard uses `navigator.clipboard.writeText` with a constructed string, never rendered as HTML.
- **auth-boundary:** Traced copy path (`OrderCopyLinkButton` → `getShareableOrderUrl` → `useClipboard`) and recipient path (`Auth` login gate → `SectionRoute` `MANAGE_ORDERS` → GraphQL `order(id:)` → `NotFoundPage`). Copied URL contains no session tokens; access still requires staff authentication and backend authorization.

**Qualitative prompts (no actionable security defects):**
1. **Sibling patterns:** `getShareableOrderUrl` matches `orderUrl` encoding (`encodeURIComponent` before `orderPath`) at `src/orders/urls.ts:234-235`; absolute URL composition matches auth redirect helpers in `src/auth/utils.ts:108-109`.
2. **PRD runtime trace:** URL is rebuilt from `window.location.origin` + config mount URI + encoded path—never `location.href`/`search`—so dialog query params are excluded by construction (`getShareableOrderUrl.ts:5-10`, test at `getShareableOrderUrl.test.ts:61`).
3. **Missing safeguards:** Empty `orderId` is guarded (`OrderCopyLinkButton.tsx:13-18`); whitespace-only IDs and clipboard error UX gaps are pre-existing `useClipboard` patterns shared by seven other consumers, not a new security primitive introduced here; production `orderId` is server-sourced GraphQL ID.
4. **Adversarial inputs:** Path-reserved characters (`/`, `+`, `?`, `#`, `&`, `=`, `%`, unicode) are percent-encoded before `orderPath`; `javascript:` payloads become path segments under the dashboard origin, not executable schemes; clipboard writes plain text only.
5. **Attacker model:** Shareable link is a reference URL, not a capability token; recipient must pass login, staff check, `MANAGE_ORDERS`, and backend `order(id:)` authorization; order ID exposure in the path is intentional staff-sharing behavior identical to normal navigation URLs.
6. **Failure modes:** `useClipboard` unmount/timeout races and `getAppMountUriForRedirect()` config trust are pre-existing shared infrastructure concerns; `key={order.id}` on integration prevents stale copied-state carryover across order navigation.

Considered then dropped as non-security for this area: silent clipboard failure (UX/correctness, shared hook), staging-vs-production origin selection (operational, matches address-bar semantics), and order global ID decodability (intentional, same as existing `/orders/:id` routes).
