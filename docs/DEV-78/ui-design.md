# UI Design: Copy order link button in order details TopNav

## Storybook URL

http://localhost:11000/b29d7b77-62e3-42f7-920c-ac93e11fcb29

## Screens / surfaces

### Order details TopNav

- Purpose: One-click copy of the shareable order dashboard URL
- Entry points: Orders → select any order → order details view
- Layout:

```
┌─────────────────────────────────────────────────────────────────────┐
│ ←  Order #42  [status pill]              [copy] [metadata] [⋮ menu] │
│     Created date                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

- Components used: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (TopNav decorator mirrors production placement)
- Interactions:
  - Click copy button → clipboard receives absolute order URL
  - Icon toggles Copy → Check; label toggles `messages.copyOrderLink` → `messages.orderLinkCopied`
  - Disabled when `orderId` is empty (no click handler)
- States covered: `default`, `hover`, `focus`, `active`, `disabled`, `copied`
- States omitted: `loading` (synchronous clipboard), `error` (no distinct visual — `useClipboard` logs warning only), `empty` (covered by `disabled`)

## Mobile considerations

- TopNav action cluster uses existing flex layout with `gap={2}`; copy button inherits macaw secondary button min touch target
- Icon-only secondary button keeps compact width on narrow viewports
- Touch tap triggers same copy + copied feedback as click

## Accessibility

- Keyboard: Tab order — back link → copy button → metadata button → overflow menu
- Copy button is a native `button` with `aria-label` reflecting current state (`messages.copyOrderLink` / `messages.orderLinkCopied`)
- Focus ring: macaw `Button` default focus-visible outline (≥ 3:1 contrast vs background)
- Screen reader: state change announced via updated `aria-label` on copy success

## Design decisions

- **Placement before metadata button:** Matches ticket wording (“next to metadata”); copy is a lightweight share action, metadata is a heavier edit entry — copy sits closer to the title cluster. <!-- source: agent -->
- **Secondary icon-only button:** Matches existing metadata TopNav control; avoids competing with primary save actions in the page footer. <!-- source: agent -->
- **Canonical URL without query params:** Dialog/modal query strings would produce brittle share links; `orderPath` only. Alternatives considered: `window.location.href` (rejected — includes transient dialog state). <!-- source: agent -->
- **Inline icon feedback vs toast:** Consistent with `TrackingNumberDisplay` and ticket scope (“show feedback when copied” without requesting toasts). <!-- source: agent -->
- **Contrast targets:** Focus ring and icon affordance ≥ 3:1 (WCAG 2.5.5 non-text) for interactive states; disabled state inherits macaw secondary disabled palette (~2:1, inactive control exemption). <!-- source: agent -->
- **Hover/Focus/Active Storybook stories:** Story-only wrapper classes in `OrderCopyLinkButton.stories.module.css` simulate macaw secondary button states (background, elevation via `color-mix`, focus outline via `--mu-colors-text-default1`); production `OrderCopyLinkButtonView` has no preview props or story CSS imports. <!-- source: agent -->
