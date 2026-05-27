---
agent: step-7-deep-security-order-copy-link-button-pass-1
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
verdict: pass
---

## Summary

Security review of the order-copy-link-button area finds no auth bypass, no credential exposure in copied URLs, no new dependencies, and no dangerous DOM/code-execution patterns. The feature reuses the existing `useClipboard` hook and inherits `MANAGE_ORDERS` section gating plus backend `order(id)` authorization. One WARNING remains: `getShareableOrderUrl` omits `encodeURIComponent` that every sibling order URL helper applies, which can produce ambiguous or broken share links for GraphQL global IDs containing path-reserved characters (notably `/` in base64).

## Findings

### F-001 [WARNING] Shareable URL skips encodeURIComponent used by sibling order URL helpers

- Location: `src/orders/utils/getShareableOrderUrl.ts:5-6` vs `src/orders/urls.ts:234-235`
- Description: `getShareableOrderUrl` passes the raw `orderId` into `orderPath`, while all navigational `*Url` helpers (`orderUrl`, `orderFulfillUrl`, `orderReturnUrl`, etc.) wrap the ID in `encodeURIComponent` before path construction. Saleor GraphQL global IDs are base64 strings whose alphabet includes `/`, `+`, and `=` — characters that affect URL path parsing. A copied link can therefore diverge from the canonical in-app URL the address bar would show via `orderUrl`, split into unintended path segments (e.g. `/orders/abc/def` instead of `/orders/abc%2Fdef`), or fail to resolve for recipients. This is an integrity/canonicalization gap in a staff-facing share path, not an auth bypass, but it increases the risk of staff distributing broken or misleading links.
- Evidence:
  ```typescript
  // getShareableOrderUrl.ts — raw ID
  urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId));

  // urls.ts — encoded ID for navigation
  export const orderUrl = (id: string, params?: OrderUrlQueryParams) =>
    orderPath(encodeURIComponent(id)) + "?" + stringifyQs(params);
  ```
  Route handler decodes on read (`src/orders/index.tsx:87`: `decodeURIComponent(id)`), confirming encoded URLs are the expected wire format. Tech plan § Risks flags this (`docs/DEV-78/tech-plan.md:54`); tests cover only benign `T3JkZXI6MQ==` and assert composition, not encoding parity (`getShareableOrderUrl.test.ts:38-55`).
- Suggested fix: Align with sibling helpers: `orderPath(encodeURIComponent(orderId))` inside `getShareableOrderUrl`, and add a test case for an ID containing `/` and `=` verifying parity with `orderUrl(orderId).split('?')[0]`.

### F-002 [WARNING] Clipboard denial fails silently — no user-visible integrity signal

- Location: `src/hooks/useClipboard.ts:23-25`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:20-22`
- Description: When `navigator.clipboard.writeText` rejects (permission denied, insecure context, enterprise policy), the hook logs a console warning and leaves `copied` false. The button UI offers no error state — staff may believe the link was copied when it was not, and verbally share an incorrect URL from memory. This is an operational-integrity gap on a feature whose sole purpose is reliable link distribution.
- Evidence:
  ```typescript
  // useClipboard.ts
  .catch(() => {
    console.warn("Failed to use clipboard, ensure browser permission is enabled.");
  });
  ```
  `OrderCopyLinkButtonView` toggles only between `messages.copyOrderLink` and `messages.orderLinkCopied`; PRD explicitly excludes toast notifications (`docs/DEV-78/prd.md:17-18`). `OrderCopyLinkButton.test.tsx` mocks `useClipboard` entirely and does not exercise the denial path.
- Suggested fix: Consider surfacing failure via `aria-live` error text or reusing the richer `useClipboardCopy` + `useNotifier` pattern elsewhere in the codebase; at minimum, avoid showing success-adjacent affordances when `writeText` rejects.
