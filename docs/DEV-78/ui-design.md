# UI Design: Copy order link button in order details TopNav

## Storybook URL

http://localhost:11000/529cf26a-0456-4a1b-a2ec-85509a5d52cc

Component stories: `Orders/OrderCopyLinkButton` — e.g. `?path=/story/orders-ordercopylinkbutton--default`

## Screens / surfaces

### Order details TopNav

- Purpose: One-click copy of the shareable order URL for staff collaboration
- Entry points: Orders list → order row → order details page (`/orders/{id}`)
- Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ ←  Order #1234                              [⎘] [</>] [⋮ menu] │
└─────────────────────────────────────────────────────────────────┘
     ↑ copy-link (new)   ↑ metadata (existing)
```

- Storybook: [Default story](http://localhost:11000/529cf26a-0456-4a1b-a2ec-85509a5d52cc/?path=/story/orders-ordercopylinkbutton--default)
- Components used:
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`
  - Reused: `ClipboardCopyIcon`, macaw-ui-next `Button` (`variant="secondary"`)
- Interactions:
  - Click → copies absolute URL via `getOrderShareableUrl(orderId)` to clipboard
  - Success → icon swaps copy → check for ~2s; `aria-label` / `title` update to `orderCopyLinkButtonMessages.orderLinkCopied`
- States covered: `default`, `hover`, `focus`, `active`, `disabled`, `copied`
  - Omitted (N/A): `loading`, `error`, `empty` — synchronous clipboard action with icon-only feedback; no empty data surface

| State    | Visual treatment                                                                       | Contrast / token                                  |
| -------- | -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| default  | Secondary icon button, copy icon (`ClipboardCopyIcon`), white background               | Text/icon on bg ≥ 4.5:1 (measured ~14.9:1)        |
| hover    | Macaw secondary hover: `--mu-colors-background-default2` tint, elevated shadow         | Non-text delta vs default (bg `rgb(246,247,249)`) |
| focus    | 2px `--mu-colors-text-default1` outline, 2px offset (`OrderCopyLinkButton.module.css`) | Focus ring ≥ 3:1 vs surrounding bg                |
| active   | Pressed: `--mu-colors-background-default2` background, `box-shadow: none`, no outline  | Distinct from focus (ring) and hover (shadow)     |
| disabled | `opacity: 0.4`, `cursor: not-allowed`                                                  | —                                                 |
| copied   | Check icon replaces copy icon; label → "Order link copied"                             | Icon shape change + label change vs default       |

## Mobile considerations

- TopNav icon buttons use macaw secondary sizing (~32×32 px measured), matching the existing metadata `Button` neighbor — org-wide macaw follow-up if 44×44 pt is required
- Copy action is icon-only to preserve TopNav horizontal space on narrow viewports
- No additional responsive breakpoints required — single icon button matches existing metadata control

## Accessibility

- Keyboard: Tab order places copy button before metadata button in TopNav action cluster
- Focus: `:focus-visible` ring on button (2px outline)
- ARIA: Dynamic `aria-label` and `title` reflect copy vs copied state
- Screen reader: Announces "Copy order link" → "Order link copied" after successful copy

## Design decisions

- **Placement before metadata button** — copy is a lightweight, frequent action; metadata edit remains adjacent but secondary in reading order (per ticket: "next to metadata button").
- **Icon-only secondary button** — matches existing metadata `Code` button pattern in `OrderDetailsPage` TopNav; avoids crowding title area with text.
- **Reuse `useClipboard` + `ClipboardCopyIcon`** — consistent with `TrackingNumberDisplay` and order clipboard patterns; no toast on copy (ticket scope).
- **Clean URL without query params** — `getOrderShareableUrl` uses `orderPath(id)` only, stripping modal/dialog query strings from the address bar.
- **Alternatives considered:** `CopyableText` inline pattern rejected — TopNav needs compact icon control, not hover-reveal inline copy.
