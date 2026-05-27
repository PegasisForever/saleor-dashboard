# UI Design: Copy order link button in order details TopNav

## Storybook URL

http://localhost:11000/3d437e55-da44-4c10-8c48-a9859a99dad2

## Screens / surfaces

### Order details TopNav

- Purpose: One-click copy of the current order page URL for sharing
- Entry points: Orders list → click any order → order details view (`/orders/:id`)
- Layout:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ←  Order #1234                    [Copy] [Code/metadata] [⋮ menu]     │
└─────────────────────────────────────────────────────────────────────────┘
                                      ↑ new    ↑ existing
```

- Components used:
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`
  - Story: `Orders/OrderCopyLinkButton/InOrderDetailsTopNav`
- Interactions:
  - Click / Enter / Space on copy button → copies `window.location.href` to clipboard
  - On success → icon changes Copy → Check; label changes to "Order link copied" for 2s
  - On clipboard failure → button stays in default state (no visual error affordance)
- States covered: `default`, `hover`, `focus`, `active`, `disabled`, `error`, `copied`
  - `loading` and `empty` omitted — copy is synchronous and always has a URL

| State    | Visual                                                                             | Token / mechanism                                                           |
| -------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| default  | Secondary icon button, Copy icon (`ClipboardCopyIcon`), label "Copy order link"    | `Button variant="secondary"`, icon color `default2`                         |
| hover    | Secondary button background lightens                                               | Macaw `Button` hover token on secondary variant                             |
| focus    | Visible focus ring on button                                                       | Macaw focus ring, target ≥3:1 contrast vs `--mu-colors-background-default1` |
| active   | Secondary button pressed/darker background                                         | Macaw `Button` active/pressed state                                         |
| disabled | Reduced opacity, no pointer events                                                 | `Button disabled` prop                                                      |
| error    | Unchanged from default (copy icon, "Copy order link") after failed clipboard write | No toast; matches `useClipboard` behavior                                   |
| copied   | Check icon (`ClipboardCopyIcon hasBeenClicked`), label "Order link copied"         | Icon swap + `messages.orderLinkCopied` for 2s                               |

## Mobile considerations

- TopNav action buttons remain in the horizontal toolbar; copy button inherits TopNav flex layout
- Touch target: Macaw secondary `Button` meets ≥44×44 pt minimum
- No additional responsive breakpoints needed — button is icon-only at all viewports

## Accessibility

- Keyboard nav order: back link → title (non-interactive) → copy link button → metadata button → overflow menu
- Copy button exposes `aria-label` matching `title` (updates on copied state)
- Screen-reader flow: "Copy order link, button" → after click → "Order link copied, button"
- Focus ring visible on keyboard focus (verified in Focus story)

## Design decisions

- **Placement before metadata button:** Matches ticket spec; copy is a higher-frequency action than metadata editing
- **Current URL over canonical path:** `window.location.href` preserves filters/query state the user may want to share; alternatives considered: `orderUrl(id)` without params — rejected because it drops active view context
- **Icon feedback only (no toast):** Consistent with `TrackingNumberDisplay` and `CopyableText` patterns in the orders domain; alternatives considered: Sonner toast — rejected as redundant with icon+label feedback
- **Reuse `ClipboardCopyIcon`:** Ticket requirement; extended with optional `size`/`strokeWidth` props (defaults unchanged) to match TopNav icon sizing
