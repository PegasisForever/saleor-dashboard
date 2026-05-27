# DEV-78 Task Graph

Loop-back re-entry after PR #5 Copilot review. Prototype and implementation loop already shipped `OrderCopyLinkButton`, TopNav integration, i18n messages (`BLmn1V`, `ThVxK6`), and core unit tests. Remaining tasks address merge artifacts and review findings only.

---

## T-9f4c2a8e: Consolidate shareable order URL helper and encode order IDs

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

PR #5 Copilot review (substantive loop-back trigger):

> `orderId` is interpolated into the path without encoding, diverging from every other order URL helper in `src/orders/urls.ts` (`orderUrl`, `orderFulfillUrl`, `orderPaymentRefundUrl`, `orderReturnUrl`, `orderTransactionRefundUrl`, `orderManualTransactionRefundUrl`, all of which wrap the id with `encodeURIComponent`). Although the PRD calls out raw `orderPath`, the resulting shareable link will be malformed for any order id that contains characters such as `/`, `?`, `#`, or `+` (Saleor global IDs are base64 and can contain `+` and `/`). Recommend wrapping with `encodeURIComponent(orderId)` for parity with the rest of the file and to produce a valid URL in all cases.

Duplicate helper from merge (`docs/DEV-78/logs/021-step-9-pr-invocation-1.md`):

> Merge with `-X ours` still added files only on remote (urls.ts duplicate helper, module.css, extra locale IDs)

Current production wiring uses the utils helper only:

```typescript
// src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
import { getShareableOrderUrl } from "@dashboard/orders/utils/getShareableOrderUrl";
// ...
copy(getShareableOrderUrl(orderId));
```

Duplicate in `urls.ts` (unused by production):

```typescript
export const getOrderShareableUrl = (orderId: string): string =>
  urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId));
```

Sibling pattern for encoded navigational URLs:

```typescript
// src/orders/urls.ts
export const orderUrl = (id: string, params?: OrderUrlQueryParams) =>
  orderPath(encodeURIComponent(id)) + "?" + stringifyQs(params);
```

Original PRD AC#3 (superseded for encoding — loop-back requires parity with `orderUrl`):

> Copied URL equals `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId))` with no query string

[Source: ./docs/DEV-78/prd.md#acceptance-criteria]

### Acceptance

- [ ] Exactly one shareable-order URL helper remains in the codebase; `getOrderShareableUrl` is removed from `src/orders/urls.ts` along with its dedicated tests in `src/orders/urls.test.ts`, and all callers/tests import the surviving helper
- [ ] The surviving helper builds URLs as `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(encodeURIComponent(orderId)))` with no query string
- [ ] `pnpm run test:quiet src/orders/utils/getShareableOrderUrl.test.ts` passes and includes at least one assertion that an order ID containing `+` or `/` is encoded in the output path segment
- [ ] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` passes without mocking a removed duplicate helper path

---

## T-3b7d1e5f: Remove merge-artifact locale entries and unused CSS module

- Status: done
- Priority: medium
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

PR #5 Copilot review on stale locale IDs:

> The new locale entries `GyfpSu` and `l+hZ1x` duplicate the strings already registered under `BLmn1V` and `ThVxK6` but are not referenced by any `defineMessages` id in the codebase.

Production messages use only `BLmn1V` and `ThVxK6`:

```typescript
// src/orders/components/OrderCopyLinkButton/messages.ts
export const messages = defineMessages({
  copyOrderLink: {
    defaultMessage: "Copy order link",
    id: "BLmn1V",
    description: "button",
  },
  orderLinkCopied: {
    defaultMessage: "Order link copied",
    id: "ThVxK6",
    description: "button feedback after copy",
  },
});
```

Orphan entries still present in `locale/defaultMessages.json`:

```json
"GyfpSu": {
  "context": "order details TopNav copy-link button feedback after copy",
  "string": "Order link copied"
},
"l+hZ1x": {
  "context": "order details TopNav copy-link button label",
  "string": "Copy order link"
}
```

`OrderCopyLinkButton.module.css` was introduced by the remote merge branch but is not imported by any component (production uses macaw `Button` defaults; Storybook uses `OrderCopyLinkButton.stories.module.css` only).

[Source: ./docs/DEV-78/logs/021-step-9-pr-invocation-1.md#concerns--warnings]

### Acceptance

- [x] `GyfpSu` and `l+hZ1x` entries are removed from `locale/defaultMessages.json`; `BLmn1V` and `ThVxK6` remain unchanged
- [x] `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` is deleted
- [x] `pnpm run knip` reports no new unused-file findings for paths under `OrderCopyLinkButton/`

---

## T-6a8e4f2c: Add copied-feedback Jest coverage and reset copied state on order navigation

- Status: done
- Priority: medium
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

PRD AC#4 (not covered by existing Jest tests):

> After successful copy, button icon switches to check (`ClipboardCopyIcon hasBeenClicked={true}`) and `aria-label`/`title` show `messages.orderLinkCopied` for ~2 seconds, then revert

Existing component wiring delegates timing to `useClipboard` (2000 ms timeout):

```typescript
// src/hooks/useClipboard.ts
timeout.current = window.setTimeout(() => {
  clear();
  setCopyStatus(false);
}, 2000);
```

View renders copied feedback on `aria-label`, `title`, and icon:

```typescript
// src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx
const label = copied
  ? intl.formatMessage(messages.orderLinkCopied)
  : intl.formatMessage(messages.copyOrderLink);
// ...
icon={<ClipboardCopyIcon hasBeenClicked={copied} />}
aria-label={label}
title={label}
```

Deep-review WARNING (correctness):

> **Copied state on navigation:** `OrderCopyLinkButton.tsx` / `OrderDetailsPage.tsx:211` — `copied` persists up to 2s when navigating between orders without `key={order.id}`

Current integration:

```tsx
// src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
<OrderCopyLinkButton orderId={order.id} />
```

[Source: ./docs/DEV-78/prd.md#acceptance-criteria]
[Source: ./docs/DEV-78/summary.md#open-warnings-non-blocking]

### Acceptance

- [x] `OrderCopyLinkButton.test.tsx` includes a test using Jest fake timers that, after a successful mocked clipboard write, asserts `aria-label`/`title` become `"Order link copied"`, then revert to `"Copy order link"` after advancing timers by 2000 ms
- [x] `OrderDetailsPage.tsx` passes `key={order.id}` to `OrderCopyLinkButton` so copied feedback does not carry over when switching orders
- [x] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` and `pnpm run test:quiet src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` both pass
