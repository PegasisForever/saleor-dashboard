# Tech Plan: Copy order link button in order details TopNav

## Architecture overview

```
OrderDetailsPage
  └─ TopNav
       ├─ OrderCopyLinkButton (new)
       │    ├─ useClipboard()           — copied state + clipboard write
       │    ├─ getShareableOrderUrl()  — builds absolute URL
       │    ├─ ClipboardCopyIcon      — copy/check icon (existing)
       │    └─ orderCopyLinkButtonMessages — i18n labels
       ├─ metadata Button (existing)
       └─ TopNav.Menu (existing)
```

On click, `OrderCopyLinkButton` calls `copy(getShareableOrderUrl(orderId))`. The hook writes to `navigator.clipboard`, sets `copied=true` for 2s, and the component updates `aria-label`/`title` and passes `hasBeenClicked={copied}` to `ClipboardCopyIcon`.

## Data model

No GraphQL or backend schema changes. Input is the existing `order.id` string already available on `OrderDetailsPage`.

## API conventions

N/A — client-only clipboard interaction. Shareable URL shape:

```
{window.location.origin}{APP_MOUNT_URI}/orders/{encodedOrderId}?
```

Built by `getShareableOrderUrl(orderId)` composing `orderUrl(orderId)` (includes `encodeURIComponent` and trailing `?` via `stringifyQs`), `getAppMountUriForRedirect()`, and `urlJoin` with `window.location.origin`.

## Affected components

- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — new button component; optional `forceCopied` / `forceHovered` / `forceFocused` / `forceActive` props default `false` (Storybook visual pinning only)
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/focus/active/disabled styles on production button; `:active svg` / `.buttonForceActive svg` use `--mu-colors-text-default1` for ≥3:1 icon contrast on default3 background
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories plus `InOrderDetailsTopNav` / `InOrderDetailsTopNavNarrow` composition stories
- File: `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — URL builder utility
- File: `src/orders/components/OrderCopyLinkButton/messages.ts` — `orderCopyLinkButtonMessages` i18n catalog
- File: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — render `OrderCopyLinkButton` in TopNav before metadata button

## Dependencies

No new packages.

## Risks

| Risk                                                                 | Mitigation                                                                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Clipboard API blocked (non-HTTPS / denied permission)                | `useClipboard` already logs a console warning; no user-visible error in v1 — acceptable per PRD out-of-scope       |
| Double `marginRight={3}` spacing between copy + metadata buttons     | Both buttons use `marginRight={3}` matching existing metadata pattern; verify visually in Storybook TopNav context |
| `getShareableOrderUrl` incorrect when `APP_MOUNT_URI` is non-default | Reuses same `getAppMountUriForRedirect` + `orderUrl` helpers as auth redirect URLs                                 |
| Prototype wired into `OrderDetailsPage` before task decomposition    | Intentional for planning fidelity; task agent can split test additions if needed                                   |
