# Tech Plan: Copy order link button in order details TopNav

## Architecture overview

```
OrderDetailsPage (TopNav)
  └── OrderCopyLinkButton
        ├── useClipboard()           → navigator.clipboard.writeText + 2s reset
        ├── ClipboardCopyIcon        → CopyIcon / CheckIcon swap
        ├── getShareableOrderUrl()   → absolute dashboard order URL
        └── messages.ts              → copyOrderLink / orderLinkCopied
```

User clicks the secondary TopNav button → `getShareableOrderUrl(orderId)` builds the URL → `useClipboard.copy()` writes it → `copied` flips true → icon and accessible label update for 2 seconds.

## Data model

No GraphQL or backend changes. Inputs:

- `orderId: string` — Saleor global ID from loaded order (`order.id`)

URL helper output:

- `string` — `{origin}{mountUri}/orders/{encodedId}` with no query string

## API conventions

N/A — client-only clipboard interaction. Clipboard failure surfaces via `console.warn` in `useClipboard` (existing behavior).

## Affected components

- File: `./src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx` — presentational button (copied/disabled/onCopy props) shared by container and state stories; no Storybook-only props or CSS imports
- File: `./src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — Storybook-only hover/focus/active preview wrappers using macaw tokens (`color-mix` + `--mu-colors-*`)
- File: `./src/orders/components/OrderCopyLinkButton/messages.ts` — i18n messages (`messages.copyOrderLink`, `messages.orderLinkCopied`)
- File: `./src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container wiring `useClipboard` + URL helper to view
- File: `./src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook prototype with TopNav context and state stories
- File: `./src/orders/utils/getShareableOrderUrl.ts` — builds absolute shareable order URL
- File: `./src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — import and render `<OrderCopyLinkButton orderId={order.id} />` before metadata button (integration task)
- File: `./src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — add interaction test for copy button placement and clipboard call (integration task; file may need creation if absent)

Reused unchanged:

- `./src/hooks/useClipboard.ts`
- `./src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`

## Dependencies

None.

## Risks

- **Clipboard permission denied:** Existing hook only warns to console; no toast. Mitigation: acceptable per ticket scope; future enhancement could use `useNotifier`.
- **Mount URI mismatch:** `getAppMountUriForRedirect()` must match deployed dashboard path. Mitigation: same helper used elsewhere for auth redirects.
- **Encoded order ID in path:** `orderPath` uses raw ID; `orderUrl` encodes — helper uses `orderPath` which matches router segment. Verify encoded ID in integration tests.
- **Metadata button title not i18n:** Pre-existing hardcoded English on metadata button; copy button follows i18n conventions separately.
