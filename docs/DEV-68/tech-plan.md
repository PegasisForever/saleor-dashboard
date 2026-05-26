# Tech Plan: Copy order link button in order details TopNav

## Architecture overview

```
OrderDetailsPage (TopNav children)
  └── OrderCopyLinkButton
        ├── useClipboard() → navigator.clipboard.writeText
        ├── getAbsoluteOrderUrl(orderId) → origin + mount URI + /orders/{id}
        └── ClipboardCopyIcon(copied) → CopyIcon | CheckIcon
```

The button is a leaf presentational/action component with no GraphQL dependency. Parent passes `order.id` from loaded order data.

## Data model

No schema or GraphQL changes. Input is a single string `orderId` (GraphQL global ID, already available on `OrderDetailsFragment`).

## API conventions

N/A — client-only clipboard write. URL built client-side:

```typescript
urlJoin(
  window.location.origin,
  getAppMountUriForRedirect(),
  orderPath(encodeURIComponent(orderId)).slice(1),
);
```

Respects dashboard subpath mounts (`APP_MOUNT_URI`) consistent with auth redirect and datagrid row anchor patterns.

## Affected components

- File: `./src/orders/urls.ts` — add `getAbsoluteOrderUrl(orderId)` helper exporting absolute shareable URL without query params
- File: `./src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — new copy-link button component (prototype committed)
- File: `./src/orders/components/OrderCopyLinkButton/messages.ts` — `orderCopyLinkMessages.copyOrderLink`, `orderCopyLinkMessages.linkCopied`
- File: `./src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories with `createStateDecorator` for persistent Hover/Active visuals, plus `InTopNav` placement story
- File: `./src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — render `<OrderCopyLinkButton orderId={order.id} />` before metadata button (integration task)
- File: `./src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — add test for copy button presence and clipboard invocation (integration task)

## Dependencies

No new packages.

## Risks

| Risk                                                           | Mitigation                                                                                                                                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clipboard API blocked (non-secure context / permission denied) | Existing `useClipboard` logs console warning; same behavior as other copy buttons — no new failure UI in scope                                                                                                   |
| Subpath mount URL incorrect                                    | `getAbsoluteOrderUrl` uses `getAppMountUriForRedirect()` matching auth/login URL construction; add unit test in `urls.test.ts` during integration                                                                |
| Hover/Active Storybook pseudo-class persistence                | `Hover`/`Active` stories use macaw-token `createStateDecorator` (inline `<style>` + wrapper class) so settled renders match production `:hover`/`:active` tokens without story-only CSS modules on the component |
| Message ID lint (`formatjs/enforce-id`)                        | Run `pnpm run extract-messages` during integration to assign content-hash IDs                                                                                                                                    |
| Draft orders excluded                                          | `OrderDraftPage` uses separate TopNav without metadata — copy button intentionally omitted per PRD scope                                                                                                         |
