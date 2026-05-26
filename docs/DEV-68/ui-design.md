# UI Design: Copy order link button in order details TopNav

## Storybook URL

http://localhost:11000/58530cf6-031b-4460-82e3-7baad41f9541

## Screens / surfaces

### Order details TopNav

- Purpose: One-click copy of a shareable absolute URL for the current order
- Entry points: Orders list → order row → order details (`OrderDetailsPage` for normal/unconfirmed orders)
- Layout:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Orders   Order #1234  [status pill]                                   │
│                              [Copy link] [Metadata ⚙] [⋮ menu]          │
└─────────────────────────────────────────────────────────────────────────┘
```

- Storybook: `Orders/OrderCopyLinkButton` — see `InTopNav` story for placement beside metadata button
- Components used:
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`
  - Reused: `ClipboardCopyIcon`, `useClipboard`, Macaw `Button variant="secondary"`
- Interactions:
  - Click / Enter / Space on copy button → writes absolute order URL to clipboard
  - Icon toggles Copy → Check for ~2s (success feedback)
  - Disabled prop prevents interaction (edge case / future guard)
- States covered: `default`, `hover`, `focus`, `active`, `disabled`, `copied`
  - `loading`, `error`, `empty` omitted — hook has no loading UI; clipboard failure logs to console only; button always has an order ID in production

### State visual spec

| State    | Token / behavior                                                              | Contrast target                          |
| -------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| Default  | `Button variant="secondary"`, `ClipboardCopyIcon` CopyIcon, `color: default2` | Icon vs button bg ≥ 3:1                  |
| Hover    | Macaw secondary hover background (`backgroundColor.hover` on button)          | ≥ 3:1 for icon                           |
| Focus    | Macaw focus ring on button (outline/box-shadow from macaw-ui-next)            | Focus ring ≥ 3:1 vs adjacent bg          |
| Active   | Macaw secondary pressed state while mouse down                                | ≥ 3:1 for icon                           |
| Disabled | Macaw disabled opacity + `pointer-events: none`                               | Meets disabled contrast per macaw tokens |
| Copied   | `ClipboardCopyIcon` CheckIcon + `aria-label`/`title` = "Link copied"          | Check icon vs button bg ≥ 3:1            |

## Mobile considerations

- TopNav action buttons remain icon-only secondary buttons; macaw `Button` meets ≥ 44×44 px touch target at default sizing
- Copy button sits in horizontal TopNav action cluster; no additional mobile breakpoint behavior required beyond existing TopNav responsive layout

## Accessibility

- Keyboard order: back link → page title (non-interactive) → copy link button → metadata button → overflow menu
- Button exposes `aria-label` and `title` from `orderCopyLinkMessages` (updates to "Link copied" in copied state)
- Focus visible via macaw Button focus styles (no custom story-only CSS)
- Screen reader: activating button copies URL; label change to "Link copied" announces success via aria-label update

## Design decisions

- **Placement:** Copy button renders immediately left of metadata button, matching ticket wording and keeping share action adjacent to other order-level actions (`InTopNav` story)
- **Feedback:** Icon toggle via existing `useClipboard` / `ClipboardCopyIcon` — consistent with tracking number and PSP reference copy patterns; no toast (Alternatives considered: toast like gift cards — rejected to match orders domain conventions)
- **URL shape:** Absolute URL without query params via `getAbsoluteOrderUrl(orderId)` — avoids sharing modal-deep-link URLs
- **Icon sizing:** Reuses `ClipboardCopyIcon` at 16px inside secondary TopNav button (existing component; metadata uses 20px Code icon — acceptable minor size delta per ticket mandate to reuse copy-icon component)
