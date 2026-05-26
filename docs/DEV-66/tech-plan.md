# Tech Plan: Copy order link in order details TopNav

## Architecture overview

```
OrderDetailsPage (TopNav children)
  └── OrderCopyLinkButton
        ├── useClipboard → navigator.clipboard.writeText
        ├── getOrderAbsoluteUrl(orderId) → absolute href string
        └── ClipboardCopyIcon(copied) → CopyIcon / CheckIcon
```

No GraphQL or Apollo changes. The button is a leaf UI component wired into the existing order details layout.

## Data model

No schema changes. Input is `order.id` (`string`) from `OrderDetailsFragment` already loaded on the page.

## API conventions

N/A — client-only clipboard write. URL shape:

- Relative path: `orderPath(encodeURIComponent(orderId))` → `/orders/{id}`
- Absolute: `urlJoin(window.location.origin, getAppMountUriForRedirect(), relativePath)`

## Affected components

- File: `src/orders/utils/getOrderAbsoluteUrl.ts` — new helper for absolute order URLs
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — new TopNav copy button; `orderId` optional to match call site
- File: `src/orders/components/OrderCopyLinkButton/messages.ts` — `messages.copyOrderLink`, `messages.copyOrderLinkFailed`
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state matrix stories
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only pseudo-state styles (`.storyHover`, `.storyFocus`, etc.) using Macaw `--mu-colors-*` tokens without hyphenated numeric suffixes
- File: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — render `<OrderCopyLinkButton orderId={order?.id} />` before metadata button

## Dependencies

No new packages.

## Risks

- **Subpath deployments:** `getAppMountUriForRedirect()` must match how the app is served; verified against existing `StaffList` / auth redirect patterns. Mitigation: unit-test URL builder with mocked `window.__SALEOR_CONFIG__`.
- **Clipboard permission denied:** `useClipboard` only logs a console warning today — no in-UI error. Error story documents future affordance; integration task may add notifier if product requires it.
- **Legacy `OrderDetailsPage` strict-ignore:** file remains `@ts-strict-ignore`; new component is strict-typed in its own module.
