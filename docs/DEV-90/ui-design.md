# UI Design: Copy order link button in order details TopNav

## Storybook URL

http://localhost:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d

## Screens / surfaces

### Order details TopNav

- Purpose: one-click copy of the shareable order URL from the page header
- Entry points: Orders → select an order → order details view (`OrderDetailsPage`)
- Layout:

```
┌─────────────────────────────────────────────────────────────────────┐
│ ←  Order #1234                    [copy-link] [metadata] [⋮ menu]   │
└─────────────────────────────────────────────────────────────────────┘
```

- Storybook: `Orders/OrderCopyLinkButton` (`OrderCopyLinkButton.stories.tsx`); composition: `InOrderDetailsTopNav`, `InOrderDetailsTopNavNarrow`
- Components used:
  - `OrderCopyLinkButton` — primary interactive control
  - `ClipboardCopyIcon` — icon swap on copied state (reused from `OrderCardTitle`)
- Interactions:
  - Click / Enter / Space on button → copies absolute order URL to clipboard
  - Copied feedback: icon changes copy → check; `aria-label` and `title` change to "Order link copied" for 2s
- States covered: `default`, `hover`, `focus`, `active`, `disabled`, `copied`
- States omitted (N/A): `loading` (sync clipboard write), `error` (useClipboard fails silently today), `empty` (button hidden when no `order.id`)

## Mobile considerations

- TopNav action cluster wraps on narrow viewports; copy button remains in the header action row
- Touch target: Macaw secondary icon button renders **32×32 px**, matching adjacent TopNav secondary controls (metadata, overflow); not enlarged for this ticket
- Responsive breakpoints: inherits dashboard TopNav layout (no custom breakpoint logic)

## Accessibility

- Keyboard nav order: back link → title → copy-link button → metadata button → overflow menu
- Button exposes `aria-label` mirroring `title` (updates on copied state)
- Focus ring: 2px `var(--mu-colors-text-default1)` outline, 2px offset — contrast ≥3:1 vs background
- Screen-reader flow: "Copy order link, button" → after click → "Order link copied, button" (label persists while check icon visible)

## Design decisions

- **Placement before metadata button** — matches ticket spec; groups share + metadata actions before overflow menu (per ticket text).
- **Secondary icon-only button** — matches existing metadata button (`variant="secondary"`, medium icon size via `ClipboardCopyIcon` at 16px inside shared icon component).
- **Copied feedback via icon + label** — reuses established orders-domain pattern (`TrackingNumberDisplay`, `ClipboardCopyIcon`); no toast to avoid notification noise for a frequent action.
- **Focus/hover/active styling in production CSS module** — `OrderCopyLinkButton.module.css` targets `.button` pseudo-states (including `:active svg` icon darken) so Storybook matches integration rendering (no story-only CSS).
- **TopNav composition stories** — `InOrderDetailsTopNav` and `InOrderDetailsTopNavNarrow` render copy + metadata + menu inside `TopNav` for layout verification (addresses iter-001 UI F-003).
- **Storybook `force*` props** — optional `forceHovered`, `forceFocused`, `forceActive`, `forceCopied` args (default `false`) pin transient interaction states for visual regression; production TopNav usage omits them.
- **Alternatives considered:** `CopyableText` rejected — TopNav needs compact icon button, not inline text + hover-reveal copy.

## Contrast commitments

| Element           | Token / rule                                                                                                                               | Minimum ratio                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Focus ring        | `--mu-colors-text-default1` on `--mu-colors-background-default1`                                                                           | ≥3:1 (WCAG 2.5.5)                        |
| Hover background  | `--mu-colors-background-default2` vs default1                                                                                              | Visible delta (non-text)                 |
| Active background | `--mu-colors-background-default3` vs default1                                                                                              | Visible delta (non-text)                 |
| Icon color        | `--mu-colors-text-default2` via `ClipboardCopyIcon`; **active** uses `--mu-colors-text-default1` on button `:active` / `buttonForceActive` | ≥3:1 vs button background in every state |
