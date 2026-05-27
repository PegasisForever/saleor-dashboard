# Tech Plan: Order details copy-link button

## Architecture overview

```
OrderDetailsPage (TopNav)
  ├── OrderCopyLinkButton          ← new; copies absolute order URL
  │     ├── useClipboard           ← existing hook (2s copied state)
  │     ├── ClipboardCopyIcon      ← existing copy/check icon
  │     └── getOrderAbsoluteUrl    ← new util (origin + mount + orderPath)
  ├── metadata Button (existing)
  └── TopNav.Menu (existing)
```

User clicks `OrderCopyLinkButton` → `getOrderAbsoluteUrl(orderId)` builds URL → `useClipboard().copy(url)` writes to clipboard → `ClipboardCopyIcon` shows check + `messages.orderLinkCopied` label for ~2s.

## Data model

No GraphQL or backend changes. Component accepts `orderId: string` prop from existing `order.id` on the details page.

## API conventions

N/A — client-only clipboard write via `navigator.clipboard.writeText`.

## Affected components

- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — icon button with `orderId`, optional `disabled`, and optional `previewState` for Storybook static renders
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — `:focus-visible`, `:active`, and `.buttonPreview*` mirror classes (hover uses `--mu-box-shadow-default-hovered`)
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — six distinct static state stories, each rendering inside shared `TopNavShell` wrapper
- File: `src/orders/components/OrderCopyLinkButton/messages.ts` — `copyOrderLink`, `orderLinkCopied` i18n messages
- File: `src/orders/components/OrderCopyLinkButton/getOrderAbsoluteUrl.ts` — absolute URL builder using `orderPath(encodeURIComponent(orderId))` + mount URI
- File: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — import and render `<OrderCopyLinkButton orderId={order.id} />` before metadata button
- File: `locale/defaultMessages.json` — extracted messages from `messages.ts`

## Dependencies

No new packages.

## Risks

| Risk                                                        | Mitigation                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `APP_MOUNT_URI` non-default breaks share URL                | Reuse `getAppMountUriForRedirect()` pattern from auth/staff flows                                            |
| Clipboard API denied in browser                             | Matches existing `useClipboard` behavior (`console.warn`); no toast unless product asks later                |
| `orderUrl()` vs `orderPath()` — query suffix on share links | Use `orderPath(encodeURIComponent(orderId))` only (same path segment as `orderUrl(id)` without query params) |
| Metadata button title still hardcoded English               | Out of scope for DEV-75; new button uses i18n                                                                |
| `previewState` prop could leak to production                | Optional prop ignored unless passed; integration task should not pass it                                     |
