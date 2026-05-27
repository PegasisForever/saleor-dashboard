# UI Design: Copy order link button in order details TopNav

## Storybook URL

http://localhost:11000/348e26e0-70be-420f-9890-0f733b21134b

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

- Components used (see also tech-plan § Affected components):
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; wires `useClipboard`
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button
  - `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n strings
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only interaction-state wrapper
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only Macaw token snapshots for hover/focus/active
  - `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state coverage + TopNav composition
  - `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — TopNav integration
  - `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — shared copy/check icon
  - Story: `Orders/OrderCopyLinkButton/InOrderDetailsTopNav`
- Interactions:
  - Click / Enter / Space on copy button → copies `window.location.href` to clipboard
  - On success → icon changes Copy → Check; label changes to "Order link copied" for 2s
  - On clipboard failure → button stays in default state (no visual error affordance)
- States covered: `default`, `hover`, `focus`, `active`, `disabled`, `error`, `copied`
  - `loading` and `empty` omitted — copy is synchronous and always has a URL

| State    | Visual                                                                             | Token / mechanism                                                                                    |
| -------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| default  | Secondary icon button, Copy icon (`ClipboardCopyIcon`), label "Copy order link"    | `Button variant="secondary"`, icon color `default2`                                                  |
| hover    | Secondary button background lightens                                               | Macaw hover token via story preview `--mu-colors-background-button-default-secondary-hovered`        |
| focus    | Background + shadow change (Macaw `:focus-visible` for secondary buttons)          | Macaw focused token `--mu-colors-background-button-default-secondary-focused`; story preview wrapper |
| active   | Secondary button pressed/darker background                                         | Macaw pressed token `--mu-colors-background-button-default-secondary-pressed`; story preview wrapper |
| disabled | Reduced opacity, no pointer events                                                 | `Button disabled` prop                                                                               |
| error    | Unchanged from default (copy icon, "Copy order link") after failed clipboard write | No toast; matches `useClipboard` behavior (visually identical to Default by design)                  |
| copied   | Check icon (`ClipboardCopyIcon hasBeenClicked`), label "Order link copied"         | Icon swap + `messages.orderLinkCopied` for 2s                                                        |

## Mobile considerations

- TopNav action buttons remain in the horizontal toolbar; copy button inherits TopNav flex layout
- Touch target: Macaw secondary icon button renders at 32×32 px, matching the adjacent metadata button (established TopNav icon-button convention; org-wide Macaw compact sizing — not a single-component regression)
- No additional responsive breakpoints needed — button is icon-only at all viewports

## Accessibility

- Keyboard nav order: back link → title (non-interactive) → copy link button → metadata button → overflow menu
- Copy button exposes `aria-label` matching `title` (updates on copied state)
- Screen-reader flow: "Copy order link, button" → after click → "Order link copied, button"
- Focus indicator matches Macaw secondary `:focus-visible` pattern (background + shadow change); icon contrast on focused button surface ≥4.5:1 (verified in Focus story)

## Design decisions

- **Placement before metadata button:** Matches ticket spec; copy is a higher-frequency action than metadata editing
- **Current URL over canonical path:** `window.location.href` preserves filters/query state the user may want to share; alternatives considered: `orderUrl(id)` without params — rejected because it drops active view context
- **Icon feedback only (no toast):** Consistent with `TrackingNumberDisplay` and `CopyableText` patterns in the orders domain; alternatives considered: Sonner toast — rejected as redundant with icon+label feedback
- **Reuse `ClipboardCopyIcon`:** Ticket requirement; extended with optional `size`/`strokeWidth` props (defaults unchanged) to match TopNav icon sizing
- **Storybook interaction states via story-only preview:** Hover/focus/active stories render production `OrderCopyLinkButtonContent` inside `OrderCopyLinkButtonStoryPreview` with Macaw CSS variables in `OrderCopyLinkButton.stories.module.css` — no preview props or hardcoded rgb literals in production files (addresses iteration-001 UI review loop-back). Static Storybook cannot persist `:hover`/`:active` from play functions; story CSS mirrors Macaw token values production Button applies at runtime.
