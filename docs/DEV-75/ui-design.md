# UI Design: Order details copy-link button

## Storybook URL

http://localhost:11000/3707029a-aa19-4e82-a21f-d1df94121785

Primary stories under **Orders / OrderCopyLinkButton** (`OrderCopyLinkButton.stories.tsx`).

## Screens / surfaces

### Order details TopNav

- Purpose: one-click copy of the shareable order URL from the page header
- Entry points: navigate to `/orders/{id}` (order details view)
- Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ ←  Order #1234                    [copy] [metadata] [⋮ menu]   │
└─────────────────────────────────────────────────────────────────┘
```

- Components used:
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (TopNav placement via `TopNavShell`)
  - Existing: `TopNav`, metadata `Button`, `ClipboardCopyIcon`
- Interactions:
  - Click / Enter / Space on copy button → writes absolute order URL to clipboard
  - Success → icon toggles Copy → Check for ~2s; `title` / `aria-label` switch to `messages.orderLinkCopied`
- States covered: `default`, `hover`, `focus`, `active`, `disabled`, `copied` (loading / error / empty N/A — sync clipboard, no empty surface)

| State    | Visual                                 | Token / mechanism                                                                                       |
| -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| default  | Secondary icon button, Copy icon       | macaw `Button variant="secondary"`                                                                      |
| hover    | Elevated shadow on button              | macaw secondary hover `box-shadow`; static Storybook via `previewState="hover"` + `.buttonPreviewHover` |
| focus    | 2px outline + 4px focus ring           | `--mu-colors-text-default1` outline + box-shadow (≥3:1 vs `--mu-colors-background-default1`)            |
| active   | Slight scale-down (0.98)               | CSS `:active` on production module; static Storybook via `previewState="active"`                        |
| disabled | Non-interactive, reduced affordance    | macaw disabled + `disabled` attribute                                                                   |
| copied   | Check icon + "Order link copied" label | `ClipboardCopyIcon` + `messages.orderLinkCopied`; static Storybook via `previewState="copied"`          |

Each state story renders a visually distinct static canvas (no `play`-only differentiation).

## Mobile considerations

- TopNav action cluster wraps on narrow viewports
- Copy button matches existing TopNav secondary icon-button sizing (32×32 px, same as metadata button); aligns with established compact TopNav pattern rather than 44×44 pt override
- Touch tap triggers copy (no hover-only affordance on the button itself)

## Accessibility

- Keyboard order: back link → copy link → metadata → menu
- Copy button: `aria-label` mirrors `title`; updates to `messages.orderLinkCopied` after copy
- Focus ring: 2px outline + 4px box-shadow ring, contrast ≥3:1 (WCAG 2.5.5 non-text UI)
- Screen reader: button name announces copy action; copied state reflected in accessible name

## Design decisions

- Reuses `useClipboard` + `ClipboardCopyIcon` per ticket — no new clipboard primitives
- Share URL uses `orderPath(encodeURIComponent(orderId))` (no dialog query params) wrapped with origin + mount URI
- Placed immediately left of metadata button with matching `marginRight={3}` spacing
- Focus and active styles live in production `OrderCopyLinkButton.module.css`, not story-only CSS
- Storybook static states use optional `previewState` prop with production CSS mirror classes (`.buttonPreviewHover`, `.buttonPreviewFocus`, `.buttonPreviewActive`) — not story-isolated CSS
