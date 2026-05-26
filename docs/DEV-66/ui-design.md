# UI Design: Copy order link in order details TopNav

## Storybook URL

http://localhost:11000/6e802f28-fca3-4baf-8ca0-26869cb7cece

## Screens / surfaces

### Order details TopNav

- Purpose: Let admins copy a shareable order URL from the page header.
- Entry points: Orders list → open order → order details view (`OrderDetailsPage`).
- Layout:

```
[← Back]  Order #1234 [status pill]     [Copy link] [Metadata] [⋮ Menu]
```

- Components used:
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`
  - Integrated in `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx`
- Interactions:
  - Click copy-link → `useClipboard` writes absolute URL → icon toggles to check for ~2s
  - Keyboard: button is focusable; Enter/Space activates copy
- States covered (`OrderCopyLinkButton.stories.tsx`):
  - `default` — `Default` story: idle copy icon
  - `hover` — `Hover` story: story-only `.storyHover` forces hover background
  - `focus` — `Focus` story: story-only `.storyFocus` forces focus ring
  - `active` — `Active` story: story-only `.storyActive` forces pressed background
  - `disabled` — `Disabled` story: `disabled={true}`
  - `loading` — `Loading` story: disabled + reduced opacity (clipboard is synchronous; loading is a visual placeholder for future async guards)
  - `error` — `Error` story: button + `messages.copyOrderLinkFailed` alert text (clipboard failure is not yet surfaced in production UI; story documents intended failure affordance)
  - `empty` — `Empty` story: explanatory text when no `orderId` (component returns `null`)

## Mobile considerations

- TopNav action cluster uses Macaw `Button` with standard touch target; secondary icon buttons match metadata button sizing (`iconSize` via `ClipboardCopyIcon` at 16px inside secondary button).
- On narrow viewports, TopNav children wrap per `TopNav` `flexWrap="nowrap"` — copy button stays in the action group with metadata and menu.

## Accessibility

- Keyboard nav order: back link → title (non-interactive) → copy-link button → metadata button → menu trigger
- `aria-label` and `title` both set to localized `messages.copyOrderLink`
- Success feedback is visual (icon change); no live region required for ~2s transient state (consistent with `CopyableText` / `TrackingNumberDisplay`)
- Error story uses `role="alert"` for the failure message prototype

## Design decisions

- **Icon-swap feedback only** — Matches orders-domain copy controls (`TrackingNumberDisplay`, `OrderCustomer`); avoids toast noise in TopNav. Alternatives considered: gift-card-style `useNotifier` toast — rejected for consistency with orders.
- **Reuse `ClipboardCopyIcon`** — Same 16px copy/check toggle as tracking number copy; ticket explicitly requires existing copy-icon component.
- **Placement before metadata** — Copy is a frequent action; metadata remains adjacent to menu as today.
- **Absolute URL helper** — `getOrderAbsoluteUrl` in `src/orders/utils/getOrderAbsoluteUrl.ts` centralizes mount-uri + origin handling (same pattern as staff password redirect links).
