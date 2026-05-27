# Tech Plan: Copy order link button in order details TopNav

## Architecture overview

```
OrderDetailsPage (TopNav)
  └── OrderCopyLinkButton
        ├── useClipboard()           → copied state + copy(text)
        ├── ClipboardCopyIcon        → copy/check icon swap
        ├── getOrderShareableUrl()   → absolute URL builder
        └── orderCopyLinkButtonMessages → i18n labels
```

User clicks the button → `getOrderShareableUrl(orderId)` builds `urlJoin(origin, mountUri, /orders/{id})` → `useClipboard().copy()` writes to clipboard → icon and label update for 2 seconds.

## Data model

No GraphQL or backend changes. Client-only:

- Input: `order.id` (string, base64 GraphQL ID)
- Output: clipboard string — absolute URL e.g. `https://dashboard.example.com/dashboard/orders/T3JkZXI6MQ==`

New helper:

```typescript
// src/orders/urls.ts
getOrderShareableUrl(orderId: string): string
```

## API conventions

N/A — no network calls. Clipboard via `navigator.clipboard.writeText` (same as existing `useClipboard` hook).

## Affected components

| File                                                                        | Change                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`         | **New** — copy-link button component                               |
| `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`  | focus-visible, active, disabled, Storybook `[data-state]` previews |
| `src/orders/components/OrderCopyLinkButton/messages.ts`                     | **New** — `orderCopyLinkButtonMessages`                            |
| `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` | State stories with settled-state wrappers + copied preview         |
| `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx`               | Wire `OrderCopyLinkButton` into TopNav before metadata button      |
| `src/orders/urls.ts`                                                        | Add `getOrderShareableUrl`                                         |
| `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`                | Optional `size` / `strokeWidth` props for TopNav icon sizing       |

## Dependencies

None — reuses existing `useClipboard`, `ClipboardCopyIcon`, macaw-ui-next `Button`, `url-join`, `getAppMountUriForRedirect`.

## Risks

| Risk                                             | Mitigation                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Clipboard API denied (non-HTTPS / permission)    | Same as existing hooks — `useClipboard` logs warning; no crash; consider follow-up toast (out of scope) |
| Subpath mount URI edge cases                     | Reuses proven `getAppMountUriForRedirect()` pattern from auth/staff flows                               |
| `OrderDetailsPage` is `@ts-strict-ignore` legacy | New component written strict; minimal touch to legacy page (single import + JSX)                        |
| Storybook clipboard unavailable                  | Stories use `Object.defineProperty(navigator, "clipboard", …)` decorator (configurable mock)            |

## Testing notes (deferred to task agent)

- Unit test: `getOrderShareableUrl` with mocked `window.location` and mount URI
- Component test: `OrderCopyLinkButton` click → clipboard called, label updates
- Manual: verify button appears on normal + unconfirmed order details TopNav
